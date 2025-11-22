import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, location, isRemote } = body

    // Validate geolocation data
    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: 'Geolocation data is required' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.user.employeeId,
          date: today,
        },
      },
    })

    if (existingAttendance?.checkInTime) {
      return NextResponse.json(
        {
          message: 'Already checked in today',
          attendance: existingAttendance,
        },
        { status: 400 }
      )
    }

    const checkInTime = new Date()

    // Create or update attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: session.user.employeeId,
          date: today,
        },
      },
      create: {
        employeeId: session.user.employeeId,
        date: today,
        checkInTime,
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInLocation: location || 'Unknown',
        status: isRemote ? AttendanceStatus.WORK_FROM_HOME : AttendanceStatus.PRESENT,
        isRemote: isRemote || false,
      },
      update: {
        checkInTime,
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInLocation: location || 'Unknown',
        status: isRemote ? AttendanceStatus.WORK_FROM_HOME : AttendanceStatus.PRESENT,
        isRemote: isRemote || false,
      },
    })

    return NextResponse.json({
      message: 'Checked in successfully',
      attendance,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { message: 'Failed to check in' },
      { status: 500 }
    )
  }
}
