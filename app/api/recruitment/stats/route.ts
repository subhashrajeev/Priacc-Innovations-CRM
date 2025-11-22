import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/recruitment/stats
 * Get recruitment statistics
 * Restricted to HR
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

    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR can view recruitment stats' },
        { status: 403 }
      )
    }

    // Job statistics
    const totalJobs = await prisma.job.count()
    const openJobs = await prisma.job.count({ where: { status: 'OPEN' } })
    const closedJobs = await prisma.job.count({ where: { status: 'CLOSED' } })
    const filledJobs = await prisma.job.count({ where: { status: 'FILLED' } })

    // Application statistics
    const totalApplications = await prisma.application.count()
    const appliedCount = await prisma.application.count({ where: { status: 'APPLIED' } })
    const screeningCount = await prisma.application.count({ where: { status: 'SCREENING' } })
    const shortlistedCount = await prisma.application.count({ where: { status: 'SHORTLISTED' } })
    const interviewScheduledCount = await prisma.application.count({ where: { status: 'INTERVIEW_SCHEDULED' } })
    const interviewedCount = await prisma.application.count({ where: { status: 'INTERVIEWED' } })
    const offeredCount = await prisma.application.count({ where: { status: 'OFFERED' } })
    const acceptedCount = await prisma.application.count({ where: { status: 'ACCEPTED' } })
    const rejectedCount = await prisma.application.count({ where: { status: 'REJECTED' } })

    // Interview statistics
    const totalInterviews = await prisma.interview.count()
    const scheduledInterviews = await prisma.interview.count({ where: { status: 'SCHEDULED' } })
    const completedInterviews = await prisma.interview.count({ where: { status: 'COMPLETED' } })

    // Get today's interviews
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysInterviews = await prisma.interview.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
        status: 'SCHEDULED',
      },
      include: {
        application: {
          select: {
            firstName: true,
            lastName: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    })

    // Application pipeline
    const applicationPipeline = {
      applied: appliedCount,
      screening: screeningCount,
      shortlisted: shortlistedCount,
      interview: interviewScheduledCount + interviewedCount,
      offered: offeredCount,
      accepted: acceptedCount,
    }

    // Recent applications
    const recentApplications = await prisma.application.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    })

    // Top performing sources
    const applications = await prisma.application.findMany({
      select: {
        source: true,
      },
    })

    const sourceCounts = applications.reduce((acc: any, app) => {
      const source = app.source || 'Direct'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    const topSources = Object.entries(sourceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)

    // Time to hire metrics (average days from application to offer)
    const acceptedApplications = await prisma.application.findMany({
      where: {
        status: 'ACCEPTED',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    let avgTimeToHire = 0
    if (acceptedApplications.length > 0) {
      const totalDays = acceptedApplications.reduce((sum, app) => {
        const days = Math.floor(
          (app.updatedAt.getTime() - app.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        return sum + days
      }, 0)
      avgTimeToHire = Math.round(totalDays / acceptedApplications.length)
    }

    const stats = {
      jobs: {
        total: totalJobs,
        open: openJobs,
        closed: closedJobs,
        filled: filledJobs,
      },
      applications: {
        total: totalApplications,
        pipeline: applicationPipeline,
        rejected: rejectedCount,
        conversionRate: totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0,
      },
      interviews: {
        total: totalInterviews,
        scheduled: scheduledInterviews,
        completed: completedInterviews,
        today: todaysInterviews,
      },
      metrics: {
        avgTimeToHire,
        topSources,
      },
      recentApplications,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching recruitment stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recruitment stats' },
      { status: 500 }
    )
  }
}
