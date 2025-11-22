import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InterviewStatus, InterviewType } from '@prisma/client'

/**
 * GET /api/recruitment/interviews
 * Get all interviews with filters
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
    const applicationId = searchParams.get('applicationId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (applicationId) {
      where.applicationId = applicationId
    }

    if (status) {
      where.status = status as InterviewStatus
    }

    if (type) {
      where.type = type as InterviewType
    }

    if (date) {
      const searchDate = new Date(date)
      where.scheduledDate = {
        gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        lt: new Date(searchDate.setHours(23, 59, 59, 999)),
      }
    }

    const total = await prisma.interview.count({ where })

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            job: {
              select: {
                id: true,
                title: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' },
      ],
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: interviews,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/interviews
 * Schedule a new interview
 * Restricted to HR
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

    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR can schedule interviews' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.applicationId || !body.type || !body.scheduledDate || !body.scheduledTime || !body.interviewers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if application exists
    const application = await prisma.application.findUnique({
      where: { id: body.applicationId },
    })

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get the next round number
    const lastInterview = await prisma.interview.findFirst({
      where: { applicationId: body.applicationId },
      orderBy: { round: 'desc' },
    })

    const round = lastInterview ? lastInterview.round + 1 : 1

    const interview = await prisma.interview.create({
      data: {
        applicationId: body.applicationId,
        round,
        type: body.type,
        scheduledDate: new Date(body.scheduledDate),
        scheduledTime: body.scheduledTime,
        duration: body.duration || 60,
        location: body.location,
        meetingLink: body.meetingLink,
        interviewers: body.interviewers, // comma-separated interviewer IDs
        status: 'SCHEDULED',
      },
      include: {
        application: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    // Update application status
    await prisma.application.update({
      where: { id: body.applicationId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    })

    // TODO: Send interview invitation email to candidate
    // TODO: Send calendar invite to interviewers

    return NextResponse.json({
      success: true,
      data: interview,
      message: 'Interview scheduled successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error scheduling interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to schedule interview' },
      { status: 500 }
    )
  }
}
