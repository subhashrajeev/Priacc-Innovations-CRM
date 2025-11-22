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
    const { date, checkInTime, checkOutTime, reason, status } = body

    if (!date || !reason) {
      return NextResponse.json(
        { message: 'Date and reason are required' },
        { status: 400 }
      )
    }

    const regularizationDate = new Date(date)
    regularizationDate.setHours(0, 0, 0, 0)

    // Check if date is not in future
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (regularizationDate > today) {
      return NextResponse.json(
        { message: 'Cannot regularize future dates' },
        { status: 400 }
      )
    }

    // Check if date is not too old (e.g., more than 30 days)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (regularizationDate < thirtyDaysAgo) {
      return NextResponse.json(
        { message: 'Cannot regularize attendance older than 30 days' },
        { status: 400 }
      )
    }

    // Create notification for manager approval
    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      select: {
        reportingManagerId: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      )
    }

    // For now, we'll store the regularization request in the attendance notes
    // In a production system, you'd want a separate RegularizationRequest model
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.user.employeeId,
          date: regularizationDate,
        },
      },
    })

    let attendance
    const regularizationNote = `REGULARIZATION REQUEST: ${reason}`

    if (existingAttendance) {
      // Update existing attendance
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkInTime: checkInTime ? new Date(checkInTime) : existingAttendance.checkInTime,
          checkOutTime: checkOutTime ? new Date(checkOutTime) : existingAttendance.checkOutTime,
          status: status || existingAttendance.status,
          notes: regularizationNote,
        },
      })
    } else {
      // Create new attendance record
      attendance = await prisma.attendance.create({
        data: {
          employeeId: session.user.employeeId,
          date: regularizationDate,
          checkInTime: checkInTime ? new Date(checkInTime) : null,
          checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
          status: status || AttendanceStatus.ABSENT,
          notes: regularizationNote,
        },
      })
    }

    // Create notification for reporting manager if exists
    if (employee.reportingManagerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: employee.reportingManagerId },
        select: { userId: true },
      })

      if (manager) {
        await prisma.notification.create({
          data: {
            userId: manager.userId,
            type: 'ATTENDANCE',
            title: 'Attendance Regularization Request',
            message: `${employee.firstName} ${employee.lastName} has requested to regularize attendance for ${regularizationDate.toDateString()}`,
            link: `/attendance/team?employeeId=${session.user.employeeId}`,
          },
        })
      }
    }

    return NextResponse.json({
      message: 'Regularization request submitted successfully',
      attendance,
    })
  } catch (error) {
    console.error('Regularization error:', error)
    return NextResponse.json(
      { message: 'Failed to submit regularization request' },
      { status: 500 }
    )
  }
}
