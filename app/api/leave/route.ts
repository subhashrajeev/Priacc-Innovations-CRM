import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LeaveType, LeaveStatus } from '@prisma/client'

// GET - Fetch leave records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') || session.user.employeeId
    const status = searchParams.get('status')
    const leaveType = searchParams.get('leaveType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Check if user can view other employees' data
    const canViewOthers = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'].includes(session.user.role)
    if (employeeId !== session.user.employeeId && !canViewOthers) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const where: any = { employeeId }

    if (status) {
      where.status = status as LeaveStatus
    }

    if (leaveType) {
      where.leaveType = leaveType as LeaveType
    }

    if (startDate || endDate) {
      where.startDate = {}
      if (startDate) where.startDate.gte = new Date(startDate)
      if (endDate) where.startDate.lte = new Date(endDate)
    }

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(leaves)
  } catch (error) {
    console.error('Error fetching leaves:', error)
    return NextResponse.json(
      { message: 'Failed to fetch leave records' },
      { status: 500 }
    )
  }
}

// POST - Apply for leave
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leaveType, startDate, endDate, halfDay, reason, documentUrl } = body

    // Validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return NextResponse.json(
        { message: 'Start date cannot be after end date' },
        { status: 400 }
      )
    }

    // Calculate total days
    let totalDays = 0
    if (halfDay) {
      totalDays = 0.5
    } else {
      const diffTime = Math.abs(end.getTime() - start.getTime())
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    // Check if leave type requires document
    const policy = await prisma.leavePolicy.findUnique({
      where: { leaveType: leaveType as LeaveType },
    })

    if (policy?.requiresDocument && !documentUrl) {
      return NextResponse.json(
        { message: 'Document is required for this leave type' },
        { status: 400 }
      )
    }

    // Check leave balance
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)
    const yearEnd = new Date(currentYear, 11, 31)

    const usedLeaves = await prisma.leave.findMany({
      where: {
        employeeId: session.user.employeeId,
        leaveType: leaveType as LeaveType,
        status: {
          in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
        },
        startDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    })

    const totalUsed = usedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0)
    const available = (policy?.totalDays || 0) - totalUsed

    if (totalDays > available && leaveType !== 'LOSS_OF_PAY') {
      return NextResponse.json(
        {
          message: `Insufficient leave balance. Available: ${available} days`,
        },
        { status: 400 }
      )
    }

    // Check for overlapping leaves
    const overlapping = await prisma.leave.findFirst({
      where: {
        employeeId: session.user.employeeId,
        status: {
          in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { message: 'Leave dates overlap with existing leave' },
        { status: 400 }
      )
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        employeeId: session.user.employeeId,
        leaveType: leaveType as LeaveType,
        startDate: start,
        endDate: end,
        totalDays,
        halfDay: halfDay || false,
        reason,
        documentUrl,
        status: LeaveStatus.PENDING,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            reportingManagerId: true,
          },
        },
      },
    })

    // Notify reporting manager
    if (leave.employee.reportingManagerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: leave.employee.reportingManagerId },
        select: { userId: true },
      })

      if (manager) {
        await prisma.notification.create({
          data: {
            userId: manager.userId,
            type: 'LEAVE',
            title: 'New Leave Request',
            message: `${leave.employee.firstName} ${leave.employee.lastName} has applied for ${leaveType} leave`,
            link: `/leave/approvals`,
          },
        })
      }
    }

    return NextResponse.json({
      message: 'Leave application submitted successfully',
      leave,
    })
  } catch (error) {
    console.error('Error applying for leave:', error)
    return NextResponse.json(
      { message: 'Failed to apply for leave' },
      { status: 500 }
    )
  }
}
