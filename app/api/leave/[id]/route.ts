import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LeaveStatus } from '@prisma/client'

// GET - Fetch single leave record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const leave = await prisma.leave.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
            designation: true,
          },
        },
      },
    })

    if (!leave) {
      return NextResponse.json({ message: 'Leave not found' }, { status: 404 })
    }

    // Check permissions
    const canView =
      leave.employeeId === session.user.employeeId ||
      ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'].includes(session.user.role)

    if (!canView) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(leave)
  } catch (error) {
    console.error('Error fetching leave:', error)
    return NextResponse.json(
      { message: 'Failed to fetch leave record' },
      { status: 500 }
    )
  }
}

// PATCH - Update leave (approve/reject/cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, rejectedReason } = body

    if (!action || !['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }

    const leave = await prisma.leave.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!leave) {
      return NextResponse.json({ message: 'Leave not found' }, { status: 404 })
    }

    // Permission checks
    if (action === 'cancel') {
      // Only the employee can cancel their own leave
      if (leave.employeeId !== session.user.employeeId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }

      if (leave.status !== LeaveStatus.PENDING) {
        return NextResponse.json(
          { message: 'Can only cancel pending leaves' },
          { status: 400 }
        )
      }
    } else {
      // Only managers/HR can approve or reject
      const canApprove = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'].includes(
        session.user.role
      )

      if (!canApprove) {
        return NextResponse.json(
          { message: 'You do not have permission to approve/reject leaves' },
          { status: 403 }
        )
      }

      if (leave.status !== LeaveStatus.PENDING) {
        return NextResponse.json(
          { message: 'Can only approve/reject pending leaves' },
          { status: 400 }
        )
      }

      if (action === 'reject' && !rejectedReason) {
        return NextResponse.json(
          { message: 'Rejection reason is required' },
          { status: 400 }
        )
      }
    }

    // Update leave
    const updateData: any = {}

    if (action === 'approve') {
      updateData.status = LeaveStatus.APPROVED
      updateData.approvedBy = session.user.employeeId
      updateData.approvedAt = new Date()

      // Mark attendance as ON_LEAVE for approved dates
      const dates = []
      for (
        let d = new Date(leave.startDate);
        d <= leave.endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(new Date(d))
      }

      await Promise.all(
        dates.map((date) =>
          prisma.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: leave.employeeId,
                date,
              },
            },
            create: {
              employeeId: leave.employeeId,
              date,
              status: 'ON_LEAVE',
            },
            update: {
              status: 'ON_LEAVE',
            },
          })
        )
      )
    } else if (action === 'reject') {
      updateData.status = LeaveStatus.REJECTED
      updateData.rejectedReason = rejectedReason
    } else if (action === 'cancel') {
      updateData.status = LeaveStatus.CANCELLED
    }

    const updatedLeave = await prisma.leave.update({
      where: { id: params.id },
      data: updateData,
    })

    // Send notification to employee
    await prisma.notification.create({
      data: {
        userId: leave.employee.userId,
        type: 'LEAVE',
        title: `Leave ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Cancelled'}`,
        message: `Your ${leave.leaveType} leave has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled'}`,
        link: `/leave`,
      },
    })

    return NextResponse.json({
      message: `Leave ${action}d successfully`,
      leave: updatedLeave,
    })
  } catch (error) {
    console.error('Error updating leave:', error)
    return NextResponse.json(
      { message: 'Failed to update leave' },
      { status: 500 }
    )
  }
}

// DELETE - Delete leave
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const leave = await prisma.leave.findUnique({
      where: { id: params.id },
    })

    if (!leave) {
      return NextResponse.json({ message: 'Leave not found' }, { status: 404 })
    }

    // Only employee or admin can delete
    const canDelete =
      leave.employeeId === session.user.employeeId ||
      ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(session.user.role)

    if (!canDelete) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Can only delete pending or cancelled leaves
    if (![LeaveStatus.PENDING, LeaveStatus.CANCELLED].includes(leave.status)) {
      return NextResponse.json(
        { message: 'Cannot delete approved or rejected leaves' },
        { status: 400 }
      )
    }

    await prisma.leave.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Leave deleted successfully' })
  } catch (error) {
    console.error('Error deleting leave:', error)
    return NextResponse.json(
      { message: 'Failed to delete leave' },
      { status: 500 }
    )
  }
}
