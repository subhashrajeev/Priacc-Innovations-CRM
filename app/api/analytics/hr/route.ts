import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/analytics/hr
 * Get detailed HR analytics (HR/Admin only)
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

    // Check if user has HR privileges
    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - HR/Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12')

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1)

    // ============================================
    // 1. HEADCOUNT TRENDS
    // ============================================

    // Monthly headcount growth
    const headcountTrends = []
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const activeCount = await prisma.employee.count({
        where: {
          dateOfJoining: {
            lt: nextMonthDate,
          },
          OR: [
            {
              lastWorkingDate: null,
            },
            {
              lastWorkingDate: {
                gte: monthDate,
              },
            },
          ],
        },
      })

      const joinedCount = await prisma.employee.count({
        where: {
          dateOfJoining: {
            gte: monthDate,
            lt: nextMonthDate,
          },
        },
      })

      const leftCount = await prisma.employee.count({
        where: {
          lastWorkingDate: {
            gte: monthDate,
            lt: nextMonthDate,
          },
        },
      })

      headcountTrends.push({
        month: monthDate.toISOString().slice(0, 7),
        active: activeCount,
        joined: joinedCount,
        left: leftCount,
      })
    }

    // ============================================
    // 2. DEPARTMENT-WISE DISTRIBUTION
    // ============================================

    const departmentDistribution = await prisma.department.findMany({
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

    // Average salary by department
    const departmentSalaries = await prisma.employee.findMany({
      where: {
        employmentStatus: 'ACTIVE',
        salary: {
          isNot: null,
        },
      },
      select: {
        departmentId: true,
        department: {
          select: {
            name: true,
          },
        },
        salary: {
          select: {
            netSalary: true,
          },
        },
      },
    })

    const deptSalaryMap = departmentSalaries.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'No Department'
      if (!acc[deptName]) {
        acc[deptName] = { total: 0, count: 0 }
      }
      acc[deptName].total += emp.salary?.netSalary || 0
      acc[deptName].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>)

    // ============================================
    // 3. AGE AND GENDER DIVERSITY
    // ============================================

    // Age distribution
    const employeesWithDOB = await prisma.employee.findMany({
      where: {
        employmentStatus: 'ACTIVE',
        dateOfBirth: {
          not: null,
        },
      },
      select: {
        dateOfBirth: true,
      },
    })

    const ageDistribution = employeesWithDOB.reduce((acc, emp) => {
      if (!emp.dateOfBirth) return acc

      const age = Math.floor(
        (now.getTime() - emp.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      )

      let ageGroup = '51+'
      if (age < 25) ageGroup = '18-24'
      else if (age < 35) ageGroup = '25-34'
      else if (age < 45) ageGroup = '35-44'
      else if (age <= 50) ageGroup = '45-50'

      acc[ageGroup] = (acc[ageGroup] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Gender distribution
    const genderDistribution = await prisma.employee.groupBy({
      by: ['gender'],
      where: {
        employmentStatus: 'ACTIVE',
        gender: {
          not: null,
        },
      },
      _count: {
        gender: true,
      },
    })

    // ============================================
    // 4. TENURE DISTRIBUTION
    // ============================================

    const activeEmployees = await prisma.employee.findMany({
      where: {
        employmentStatus: 'ACTIVE',
      },
      select: {
        dateOfJoining: true,
      },
    })

    const tenureDistribution = activeEmployees.reduce((acc, emp) => {
      const tenure = (now.getTime() - emp.dateOfJoining.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

      let tenureGroup = '10+ years'
      if (tenure < 1) tenureGroup = '0-1 year'
      else if (tenure < 3) tenureGroup = '1-3 years'
      else if (tenure < 5) tenureGroup = '3-5 years'
      else if (tenure < 10) tenureGroup = '5-10 years'

      acc[tenureGroup] = (acc[tenureGroup] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Average tenure
    const avgTenure = activeEmployees.length > 0
      ? activeEmployees.reduce((sum, emp) => {
          const tenure = (now.getTime() - emp.dateOfJoining.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          return sum + tenure
        }, 0) / activeEmployees.length
      : 0

    // ============================================
    // 5. ATTRITION ANALYSIS
    // ============================================

    const terminatedEmployees = await prisma.employee.findMany({
      where: {
        employmentStatus: 'TERMINATED',
        lastWorkingDate: {
          gte: startDate,
        },
      },
      select: {
        lastWorkingDate: true,
        exitReason: true,
        dateOfJoining: true,
        departmentId: true,
        department: {
          select: {
            name: true,
          },
        },
      },
    })

    // Attrition by month
    const attritionByMonth = terminatedEmployees.reduce((acc, emp) => {
      if (!emp.lastWorkingDate) return acc

      const month = emp.lastWorkingDate.toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Attrition by reason
    const attritionByReason = terminatedEmployees.reduce((acc, emp) => {
      const reason = emp.exitReason || 'Not Specified'
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Attrition by department
    const attritionByDepartment = terminatedEmployees.reduce((acc, emp) => {
      const dept = emp.department?.name || 'No Department'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Average tenure of exited employees
    const avgExitTenure = terminatedEmployees.length > 0
      ? terminatedEmployees.reduce((sum, emp) => {
          if (!emp.lastWorkingDate) return sum
          const tenure = (emp.lastWorkingDate.getTime() - emp.dateOfJoining.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          return sum + tenure
        }, 0) / terminatedEmployees.length
      : 0

    // ============================================
    // 6. COST PER HIRE
    // ============================================

    const hiredInPeriod = await prisma.employee.count({
      where: {
        dateOfJoining: {
          gte: startDate,
        },
      },
    })

    // Recruitment costs (example: sum of training expenses for new hires)
    const recruitmentExpenses = await prisma.expense.aggregate({
      where: {
        expenseType: 'TRAINING',
        date: {
          gte: startDate,
        },
        status: 'APPROVED',
      },
      _sum: {
        amount: true,
      },
    })

    const costPerHire = hiredInPeriod > 0
      ? (recruitmentExpenses._sum.amount || 0) / hiredInPeriod
      : 0

    // ============================================
    // 7. EMPLOYEE SATISFACTION TRENDS
    // ============================================

    // Using performance ratings as a proxy for satisfaction
    const performanceReviews = await prisma.performance.findMany({
      where: {
        isCompleted: true,
        completedAt: {
          gte: startDate,
        },
      },
      select: {
        completedAt: true,
        overallRating: true,
        technicalSkills: true,
        communication: true,
        teamwork: true,
        leadership: true,
      },
    })

    const satisfactionTrends = performanceReviews.reduce((acc, review) => {
      if (!review.completedAt) return acc

      const month = review.completedAt.toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { total: 0, count: 0 }
      }

      const ratings = [
        review.technicalSkills,
        review.communication,
        review.teamwork,
        review.leadership,
      ].filter((r): r is number => r !== null)

      const avg = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0
      acc[month].total += avg
      acc[month].count += 1

      return acc
    }, {} as Record<string, { total: number; count: number }>)

    // ============================================
    // 8. TRAINING & DEVELOPMENT
    // ============================================

    const trainingStats = await prisma.employeeTraining.groupBy({
      by: ['status'],
      where: {
        enrolledDate: {
          gte: startDate,
        },
      },
      _count: {
        status: true,
      },
    })

    const totalTrainingCost = await prisma.training.aggregate({
      where: {
        startDate: {
          gte: startDate,
        },
        status: 'COMPLETED',
      },
      _sum: {
        cost: true,
      },
    })

    const trainingROI = {
      totalCost: totalTrainingCost._sum.cost || 0,
      employeesTrained: trainingStats.reduce((sum, t) => sum + t._count.status, 0),
      completionRate: trainingStats.reduce((acc, t) => {
        if (t.status === 'COMPLETED') return acc + t._count.status
        return acc
      }, 0) / Math.max(1, trainingStats.reduce((sum, t) => sum + t._count.status, 0)) * 100,
    }

    return NextResponse.json({
      success: true,
      data: {
        headcount: {
          trends: headcountTrends,
          current: activeEmployees.length,
          growth: headcountTrends.length > 1
            ? ((headcountTrends[headcountTrends.length - 1].active - headcountTrends[0].active) / headcountTrends[0].active) * 100
            : 0,
        },
        diversity: {
          age: Object.entries(ageDistribution).map(([group, count]) => ({
            ageGroup: group,
            count,
          })),
          gender: genderDistribution.map((g) => ({
            gender: g.gender,
            count: g._count.gender,
          })),
        },
        department: {
          distribution: departmentDistribution.map((dept) => ({
            name: dept.name,
            employees: dept._count.employees,
            avgSalary: deptSalaryMap[dept.name]
              ? deptSalaryMap[dept.name].total / deptSalaryMap[dept.name].count
              : 0,
          })),
        },
        tenure: {
          distribution: Object.entries(tenureDistribution).map(([group, count]) => ({
            tenureGroup: group,
            count,
          })),
          average: parseFloat(avgTenure.toFixed(2)),
        },
        attrition: {
          rate: activeEmployees.length > 0
            ? (terminatedEmployees.length / (activeEmployees.length + terminatedEmployees.length)) * 100
            : 0,
          byMonth: Object.entries(attritionByMonth).map(([month, count]) => ({
            month,
            count,
          })),
          byReason: Object.entries(attritionByReason).map(([reason, count]) => ({
            reason,
            count,
          })),
          byDepartment: Object.entries(attritionByDepartment).map(([department, count]) => ({
            department,
            count,
          })),
          avgTenure: parseFloat(avgExitTenure.toFixed(2)),
        },
        recruitment: {
          costPerHire: parseFloat(costPerHire.toFixed(2)),
          totalHires: hiredInPeriod,
        },
        satisfaction: {
          trends: Object.entries(satisfactionTrends).map(([month, data]) => ({
            month,
            avgRating: data.count > 0 ? data.total / data.count : 0,
          })),
        },
        training: {
          roi: trainingROI,
          byStatus: trainingStats.map((s) => ({
            status: s.status,
            count: s._count.status,
          })),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching HR analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch HR analytics' },
      { status: 500 }
    )
  }
}
