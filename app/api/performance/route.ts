import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PerformanceRating, ReviewCycle } from '@prisma/client'

/**
 * GET /api/performance
 * Get performance reviews with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const reviewCycle = searchParams.get('reviewCycle')
    const reviewPeriod = searchParams.get('reviewPeriod')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // If not HR/Manager, only show own reviews
    if (!isHR(session.user.role) && !isManager(session.user.role)) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (reviewCycle) {
      where.reviewCycle = reviewCycle as ReviewCycle
    }

    if (reviewPeriod) {
      where.reviewPeriod = reviewPeriod
    }

    const total = await prisma.performance.count({ where })

    const performances = await prisma.performance.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: performances,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching performance reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance reviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/performance
 * Create a new performance review
 * Restricted to HR and Managers
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isHR(session.user.role) && !isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR and Managers can create performance reviews' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.employeeId || !body.reviewCycle || !body.reviewPeriod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if review already exists for this period
    const existingReview = await prisma.performance.findFirst({
      where: {
        employeeId: body.employeeId,
        reviewCycle: body.reviewCycle,
        reviewPeriod: body.reviewPeriod,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Performance review already exists for this period' },
        { status: 400 }
      )
    }

    const performance = await prisma.performance.create({
      data: {
        employeeId: body.employeeId,
        reviewerId: session.user.employeeId,
        reviewCycle: body.reviewCycle,
        reviewPeriod: body.reviewPeriod,
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
        isCompleted: body.isCompleted || false,
        completedAt: body.isCompleted ? new Date() : null,
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

    // TODO: Send notification to employee
    // await createNotification({
    //   userId: employee.userId,
    //   type: 'PERFORMANCE',
    //   title: 'New Performance Review',
    //   message: `Your ${performance.reviewPeriod} performance review has been created`,
    // })

    return NextResponse.json({
      success: true,
      data: performance,
      message: 'Performance review created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating performance review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create performance review' },
      { status: 500 }
    )
  }
}
