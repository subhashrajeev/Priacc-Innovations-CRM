import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/projects/[id]
 * Get a single project by ID with full details
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

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        department: true,
        tasks: {
          include: {
            project: {
              select: {
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        timesheets: {
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
          orderBy: {
            date: 'desc',
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
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
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate project metrics
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
    const totalTasks = project.tasks.length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const totalHours = project.timesheets.reduce((sum, ts) => sum + ts.hours, 0)
    const billableHours = project.timesheets.filter(ts => ts.billable).reduce((sum, ts) => sum + ts.hours, 0)
    const nonBillableHours = totalHours - billableHours

    const teamMemberIds = project.teamMembers ? project.teamMembers.split(',').filter(Boolean) : []

    // Get team member details
    let teamMembers = []
    if (teamMemberIds.length > 0) {
      teamMembers = await prisma.employee.findMany({
        where: {
          id: {
            in: teamMemberIds,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          designation: {
            select: {
              title: true,
            },
          },
          profilePhoto: true,
        },
      })
    }

    // Get project manager details
    let projectManager = null
    if (project.projectManager) {
      projectManager = await prisma.employee.findUnique({
        where: { id: project.projectManager },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          designation: {
            select: {
              title: true,
            },
          },
          profilePhoto: true,
        },
      })
    }

    const enhancedProject = {
      ...project,
      progress,
      totalHours,
      billableHours,
      nonBillableHours,
      teamMembers,
      projectManagerDetails: projectManager,
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        todo: project.tasks.filter(t => t.status === 'TODO').length,
        inProgress: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
        review: project.tasks.filter(t => t.status === 'REVIEW').length,
        blocked: project.tasks.filter(t => t.status === 'BLOCKED').length,
      },
    }

    return NextResponse.json({
      success: true,
      data: enhancedProject,
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
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

    if (!isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only managers can update projects' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // If code is being updated, check if new code already exists
    if (body.code && body.code !== existingProject.code) {
      const codeExists = await prisma.project.findUnique({
        where: { code: body.code },
      })

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Project code already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.code !== undefined) updateData.code = body.code
    if (body.clientId !== undefined) updateData.clientId = body.clientId
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId
    if (body.description !== undefined) updateData.description = body.description
    if (body.objectives !== undefined) updateData.objectives = body.objectives
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    if (body.actualEndDate !== undefined) updateData.actualEndDate = body.actualEndDate ? new Date(body.actualEndDate) : null
    if (body.estimatedBudget !== undefined) updateData.estimatedBudget = body.estimatedBudget
    if (body.actualCost !== undefined) updateData.actualCost = body.actualCost
    if (body.projectManager !== undefined) updateData.projectManager = body.projectManager
    if (body.teamMembers !== undefined) updateData.teamMembers = Array.isArray(body.teamMembers) ? body.teamMembers.join(',') : body.teamMembers

    // Update project
    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
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
      message: 'Project updated successfully',
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
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

    if (!isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only managers can delete projects' },
        { status: 403 }
      )
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tasks: true,
            timesheets: true,
            invoices: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project has associated data
    if (project._count.timesheets > 0 || project._count.invoices > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete project with timesheets or invoices. Set status to CANCELLED instead.'
        },
        { status: 400 }
      )
    }

    // Delete project (this will cascade delete tasks)
    await prisma.project.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
