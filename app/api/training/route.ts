import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TrainingType, TrainingStatus } from '@prisma/client'

/**
 * GET /api/training
 * List all trainings with filtering
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
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (type) {
      where.type = type as TrainingType
    }

    if (status) {
      where.status = status as TrainingStatus
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const trainings = await prisma.training.findMany({
      where,
      include: {
        enrollments: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: trainings,
    })
  } catch (error) {
    console.error('Error fetching trainings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trainings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/training
 * Create a new training (HR only)
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
        { success: false, error: 'Forbidden: Only HR can create trainings' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validation
    if (!body.title || !body.type || !body.startDate || !body.endDate || !body.duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate training code
    const count = await prisma.training.count()
    const code = body.code || `TRN-${String(count + 1).padStart(5, '0')}`

    // Check if code already exists
    const existing = await prisma.training.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Training code already exists' },
        { status: 400 }
      )
    }

    const training = await prisma.training.create({
      data: {
        title: body.title,
        code,
        description: body.description,
        type: body.type as TrainingType,
        status: body.status || TrainingStatus.UPCOMING,
        trainer: body.trainer,
        trainingMode: body.trainingMode,
        location: body.location,
        meetingLink: body.meetingLink,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        duration: body.duration,
        maxParticipants: body.maxParticipants,
        cost: body.cost,
        materials: body.materials,
      },
    })

    // Create notification for all employees if required
    if (body.notifyAll) {
      const employees = await prisma.employee.findMany({
        select: { userId: true },
      })

      await prisma.notification.createMany({
        data: employees.map((emp) => ({
          userId: emp.userId,
          type: 'TRAINING',
          title: 'New Training Available',
          message: `${training.title} training is now available for enrollment`,
          link: `/training/${training.id}`,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: training,
      message: 'Training created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating training:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create training' },
      { status: 500 }
    )
  }
}
