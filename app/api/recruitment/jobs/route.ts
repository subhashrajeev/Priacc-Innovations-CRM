import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { JobStatus, JobType } from '@prisma/client'

/**
 * GET /api/recruitment/jobs
 * Get all job postings
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
    const status = searchParams.get('status')
    const jobType = searchParams.get('jobType')
    const departmentId = searchParams.get('departmentId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status as JobStatus
    }

    if (jobType) {
      where.jobType = jobType as JobType
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.job.count({ where })

    const jobs = await prisma.job.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            applications: true,
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
      data: jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/jobs
 * Create a new job posting
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
        { success: false, error: 'Forbidden: Only HR can create job postings' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.requirements || !body.responsibilities || !body.location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate job code
    const jobCount = await prisma.job.count()
    const jobCode = body.code || `JOB${String(jobCount + 1).padStart(4, '0')}`

    // Check if job code already exists
    const existingJob = await prisma.job.findUnique({
      where: { code: jobCode },
    })

    if (existingJob) {
      return NextResponse.json(
        { success: false, error: 'Job code already exists' },
        { status: 400 }
      )
    }

    const job = await prisma.job.create({
      data: {
        title: body.title,
        code: jobCode,
        departmentId: body.departmentId,
        designationId: body.designationId,
        description: body.description,
        requirements: body.requirements,
        responsibilities: body.responsibilities,
        jobType: body.jobType || 'FULL_TIME',
        experience: body.experience,
        location: body.location,
        salaryRange: body.salaryRange,
        openings: body.openings || 1,
        status: body.status || 'DRAFT',
        publishedAt: body.status === 'OPEN' ? new Date() : null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: job,
      message: 'Job posting created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job posting' },
      { status: 500 }
    )
  }
}
