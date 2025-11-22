import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoalStatus, GoalPriority } from '@prisma/client'

/**
 * GET /api/goals
 * Get goals with filters
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
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // If not HR/Manager, only show own goals
    if (!isHR(session.user.role) && !isManager(session.user.role)) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (status) {
      where.status = status as GoalStatus
    }

    if (priority) {
      where.priority = priority as GoalPriority
    }

    const total = await prisma.goal.count({ where })

    const goals = await prisma.goal.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: goals,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/goals
 * Create a new goal
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

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.startDate || !body.dueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Determine employee ID (HR/Manager can create for others)
    let targetEmployeeId = session.user.employeeId

    if (body.employeeId && (isHR(session.user.role) || isManager(session.user.role))) {
      targetEmployeeId = body.employeeId
    }

    const goal = await prisma.goal.create({
      data: {
        employeeId: targetEmployeeId,
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'NOT_STARTED',
        startDate: new Date(body.startDate),
        dueDate: new Date(body.dueDate),
        progress: body.progress || 0,
        keyResults: body.keyResults || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    // TODO: Send notification
    // await createNotification({
    //   userId: employee.userId,
    //   type: 'PERFORMANCE',
    //   title: 'New Goal Assigned',
    //   message: `A new goal "${goal.title}" has been assigned to you`,
    // })

    return NextResponse.json({
      success: true,
      data: goal,
      message: 'Goal created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
