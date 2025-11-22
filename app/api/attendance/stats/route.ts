import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@prisma/client'

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
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // Get total days in month
    const totalDays = endDate.getDate()

    // Fetch all attendance records for the month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Count weekends
    let weekends = 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day === 0 || day === 6) weekends++
    }

    // Fetch holidays in this month
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate stats
    const present = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.WORK_FROM_HOME
    ).length

    const halfDays = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.HALF_DAY
    ).length

    const onLeave = attendanceRecords.filter(
      (a) => a.status === AttendanceStatus.ON_LEAVE
    ).length

    const holidayCount = holidays.length

    const workingDays = totalDays - weekends - holidayCount
    const absent = workingDays - present - halfDays - onLeave

    // Calculate total work hours
    const totalWorkHours = attendanceRecords.reduce(
      (sum, record) => sum + (record.workHours || 0),
      0
    )

    const totalOvertimeHours = attendanceRecords.reduce(
      (sum, record) => sum + (record.overtimeHours || 0),
      0
    )

    // Calculate average check-in and check-out times
    const recordsWithTimes = attendanceRecords.filter(
      (r) => r.checkInTime && r.checkOutTime
    )

    let avgCheckInTime = null
    let avgCheckOutTime = null

    if (recordsWithTimes.length > 0) {
      const avgCheckInMinutes =
        recordsWithTimes.reduce((sum, r) => {
          const time = new Date(r.checkInTime!)
          return sum + time.getHours() * 60 + time.getMinutes()
        }, 0) / recordsWithTimes.length

      const avgCheckOutMinutes =
        recordsWithTimes.reduce((sum, r) => {
          const time = new Date(r.checkOutTime!)
          return sum + time.getHours() * 60 + time.getMinutes()
        }, 0) / recordsWithTimes.length

      const hours1 = Math.floor(avgCheckInMinutes / 60)
      const mins1 = Math.floor(avgCheckInMinutes % 60)
      avgCheckInTime = `${String(hours1).padStart(2, '0')}:${String(mins1).padStart(2, '0')}`

      const hours2 = Math.floor(avgCheckOutMinutes / 60)
      const mins2 = Math.floor(avgCheckOutMinutes % 60)
      avgCheckOutTime = `${String(hours2).padStart(2, '0')}:${String(mins2).padStart(2, '0')}`
    }

    const stats = {
      totalDays,
      workingDays,
      present,
      absent,
      halfDays,
      onLeave,
      holidays: holidayCount,
      weekends,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      avgCheckInTime,
      avgCheckOutTime,
      attendancePercentage:
        workingDays > 0
          ? Math.round(((present + halfDays * 0.5) / workingDays) * 100)
          : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching attendance stats:', error)
    return NextResponse.json(
      { message: 'Failed to fetch attendance statistics' },
      { status: 500 }
    )
  }
}
