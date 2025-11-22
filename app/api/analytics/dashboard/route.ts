import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/analytics/dashboard
 * Get comprehensive dashboard statistics for analytics
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')

    // Date filters
    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(endDate),
    } : undefined

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // ============================================
    // 1. EMPLOYEE METRICS
    // ============================================

    const totalEmployees = await prisma.employee.count({
      where: departmentId ? { departmentId } : undefined,
    })

    const activeEmployees = await prisma.employee.count({
      where: {
        employmentStatus: 'ACTIVE',
        ...(departmentId && { departmentId }),
      },
    })

    // Employees by department
    const employeesByDepartment = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            employees: {
              where: {
                employmentStatus: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Employees by designation
    const employeesByDesignation = await prisma.designation.findMany({
      select: {
        id: true,
        title: true,
        level: true,
        _count: {
          select: {
            employees: {
              where: {
                employmentStatus: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    })

    // Attrition rate (employees who left in last 12 months)
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const employeesLeft = await prisma.employee.count({
      where: {
        employmentStatus: 'TERMINATED',
        lastWorkingDate: {
          gte: oneYearAgo,
        },
        ...(departmentId && { departmentId }),
      },
    })

    const attritionRate = totalEmployees > 0 ? (employeesLeft / totalEmployees) * 100 : 0

    // ============================================
    // 2. ATTENDANCE METRICS
    // ============================================

    // Today's attendance
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayAttendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: today,
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
      _count: {
        status: true,
      },
    })

    const todayPresentCount = todayAttendance
      .filter((a) => ['PRESENT', 'WORK_FROM_HOME', 'HALF_DAY'].includes(a.status))
      .reduce((sum, a) => sum + a._count.status, 0)

    // Monthly attendance average
    const monthlyAttendance = await prisma.attendance.count({
      where: {
        date: {
          gte: startOfMonth,
        },
        status: {
          in: ['PRESENT', 'WORK_FROM_HOME', 'HALF_DAY'],
        },
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
    })

    const workingDaysThisMonth = Math.floor((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
    const monthlyAvgAttendance = workingDaysThisMonth > 0 ? (monthlyAttendance / (activeEmployees * workingDaysThisMonth)) * 100 : 0

    // WFH stats
    const wfhCount = await prisma.attendance.count({
      where: {
        date: {
          gte: startOfMonth,
        },
        status: 'WORK_FROM_HOME',
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
    })

    // ============================================
    // 3. LEAVE METRICS
    // ============================================

    const pendingLeaves = await prisma.leave.count({
      where: {
        status: 'PENDING',
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
    })

    // Most used leave types
    const leavesByType = await prisma.leave.groupBy({
      by: ['leaveType'],
      where: {
        status: 'APPROVED',
        startDate: {
          gte: startOfMonth,
        },
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
      _sum: {
        totalDays: true,
      },
      _count: {
        leaveType: true,
      },
    })

    // ============================================
    // 4. PAYROLL METRICS
    // ============================================

    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const payslipsThisMonth = await prisma.payslip.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
    })

    const totalPayroll = payslipsThisMonth.reduce((sum, p) => sum + p.netPay, 0)
    const avgSalary = payslipsThisMonth.length > 0 ? totalPayroll / payslipsThisMonth.length : 0
    const totalTaxDeductions = payslipsThisMonth.reduce((sum, p) => sum + p.tds + p.professionalTax, 0)

    // ============================================
    // 5. PERFORMANCE METRICS
    // ============================================

    const completedReviews = await prisma.performance.findMany({
      where: {
        isCompleted: true,
        completedAt: {
          gte: startOfMonth,
        },
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
      select: {
        technicalSkills: true,
        communication: true,
        teamwork: true,
        leadership: true,
        initiative: true,
        problemSolving: true,
      },
    })

    const avgRatings = completedReviews.length > 0 ? completedReviews.reduce((acc, review) => {
      const ratings = [
        review.technicalSkills,
        review.communication,
        review.teamwork,
        review.leadership,
        review.initiative,
        review.problemSolving,
      ].filter((r): r is number => r !== null)

      const avg = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0
      return acc + avg
    }, 0) / completedReviews.length : 0

    // Goals completion rate
    const totalGoals = await prisma.goal.count({
      where: {
        dueDate: {
          lte: now,
        },
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
    })

    const completedGoals = await prisma.goal.count({
      where: {
        status: 'COMPLETED',
        dueDate: {
          lte: now,
        },
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
    })

    const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0

    // ============================================
    // 6. RECRUITMENT METRICS
    // ============================================

    const openPositions = await prisma.job.count({
      where: {
        status: 'OPEN',
        ...(departmentId && { departmentId }),
      },
    })

    const applicationsThisMonth = await prisma.application.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
        ...(departmentId && {
          job: {
            departmentId,
          },
        }),
      },
    })

    // Time to hire (average days from application to offer acceptance)
    const hiredApplications = await prisma.application.findMany({
      where: {
        status: 'ACCEPTED',
        createdAt: {
          gte: startOfMonth,
        },
        ...(departmentId && {
          job: {
            departmentId,
          },
        }),
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    const avgTimeToHire = hiredApplications.length > 0
      ? hiredApplications.reduce((sum, app) => {
          const days = (app.updatedAt.getTime() - app.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return sum + days
        }, 0) / hiredApplications.length
      : 0

    // ============================================
    // 7. PROJECT METRICS
    // ============================================

    const activeProjects = await prisma.project.count({
      where: {
        status: 'ACTIVE',
        ...(departmentId && { departmentId }),
      },
    })

    const projectsRevenue = await prisma.project.aggregate({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
        ...(departmentId && { departmentId }),
      },
      _sum: {
        estimatedBudget: true,
        actualCost: true,
      },
    })

    // Project utilization (billable hours / total hours)
    const timesheets = await prisma.timesheet.findMany({
      where: {
        date: {
          gte: startOfMonth,
        },
        approved: true,
        ...(departmentId && {
          project: {
            departmentId,
          },
        }),
      },
      select: {
        hours: true,
        billable: true,
      },
    })

    const totalHours = timesheets.reduce((sum, t) => sum + t.hours, 0)
    const billableHours = timesheets.filter(t => t.billable).reduce((sum, t) => sum + t.hours, 0)
    const utilization = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

    // ============================================
    // 8. EXPENSE METRICS
    // ============================================

    const pendingExpenses = await prisma.expense.count({
      where: {
        status: 'SUBMITTED',
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
    })

    const approvedExpensesAmount = await prisma.expense.aggregate({
      where: {
        status: 'APPROVED',
        submittedAt: {
          gte: startOfMonth,
        },
        ...(departmentId && {
          employee: {
            departmentId,
          },
        }),
      },
      _sum: {
        amount: true,
      },
    })

    // ============================================
    // TRENDS (Compare with last month)
    // ============================================

    const lastMonthActiveEmployees = await prisma.employee.count({
      where: {
        employmentStatus: 'ACTIVE',
        dateOfJoining: {
          lte: endOfLastMonth,
        },
        ...(departmentId && { departmentId }),
      },
    })

    const employeeGrowth = lastMonthActiveEmployees > 0
      ? ((activeEmployees - lastMonthActiveEmployees) / lastMonthActiveEmployees) * 100
      : 0

    return NextResponse.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          byDepartment: employeesByDepartment.map((dept) => ({
            name: dept.name,
            count: dept._count.employees,
          })),
          byDesignation: employeesByDesignation.map((des) => ({
            title: des.title,
            level: des.level,
            count: des._count.employees,
          })),
          attritionRate: parseFloat(attritionRate.toFixed(2)),
          growth: parseFloat(employeeGrowth.toFixed(2)),
        },
        attendance: {
          todayPresent: todayPresentCount,
          todayTotal: activeEmployees,
          monthlyAverage: parseFloat(monthlyAvgAttendance.toFixed(2)),
          wfhCount,
          breakdown: todayAttendance.map((a) => ({
            status: a.status,
            count: a._count.status,
          })),
        },
        leave: {
          pendingApprovals: pendingLeaves,
          byType: leavesByType.map((l) => ({
            type: l.leaveType,
            count: l._count.leaveType,
            totalDays: l._sum.totalDays || 0,
          })),
        },
        payroll: {
          totalPayroll: parseFloat(totalPayroll.toFixed(2)),
          averageSalary: parseFloat(avgSalary.toFixed(2)),
          taxDeductions: parseFloat(totalTaxDeductions.toFixed(2)),
          employeesPaid: payslipsThisMonth.length,
        },
        performance: {
          averageRating: parseFloat(avgRatings.toFixed(2)),
          goalsCompletionRate: parseFloat(goalsCompletionRate.toFixed(2)),
          reviewsCompleted: completedReviews.length,
        },
        recruitment: {
          openPositions,
          applicationsThisMonth,
          averageTimeToHire: parseFloat(avgTimeToHire.toFixed(1)),
        },
        projects: {
          activeProjects,
          totalRevenue: projectsRevenue._sum.estimatedBudget || 0,
          totalCost: projectsRevenue._sum.actualCost || 0,
          utilization: parseFloat(utilization.toFixed(2)),
        },
        expenses: {
          pending: pendingExpenses,
          approvedThisMonth: approvedExpensesAmount._sum.amount || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics dashboard' },
      { status: 500 }
    )
  }
}
