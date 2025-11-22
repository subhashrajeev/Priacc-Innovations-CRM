import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApplicationStatus } from '@prisma/client'

/**
 * GET /api/recruitment/applications
 * Get all applications with filters
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
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (jobId) {
      where.jobId = jobId
    }

    if (status) {
      where.status = status as ApplicationStatus
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.application.count({ where })

    const applications = await prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            code: true,
            location: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        interviews: {
          orderBy: {
            round: 'asc',
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
      data: applications,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/applications
 * Submit a new application
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
        { success: false, error: 'Forbidden: Only HR can create applications' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.jobId || !body.firstName || !body.lastName || !body.email || !body.phone || !body.resumeUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: body.jobId },
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: 'Job is not open for applications' },
        { status: 400 }
      )
    }

    // Check for duplicate application
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId: body.jobId,
        email: body.email,
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'Application already exists for this email' },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        jobId: body.jobId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        currentLocation: body.currentLocation,
        resumeUrl: body.resumeUrl,
        coverLetter: body.coverLetter,
        totalExperience: body.totalExperience,
        currentCompany: body.currentCompany,
        currentCTC: body.currentCTC,
        expectedCTC: body.expectedCTC,
        noticePeriod: body.noticePeriod,
        source: body.source,
        referredBy: body.referredBy,
        status: 'APPLIED',
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

    // TODO: Send confirmation email to candidate
    // TODO: Notify HR team

    return NextResponse.json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
