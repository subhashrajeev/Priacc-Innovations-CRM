import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/goals/[id]
 * Get a specific goal
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

    const goal = await prisma.goal.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Check access: own goal, or HR/Manager
    if (
      goal.employeeId !== session.user.employeeId &&
      !isHR(session.user.role) &&
      !isManager(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: goal,
    })
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goal' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/goals/[id]
 * Update a goal (progress, status, etc.)
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

    const goal = await prisma.goal.findUnique({
      where: { id: params.id },
    })

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Check access: own goal, or HR/Manager
    if (
      goal.employeeId !== session.user.employeeId &&
      !isHR(session.user.role) &&
      !isManager(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updatedGoal = await prisma.goal.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        status: body.status,
        progress: body.progress,
        keyResults: body.keyResults,
        completedDate: body.status === 'COMPLETED' && !goal.completedDate ? new Date() : goal.completedDate,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedGoal,
      message: 'Goal updated successfully',
    })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/goals/[id]
 * Delete a goal
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

    const goal = await prisma.goal.findUnique({
      where: { id: params.id },
    })

    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Check access: own goal, or HR/Manager
    if (
      goal.employeeId !== session.user.employeeId &&
      !isHR(session.user.role) &&
      !isManager(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.goal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
