import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance/stats
 * Get performance statistics
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
    const employeeId = searchParams.get('employeeId') || session.user.employeeId

    // Check access
    if (
      employeeId !== session.user.employeeId &&
      !isHR(session.user.role) &&
      !isManager(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get performance reviews
    const performances = await prisma.performance.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      take: 12, // Last 12 reviews
    })

    // Get goals statistics
    const totalGoals = await prisma.goal.count({
      where: { employeeId },
    })

    const completedGoals = await prisma.goal.count({
      where: {
        employeeId,
        status: 'COMPLETED',
      },
    })

    const inProgressGoals = await prisma.goal.count({
      where: {
        employeeId,
        status: 'IN_PROGRESS',
      },
    })

    const overdueGoals = await prisma.goal.count({
      where: {
        employeeId,
        status: {
          in: ['NOT_STARTED', 'IN_PROGRESS'],
        },
        dueDate: {
          lt: new Date(),
        },
      },
    })

    // Calculate average ratings
    const completedReviews = performances.filter(p => p.isCompleted)

    let avgTechnicalSkills = 0
    let avgCommunication = 0
    let avgTeamwork = 0
    let avgLeadership = 0
    let avgInitiative = 0
    let avgProblemSolving = 0

    if (completedReviews.length > 0) {
      avgTechnicalSkills = completedReviews.reduce((sum, p) => sum + (p.technicalSkills || 0), 0) / completedReviews.length
      avgCommunication = completedReviews.reduce((sum, p) => sum + (p.communication || 0), 0) / completedReviews.length
      avgTeamwork = completedReviews.reduce((sum, p) => sum + (p.teamwork || 0), 0) / completedReviews.length
      avgLeadership = completedReviews.reduce((sum, p) => sum + (p.leadership || 0), 0) / completedReviews.length
      avgInitiative = completedReviews.reduce((sum, p) => sum + (p.initiative || 0), 0) / completedReviews.length
      avgProblemSolving = completedReviews.reduce((sum, p) => sum + (p.problemSolving || 0), 0) / completedReviews.length
    }

    // Performance trend data
    const performanceTrend = performances.map(p => ({
      period: p.reviewPeriod,
      overallRating: p.overallRating,
      technicalSkills: p.technicalSkills,
      communication: p.communication,
      teamwork: p.teamwork,
      leadership: p.leadership,
    }))

    // Rating distribution
    const ratingDistribution = {
      OUTSTANDING: performances.filter(p => p.overallRating === 'OUTSTANDING').length,
      EXCEEDS_EXPECTATIONS: performances.filter(p => p.overallRating === 'EXCEEDS_EXPECTATIONS').length,
      MEETS_EXPECTATIONS: performances.filter(p => p.overallRating === 'MEETS_EXPECTATIONS').length,
      NEEDS_IMPROVEMENT: performances.filter(p => p.overallRating === 'NEEDS_IMPROVEMENT').length,
      UNSATISFACTORY: performances.filter(p => p.overallRating === 'UNSATISFACTORY').length,
    }

    const stats = {
      performance: {
        totalReviews: performances.length,
        completedReviews: completedReviews.length,
        latestRating: performances[0]?.overallRating || null,
        averageRatings: {
          technicalSkills: Math.round(avgTechnicalSkills * 10) / 10,
          communication: Math.round(avgCommunication * 10) / 10,
          teamwork: Math.round(avgTeamwork * 10) / 10,
          leadership: Math.round(avgLeadership * 10) / 10,
          initiative: Math.round(avgInitiative * 10) / 10,
          problemSolving: Math.round(avgProblemSolving * 10) / 10,
        },
        ratingDistribution,
        performanceTrend,
      },
      goals: {
        total: totalGoals,
        completed: completedGoals,
        inProgress: inProgressGoals,
        overdue: overdueGoals,
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching performance stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance stats' },
      { status: 500 }
    )
  }
}
