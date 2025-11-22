import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateWorkHours } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, location } = body

    // Validate geolocation data
    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: 'Geolocation data is required' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find today's attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.user.employeeId,
          date: today,
        },
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { message: 'No check-in record found for today' },
        { status: 400 }
      )
    }

    if (!attendance.checkInTime) {
      return NextResponse.json(
        { message: 'Cannot check out without checking in first' },
        { status: 400 }
      )
    }

    if (attendance.checkOutTime) {
      return NextResponse.json(
        {
          message: 'Already checked out today',
          attendance,
        },
        { status: 400 }
      )
    }

    const checkOutTime = new Date()
    const workHours = calculateWorkHours(attendance.checkInTime, checkOutTime)
    const overtimeHours = workHours > 9 ? workHours - 9 : 0

    // Update attendance with check-out data
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLatitude: latitude,
        checkOutLongitude: longitude,
        checkOutLocation: location || 'Unknown',
        workHours,
        overtimeHours,
      },
    })

    return NextResponse.json({
      message: 'Checked out successfully',
      attendance: updatedAttendance,
    })
  } catch (error) {
    console.error('Check-out error:', error)
    return NextResponse.json(
      { message: 'Failed to check out' },
      { status: 500 }
    )
  }
}
