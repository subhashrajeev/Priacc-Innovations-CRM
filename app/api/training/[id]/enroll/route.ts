import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EnrollmentStatus } from '@prisma/client'

/**
 * POST /api/training/[id]/enroll
 * Enroll in a training
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if training exists
    const training = await prisma.training.findUnique({
      where: { id: params.id },
      include: {
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

    // Check if training is accepting enrollments
    if (training.status === 'COMPLETED' || training.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Training is not accepting enrollments' },
        { status: 400 }
      )
    }

    // Check if max participants limit reached
    if (training.maxParticipants && training._count.enrollments >= training.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Training is full' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existing = await prisma.employeeTraining.findUnique({
      where: {
        employeeId_trainingId: {
          employeeId: session.user.employeeId,
          trainingId: params.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this training' },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.employeeTraining.create({
      data: {
        employeeId: session.user.employeeId,
        trainingId: params.id,
        status: EnrollmentStatus.ENROLLED,
      },
      include: {
        training: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'TRAINING',
        title: 'Training Enrollment Successful',
        message: `You have successfully enrolled in ${training.title}`,
        link: `/training/my-trainings`,
      },
    })

    return NextResponse.json({
      success: true,
      data: enrollment,
      message: 'Enrolled successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error enrolling in training:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enroll in training' },
      { status: 500 }
    )
  }
}
