import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/analytics/reports
 * Generate custom reports
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

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')
    const employeeId = searchParams.get('employeeId')

    if (!reportType || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: type, startDate, endDate' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Check if user has access to view other employees' data
    const hasHRAccess = isHR(session.user.role)
    const targetEmployeeId = employeeId || (hasHRAccess ? undefined : session.user.employeeId)

    let reportData: any = null

    switch (reportType) {
      case 'attendance':
        reportData = await generateAttendanceReport(startDate, endDate, departmentId, targetEmployeeId)
        break

      case 'leave':
        reportData = await generateLeaveReport(startDate, endDate, departmentId, targetEmployeeId)
        break

      case 'payroll':
        if (!hasHRAccess && !targetEmployeeId) {
          return NextResponse.json(
            { success: false, error: 'Access denied for payroll report' },
            { status: 403 }
          )
        }
        reportData = await generatePayrollReport(startDate, endDate, departmentId, targetEmployeeId)
        break

      case 'performance':
        reportData = await generatePerformanceReport(startDate, endDate, departmentId, targetEmployeeId)
        break

      case 'projects':
        reportData = await generateProjectReport(startDate, endDate, departmentId)
        break

      case 'expenses':
        reportData = await generateExpenseReport(startDate, endDate, departmentId, targetEmployeeId)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: reportData,
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// ============================================
// REPORT GENERATORS
// ============================================

async function generateAttendanceReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string | null,
  employeeId?: string | null
) {
  const attendance = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(employeeId && { employeeId }),
      ...(departmentId && {
        employee: {
          departmentId,
        },
      }),
    },
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
          designation: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: [
      { date: 'desc' },
      { employee: { firstName: 'asc' } },
    ],
  })

  // Calculate summary statistics
  const summary = {
    totalRecords: attendance.length,
    byStatus: attendance.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0),
    avgWorkHours: attendance.length > 0
      ? attendance.reduce((sum, a) => sum + (a.workHours || 0), 0) / attendance.length
      : 0,
  }

  return {
    type: 'attendance',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary,
    records: attendance.map((a) => ({
      id: a.id,
      date: a.date,
      employee: {
        code: a.employee.employeeCode,
        name: `${a.employee.firstName} ${a.employee.lastName}`,
        department: a.employee.department?.name,
        designation: a.employee.designation?.title,
      },
      checkIn: a.checkInTime,
      checkOut: a.checkOutTime,
      status: a.status,
      workHours: a.workHours,
      isRemote: a.isRemote,
      notes: a.notes,
    })),
  }
}

