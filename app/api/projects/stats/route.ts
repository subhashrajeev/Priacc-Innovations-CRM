import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/projects/stats
 * Get project statistics and metrics
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

    // Get project counts by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    // Get total projects
    const totalProjects = await prisma.project.count()

    // Get active projects (PLANNING or ACTIVE)
    const activeProjects = await prisma.project.count({
      where: {
        status: {
          in: ['PLANNING', 'ACTIVE'],
        },
      },
    })

    // Get projects by priority
    const projectsByPriority = await prisma.project.groupBy({
      by: ['priority'],
      _count: {
        id: true,
      },
    })

    // Get total clients
    const totalClients = await prisma.client.count()

    // Get active clients
    const activeClients = await prisma.client.count({
      where: {
        status: 'ACTIVE',
      },
    })

    // Get budget statistics
    const budgetStats = await prisma.project.aggregate({
      _sum: {
        estimatedBudget: true,
        actualCost: true,
      },
    })

    // Get total tasks
    const totalTasks = await prisma.task.count()

    // Get tasks by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    // Get timesheet statistics
    const timesheetStats = await prisma.timesheet.aggregate({
      _sum: {
        hours: true,
      },
      where: {
        billable: true,
      },
    })

    const totalTimesheetHours = await prisma.timesheet.aggregate({
      _sum: {
        hours: true,
      },
    })

    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    // Get overdue projects
    const overdueProjects = await prisma.project.count({
      where: {
        status: {
          in: ['PLANNING', 'ACTIVE'],
        },
        endDate: {
          lt: new Date(),
        },
      },
    })

    // Get projects ending this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const endOfMonth = new Date(startOfMonth)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)

    const projectsEndingThisMonth = await prisma.project.count({
      where: {
        status: {
          in: ['PLANNING', 'ACTIVE'],
        },
        endDate: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    })

    // Format response
    const stats = {
      overview: {
        totalProjects,
        activeProjects,
        completedProjects: projectsByStatus.find(p => p.status === 'COMPLETED')?._count.id || 0,
        onHoldProjects: projectsByStatus.find(p => p.status === 'ON_HOLD')?._count.id || 0,
        cancelledProjects: projectsByStatus.find(p => p.status === 'CANCELLED')?._count.id || 0,
        overdueProjects,
        projectsEndingThisMonth,
      },
      clients: {
        total: totalClients,
        active: activeClients,
      },
      budget: {
        totalEstimated: budgetStats._sum.estimatedBudget || 0,
        totalActual: budgetStats._sum.actualCost || 0,
        variance: (budgetStats._sum.estimatedBudget || 0) - (budgetStats._sum.actualCost || 0),
      },
      tasks: {
        total: totalTasks,
        todo: tasksByStatus.find(t => t.status === 'TODO')?._count.id || 0,
        inProgress: tasksByStatus.find(t => t.status === 'IN_PROGRESS')?._count.id || 0,
        review: tasksByStatus.find(t => t.status === 'REVIEW')?._count.id || 0,
        completed: tasksByStatus.find(t => t.status === 'COMPLETED')?._count.id || 0,
        blocked: tasksByStatus.find(t => t.status === 'BLOCKED')?._count.id || 0,
      },
      timesheets: {
        totalHours: totalTimesheetHours._sum.hours || 0,
        billableHours: timesheetStats._sum.hours || 0,
        nonBillableHours: (totalTimesheetHours._sum.hours || 0) - (timesheetStats._sum.hours || 0),
      },
      projectsByStatus: projectsByStatus.map(p => ({
        status: p.status,
        count: p._count.id,
      })),
      projectsByPriority: projectsByPriority.map(p => ({
        priority: p.priority,
        count: p._count.id,
      })),
      recentProjects: recentProjects.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        client: p.client.name,
        status: p.status,
        priority: p.priority,
        taskCount: p._count.tasks,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching project stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project statistics' },
      { status: 500 }
    )
  }
}
