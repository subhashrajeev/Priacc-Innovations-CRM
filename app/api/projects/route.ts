import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProjectStatus, ProjectPriority } from '@prisma/client'

/**
 * GET /api/projects
 * List all projects with pagination and filtering
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const clientId = searchParams.get('clientId') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const priority = searchParams.get('priority') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status as ProjectStatus
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (priority) {
      where.priority = priority as ProjectPriority
    }

    // Get total count
    const total = await prisma.project.count({ where })

    // Get projects with relations
    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        timesheets: {
          select: {
            id: true,
            hours: true,
            billable: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            timesheets: true,
            invoices: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    })

    // Enhance projects with calculated fields
    const enhancedProjects = projects.map(project => {
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
      const totalTasks = project.tasks.length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      const totalHours = project.timesheets.reduce((sum, ts) => sum + ts.hours, 0)
      const billableHours = project.timesheets.filter(ts => ts.billable).reduce((sum, ts) => sum + ts.hours, 0)

      const teamMemberIds = project.teamMembers ? project.teamMembers.split(',').filter(Boolean) : []
      const teamSize = teamMemberIds.length

      return {
        ...project,
        progress,
        totalHours,
        billableHours,
        teamSize,
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: enhancedProjects,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 * Restricted to Managers and above
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

    // Check if user has manager role
    if (!isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only managers can create projects' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.code || !body.clientId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingProject = await prisma.project.findUnique({
      where: { code: body.code },
    })

    if (existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project code already exists' },
        { status: 400 }
      )
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: body.clientId },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 400 }
      )
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: body.name,
        code: body.code,
        clientId: body.clientId,
        departmentId: body.departmentId,
        description: body.description,
        objectives: body.objectives,
        status: body.status || 'PLANNING',
        priority: body.priority || 'MEDIUM',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        estimatedBudget: body.estimatedBudget,
        actualCost: body.actualCost || 0,
        projectManager: body.projectManager,
        teamMembers: body.teamMembers ? body.teamMembers.join(',') : null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            timesheets: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