async function generateLeaveReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string | null,
  employeeId?: string | null
) {
  const leaves = await prisma.leave.findMany({
    where: {
      OR: [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
      ...(employeeId && { employeeId }),
      ...(departmentId && {
        employee: {
          departmentId,
        },
      }),
    },
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
    orderBy: [
      { startDate: 'desc' },
      { employee: { firstName: 'asc' } },
    ],
  })

  const summary = {
    totalLeaves: leaves.length,
    byType: leaves.reduce((acc, l) => {
      acc[l.leaveType] = (acc[l.leaveType] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byStatus: leaves.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalDays: leaves.reduce((sum, l) => sum + l.totalDays, 0),
  }

  return {
    type: 'leave',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary,
    records: leaves.map((l) => ({
      id: l.id,
      employee: {
        code: l.employee.employeeCode,
        name: `${l.employee.firstName} ${l.employee.lastName}`,
        department: l.employee.department?.name,
      },
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      totalDays: l.totalDays,
      halfDay: l.halfDay,
      reason: l.reason,
      status: l.status,
      approvedAt: l.approvedAt,
    })),
  }
}

async function generatePayrollReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string | null,
  employeeId?: string | null
) {
  // Get month/year range from dates
  const startMonth = startDate.getMonth() + 1
  const startYear = startDate.getFullYear()
  const endMonth = endDate.getMonth() + 1
  const endYear = endDate.getFullYear()

  const payslips = await prisma.payslip.findMany({
    where: {
      OR: [
        {
          year: {
            gte: startYear,
            lte: endYear,
          },
        },
      ],
      ...(employeeId && { employeeId }),
      ...(departmentId && {
        employee: {
          departmentId,
        },
      }),
    },
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
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
      { employee: { firstName: 'asc' } },
    ],
  })

  const summary = {
    totalPayslips: payslips.length,
    totalGrossPay: payslips.reduce((sum, p) => sum + p.grossEarnings, 0),
    totalDeductions: payslips.reduce((sum, p) => sum + p.totalDeductions, 0),
    totalNetPay: payslips.reduce((sum, p) => sum + p.netPay, 0),
    avgNetPay: payslips.length > 0
      ? payslips.reduce((sum, p) => sum + p.netPay, 0) / payslips.length
      : 0,
    byStatus: payslips.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return {
    type: 'payroll',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary,
    records: payslips.map((p) => ({
      id: p.id,
      employee: {
        code: p.employee.employeeCode,
        name: `${p.employee.firstName} ${p.employee.lastName}`,
        department: p.employee.department?.name,
      },
      month: p.month,
      year: p.year,
      grossEarnings: p.grossEarnings,
      totalDeductions: p.totalDeductions,
      netPay: p.netPay,
      status: p.status,
      paidDate: p.paidDate,
    })),
  }
}

async function generatePerformanceReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string | null,
  employeeId?: string | null
) {
  const reviews = await prisma.performance.findMany({
    where: {
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
      isCompleted: true,
      ...(employeeId && { employeeId }),
      ...(departmentId && {
        employee: {
          departmentId,
        },
      }),
    },
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
          designation: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: [
      { completedAt: 'desc' },
      { employee: { firstName: 'asc' } },
    ],
  })

  const summary = {
    totalReviews: reviews.length,
    avgRatings: {
      technical: reviews.reduce((sum, r) => sum + (r.technicalSkills || 0), 0) / Math.max(1, reviews.length),
      communication: reviews.reduce((sum, r) => sum + (r.communication || 0), 0) / Math.max(1, reviews.length),
      teamwork: reviews.reduce((sum, r) => sum + (r.teamwork || 0), 0) / Math.max(1, reviews.length),
      leadership: reviews.reduce((sum, r) => sum + (r.leadership || 0), 0) / Math.max(1, reviews.length),
    },
    byRating: reviews.reduce((acc, r) => {
      if (r.overallRating) {
        acc[r.overallRating] = (acc[r.overallRating] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
  }

  return {
    type: 'performance',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary,
    records: reviews.map((r) => ({
      id: r.id,
      employee: {
        code: r.employee.employeeCode,
        name: `${r.employee.firstName} ${r.employee.lastName}`,
        department: r.employee.department?.name,
        designation: r.employee.designation?.title,
      },
      reviewCycle: r.reviewCycle,
      reviewPeriod: r.reviewPeriod,
      overallRating: r.overallRating,
      ratings: {
        technical: r.technicalSkills,
        communication: r.communication,
        teamwork: r.teamwork,
        leadership: r.leadership,
        initiative: r.initiative,
        problemSolving: r.problemSolving,
      },
      completedAt: r.completedAt,
    })),
  }
}

async function generateProjectReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string | null
) {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
      ...(departmentId && { departmentId }),
    },
    include: {
      client: {
        select: {
          name: true,
          code: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          timesheets: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  })

  const summary = {
    totalProjects: projects.length,
    byStatus: projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalBudget: projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0),
    totalCost: projects.reduce((sum, p) => sum + (p.actualCost || 0), 0),
  }

  return {
    type: 'projects',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary,
    records: projects.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      client: p.client.name,
      department: p.department?.name,
      status: p.status,
      priority: p.priority,
      startDate: p.startDate,
      endDate: p.endDate,
      estimatedBudget: p.estimatedBudget,
      actualCost: p.actualCost,
      taskCount: p._count.tasks,
      timesheetCount: p._count.timesheets,
    })),
  }
}

async function generateExpenseReport(
  startDate: Date,
  endDate: Date,
  departmentId?: string | null,
  employeeId?: string | null
) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(employeeId && { employeeId }),
      ...(departmentId && {
        employee: {
          departmentId,
        },
      }),
    },
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
    orderBy: [
      { date: 'desc' },
      { employee: { firstName: 'asc' } },
    ],
  })

  const summary = {
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    byType: expenses.reduce((acc, e) => {
      acc[e.expenseType] = (acc[e.expenseType] || 0) + e.amount
      return acc
    }, {} as Record<string, number>),
    byStatus: expenses.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    approved: expenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0),
    pending: expenses.filter(e => e.status === 'SUBMITTED').reduce((sum, e) => sum + e.amount, 0),
  }

  return {
    type: 'expenses',
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    summary,
    records: expenses.map((e) => ({
      id: e.id,
      employee: {
        code: e.employee.employeeCode,
        name: `${e.employee.firstName} ${e.employee.lastName}`,
        department: e.employee.department?.name,
      },
      date: e.date,
      expenseType: e.expenseType,
      amount: e.amount,
      currency: e.currency,
      description: e.description,
      status: e.status,
      approvedAt: e.approvedAt,
      billableToClient: e.billableToClient,
    })),
  }
}
