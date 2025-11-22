import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TrainingType, TrainingStatus } from '@prisma/client'

/**
 * GET /api/training/[id]
 * Get training details
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

    const training = await prisma.training.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: training,
    })
  } catch (error) {
    console.error('Error fetching training:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/training/[id]
 * Update training (HR only)
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
        { success: false, error: 'Forbidden: Only HR can update trainings' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const training = await prisma.training.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type as TrainingType,
        status: body.status as TrainingStatus,
        trainer: body.trainer,
        trainingMode: body.trainingMode,
        location: body.location,
        meetingLink: body.meetingLink,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        duration: body.duration,
        maxParticipants: body.maxParticipants,
        cost: body.cost,
        materials: body.materials,
      },
    })

    return NextResponse.json({
      success: true,
      data: training,
      message: 'Training updated successfully',
    })
  } catch (error) {
    console.error('Error updating training:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update training' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/training/[id]
 * Delete training (HR only)
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
        { success: false, error: 'Forbidden: Only HR can delete trainings' },
        { status: 403 }
      )
    }

    await prisma.training.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Training deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting training:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete training' },
      { status: 500 }
    )
  }
}
