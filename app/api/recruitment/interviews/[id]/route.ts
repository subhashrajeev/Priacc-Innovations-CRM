import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/recruitment/interviews/[id]
 * Get a specific interview
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

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        application: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            resumeUrl: true,
            totalExperience: true,
            currentCompany: true,
            job: {
              select: {
                id: true,
                title: true,
                code: true,
                description: true,
                requirements: true,
              },
            },
          },
        },
      },
    })

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: interview,
    })
  } catch (error) {
    console.error('Error fetching interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch interview' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/recruitment/interviews/[id]
 * Update interview (add feedback, change status, etc.)
 * Restricted to HR and interviewers
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

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
    })

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    // Check if user is authorized (HR or interviewer)
    const isInterviewer = interview.interviewers.includes(session.user.employeeId || '')

    if (!isHR(session.user.role) && !isInterviewer) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updatedInterview = await prisma.interview.update({
      where: { id: params.id },
      data: {
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : interview.scheduledDate,
        scheduledTime: body.scheduledTime || interview.scheduledTime,
        duration: body.duration || interview.duration,
        location: body.location,
        meetingLink: body.meetingLink,
        status: body.status || interview.status,
        feedback: body.feedback,
        rating: body.rating,
        recommendation: body.recommendation,
      },
      include: {
        application: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Update application status based on interview status
    if (body.status === 'COMPLETED') {
      await prisma.application.update({
        where: { id: interview.applicationId },
        data: { status: 'INTERVIEWED' },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedInterview,
      message: 'Interview updated successfully',
    })
  } catch (error) {
    console.error('Error updating interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update interview' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recruitment/interviews/[id]
 * Cancel/Delete an interview
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
        { success: false, error: 'Forbidden: Only HR can cancel interviews' },
        { status: 403 }
      )
    }

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
    })

    if (!interview) {
      return NextResponse.json(
        { success: false, error: 'Interview not found' },
        { status: 404 }
      )
    }

    await prisma.interview.delete({
      where: { id: params.id },
    })

    // TODO: Send cancellation email to candidate and interviewers

    return NextResponse.json({
      success: true,
      message: 'Interview cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling interview:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel interview' },
      { status: 500 }
    )
  }
}
