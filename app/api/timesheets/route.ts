import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/timesheets
 * List all timesheets with pagination and filtering
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const employeeId = searchParams.get('employeeId') || session.user.employeeId
    const projectId = searchParams.get('projectId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const approved = searchParams.get('approved')
    const billable = searchParams.get('billable')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      }
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      }
    }

    if (approved !== null && approved !== undefined && approved !== '') {
      where.approved = approved === 'true'
    }

    if (billable !== null && billable !== undefined && billable !== '') {
      where.billable = billable === 'true'
    }

    // Get total count
    const total = await prisma.timesheet.count({ where })

    // Get timesheets
    const timesheets = await prisma.timesheet.findMany({
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
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: timesheets,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching timesheets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch timesheets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/timesheets
 * Create a new timesheet entry
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
    if (!body.projectId || !body.date || !body.hours) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: projectId, date, hours' },
        { status: 400 }
      )
    }

    // Validate hours
    if (body.hours <= 0 || body.hours > 24) {
      return NextResponse.json(
        { success: false, error: 'Hours must be between 0 and 24' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 400 }
      )
    }

    // Use logged-in user's employeeId or provided employeeId (for managers)
    const employeeId = body.employeeId || session.user.employeeId

    // Create timesheet
    const timesheet = await prisma.timesheet.create({
      data: {
        employeeId,
        projectId: body.projectId,
        date: new Date(body.date),
        hours: body.hours,
        description: body.description,
        taskType: body.taskType,
        billable: body.billable !== undefined ? body.billable : true,
        approved: false,
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
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: timesheet,
      message: 'Timesheet entry created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating timesheet:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create timesheet entry' },
      { status: 500 }
    )
  }
}
