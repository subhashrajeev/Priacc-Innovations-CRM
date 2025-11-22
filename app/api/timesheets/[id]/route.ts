import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/timesheets/[id]
 * Get a single timesheet entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!timesheet) {
      return NextResponse.json(
        { success: false, error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this timesheet
    if (timesheet.employeeId !== session.user.employeeId && !isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: timesheet,
    })
  } catch (error) {
    console.error('Error fetching timesheet:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timesheet' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/timesheets/[id]
 * Update a timesheet entry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Check if timesheet exists
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
    })

    if (!existingTimesheet) {
      return NextResponse.json(
        { success: false, error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update this timesheet
    const isOwner = existingTimesheet.employeeId === session.user.employeeId
    const canManage = isManager(session.user.role)

    if (!isOwner && !canManage) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Don't allow editing approved timesheets unless user is manager
    if (existingTimesheet.approved && !canManage) {
      return NextResponse.json(
        { success: false, error: 'Cannot edit approved timesheet' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (body.projectId !== undefined) updateData.projectId = body.projectId
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.hours !== undefined) {
      if (body.hours <= 0 || body.hours > 24) {
        return NextResponse.json(
          { success: false, error: 'Hours must be between 0 and 24' },
          { status: 400 }
        )
      }
      updateData.hours = body.hours
    }
    if (body.description !== undefined) updateData.description = body.description
    if (body.taskType !== undefined) updateData.taskType = body.taskType
    if (body.billable !== undefined) updateData.billable = body.billable

    // Only managers can approve/unapprove timesheets
    if (canManage) {
      if (body.approved !== undefined) {
        updateData.approved = body.approved
        if (body.approved) {
          updateData.approvedBy = session.user.employeeId
          updateData.approvedAt = new Date()
        } else {
          updateData.approvedBy = null
          updateData.approvedAt = null
        }
      }
    }

    // Update timesheet
    const timesheet = await prisma.timesheet.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: timesheet,
      message: 'Timesheet updated successfully',
    })
  } catch (error) {
    console.error('Error updating timesheet:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update timesheet' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/timesheets/[id]
 * Delete a timesheet entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if timesheet exists
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
    })

    if (!timesheet) {
      return NextResponse.json(
        { success: false, error: 'Timesheet not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete this timesheet
    const isOwner = timesheet.employeeId === session.user.employeeId
    const canManage = isManager(session.user.role)

    if (!isOwner && !canManage) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Don't allow deleting approved timesheets unless user is manager
    if (timesheet.approved && !canManage) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete approved timesheet' },
        { status: 400 }
      )
    }

    // Delete timesheet
    await prisma.timesheet.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Timesheet deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting timesheet:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete timesheet' },
      { status: 500 }
    )
  }
}
