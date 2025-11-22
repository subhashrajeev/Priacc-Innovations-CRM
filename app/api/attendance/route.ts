import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@prisma/client'
import { calculateWorkHours } from '@/lib/utils'

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const employeeId = searchParams.get('employeeId') || session.user.employeeId

    // Check if user can view other employees' data
    const canViewOthers = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'].includes(session.user.role)
    if (employeeId !== session.user.employeeId && !canViewOthers) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      startDate = new Date(year, monthNum - 1, 1)
      endDate = new Date(year, monthNum, 0, 23, 59, 59)
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { message: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

// POST - Create attendance record (check-in/check-out)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, latitude, longitude, location, notes } = body

    if (!type || !['checkin', 'checkout'].includes(type)) {
      return NextResponse.json({ message: 'Invalid type' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find or create today's attendance record
    let attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.user.employeeId,
          date: today,
        },
      },
    })

    if (type === 'checkin') {
      if (attendance?.checkInTime) {
        return NextResponse.json(
          { message: 'Already checked in today' },
          { status: 400 }
        )
      }

      attendance = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: session.user.employeeId,
            date: today,
          },
        },
        create: {
          employeeId: session.user.employeeId,
          date: today,
          checkInTime: new Date(),
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkInLocation: location,
          status: AttendanceStatus.PRESENT,
          notes,
        },
        update: {
          checkInTime: new Date(),
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkInLocation: location,
          status: AttendanceStatus.PRESENT,
          notes,
        },
      })

      return NextResponse.json({
        message: 'Checked in successfully',
        attendance,
      })
    } else {
      // checkout
      if (!attendance) {
        return NextResponse.json(
          { message: 'No check-in record found for today' },
          { status: 400 }
        )
      }

      if (attendance.checkOutTime) {
        return NextResponse.json(
          { message: 'Already checked out today' },
          { status: 400 }
        )
      }

      if (!attendance.checkInTime) {
        return NextResponse.json(
          { message: 'Cannot check out without checking in' },
          { status: 400 }
        )
      }

      const checkOutTime = new Date()
      const workHours = calculateWorkHours(attendance.checkInTime, checkOutTime)

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime,
          checkOutLatitude: latitude,
          checkOutLongitude: longitude,
          checkOutLocation: location,
          workHours,
          overtimeHours: workHours > 9 ? workHours - 9 : 0,
        },
      })

      return NextResponse.json({
        message: 'Checked out successfully',
        attendance,
      })
    }
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { message: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}
