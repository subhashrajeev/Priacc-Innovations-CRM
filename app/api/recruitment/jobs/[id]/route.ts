import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/recruitment/jobs/[id]
 * Get a specific job posting
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

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        applications: {
          include: {
            interviews: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: job,
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/recruitment/jobs/[id]
 * Update a job posting
 * Restricted to HR
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

    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR can update job postings' },
        { status: 403 }
      )
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: {
        title: body.title,
        departmentId: body.departmentId,
        designationId: body.designationId,
        description: body.description,
        requirements: body.requirements,
        responsibilities: body.responsibilities,
        jobType: body.jobType,
        experience: body.experience,
        location: body.location,
        salaryRange: body.salaryRange,
        openings: body.openings,
        status: body.status,
        publishedAt: body.status === 'OPEN' && !job.publishedAt ? new Date() : job.publishedAt,
        closedAt: body.status === 'CLOSED' && !job.closedAt ? new Date() : job.closedAt,
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
      data: updatedJob,
      message: 'Job posting updated successfully',
    })
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update job posting' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recruitment/jobs/[id]
 * Delete a job posting
 * Restricted to HR
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
        { success: false, error: 'Forbidden: Only HR can delete job postings' },
        { status: 403 }
      )
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job._count.applications > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete job with applications. Please close it instead.' },
        { status: 400 }
      )
    }

    await prisma.job.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Job posting deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete job posting' },
      { status: 500 }
    )
  }
}
