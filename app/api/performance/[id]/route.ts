import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance/[id]
 * Get a specific performance review
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

    const performance = await prisma.performance.findUnique({
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
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!performance) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 }
      )
    }

    // Check access: own review, or HR/Manager
    if (
      performance.employeeId !== session.user.employeeId &&
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
      data: performance,
    })
  } catch (error) {
    console.error('Error fetching performance review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance review' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/performance/[id]
 * Update a performance review
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

    const performance = await prisma.performance.findUnique({
      where: { id: params.id },
    })

    if (!performance) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Employee can only update their comments
    if (
      performance.employeeId === session.user.employeeId &&
      !isHR(session.user.role) &&
      !isManager(session.user.role)
    ) {
      if (Object.keys(body).some(key => key !== 'employeeComments')) {
        return NextResponse.json(
          { success: false, error: 'Employees can only update their comments' },
          { status: 403 }
        )
      }
    }

    // Only HR/Manager can update the review
    if (
      performance.employeeId !== session.user.employeeId &&
      !isHR(session.user.role) &&
      !isManager(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updatedPerformance = await prisma.performance.update({
      where: { id: params.id },
      data: {
        overallRating: body.overallRating,
        technicalSkills: body.technicalSkills,
        communication: body.communication,
        teamwork: body.teamwork,
        leadership: body.leadership,
        initiative: body.initiative,
        problemSolving: body.problemSolving,
        strengths: body.strengths,
        areasOfImprovement: body.areasOfImprovement,
        reviewerComments: body.reviewerComments,
        employeeComments: body.employeeComments,
        goalsAchieved: body.goalsAchieved,
        totalGoals: body.totalGoals,
        isCompleted: body.isCompleted,
        completedAt: body.isCompleted && !performance.isCompleted ? new Date() : performance.completedAt,
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
      data: updatedPerformance,
      message: 'Performance review updated successfully',
    })
  } catch (error) {
    console.error('Error updating performance review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update performance review' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/performance/[id]
 * Delete a performance review
 * Restricted to HR only
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

    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR can delete performance reviews' },
        { status: 403 }
      )
    }

    const performance = await prisma.performance.findUnique({
      where: { id: params.id },
    })

    if (!performance) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 }
      )
    }

    await prisma.performance.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Performance review deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting performance review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete performance review' },
      { status: 500 }
    )
  }
}
