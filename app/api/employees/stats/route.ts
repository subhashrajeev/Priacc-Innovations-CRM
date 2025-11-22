import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/employees/stats
 * Get employee statistics for dashboard
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

    // Get total employees
    const totalEmployees = await prisma.employee.count()

    // Get active employees
    const activeEmployees = await prisma.employee.count({
      where: {
        employmentStatus: 'ACTIVE',
      },
    })

    // Get inactive employees
    const inactiveEmployees = await prisma.employee.count({
      where: {
        employmentStatus: 'INACTIVE',
      },
    })

    // Get terminated employees
    const terminatedEmployees = await prisma.employee.count({
      where: {
        employmentStatus: 'TERMINATED',
      },
    })

    // Get employees by department
    const employeesByDepartment = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Get employees by designation
    const employeesByDesignation = await prisma.designation.findMany({
      select: {
        id: true,
        title: true,
        level: true,
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    })

    // Get employees by type
    const employeesByType = await prisma.employee.groupBy({
      by: ['employeeType'],
      _count: {
        employeeType: true,
      },
    })

    // Get employees by gender
    const employeesByGender = await prisma.employee.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
      where: {
        gender: {
          not: null,
        },
      },
    })

    // Get new joiners this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const newJoinersThisMonth = await prisma.employee.count({
      where: {
        dateOfJoining: {
          gte: startOfMonth,
        },
      },
    })

    // Get employees on probation
    const now = new Date()
    const employeesOnProbation = await prisma.employee.count({
      where: {
        confirmationDate: null,
        dateOfJoining: {
          not: null,
        },
        employmentStatus: 'ACTIVE',
      },
    })

    // Get employees confirmed this month
    const confirmedThisMonth = await prisma.employee.count({
      where: {
        confirmationDate: {
          gte: startOfMonth,
        },
      },
    })

    // Get upcoming birthdays (this month)
    const currentMonth = now.getMonth() + 1
    const upcomingBirthdays = await prisma.employee.findMany({
      where: {
        dateOfBirth: {
          not: null,
        },
        employmentStatus: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        profilePhoto: true,
        designation: {
          select: {
            title: true,
          },
        },
      },
    })

    // Filter birthdays for current month
    const birthdaysThisMonth = upcomingBirthdays.filter((emp) => {
      if (!emp.dateOfBirth) return false
      const birthMonth = new Date(emp.dateOfBirth).getMonth() + 1
      return birthMonth === currentMonth
    })

    // Get work anniversaries this month
    const workAnniversaries = await prisma.employee.findMany({
      where: {
        employmentStatus: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfJoining: true,
        profilePhoto: true,
        designation: {
          select: {
            title: true,
          },
        },
      },
    })

    // Filter anniversaries for current month
    const anniversariesThisMonth = workAnniversaries.filter((emp) => {
      const joinMonth = new Date(emp.dateOfJoining).getMonth() + 1
      return joinMonth === currentMonth
    })

    // Get average tenure
    const employees = await prisma.employee.findMany({
      where: {
        employmentStatus: 'ACTIVE',
      },
      select: {
        dateOfJoining: true,
      },
    })

    const totalTenure = employees.reduce((acc, emp) => {
      const tenure = now.getTime() - new Date(emp.dateOfJoining).getTime()
      return acc + tenure
    }, 0)

    const averageTenureInDays = employees.length > 0
      ? Math.floor(totalTenure / (employees.length * 1000 * 60 * 60 * 24))
      : 0

    const averageTenureInYears = (averageTenureInDays / 365).toFixed(1)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          terminatedEmployees,
          newJoinersThisMonth,
          employeesOnProbation,
          confirmedThisMonth,
          averageTenureInYears: parseFloat(averageTenureInYears),
        },
        byDepartment: employeesByDepartment.map((dept) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          count: dept._count.employees,
        })),
        byDesignation: employeesByDesignation.map((des) => ({
          id: des.id,
          title: des.title,
          level: des.level,
          count: des._count.employees,
        })),
        byType: employeesByType.map((type) => ({
          type: type.employeeType,
          count: type._count.employeeType,
        })),
        byGender: employeesByGender.map((gender) => ({
          gender: gender.gender,
          count: gender._count.gender,
        })),
        upcomingEvents: {
          birthdays: birthdaysThisMonth.map((emp) => ({
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            date: emp.dateOfBirth,
            designation: emp.designation?.title,
            profilePhoto: emp.profilePhoto,
          })),
          anniversaries: anniversariesThisMonth.map((emp) => {
            const years = now.getFullYear() - new Date(emp.dateOfJoining).getFullYear()
            return {
              id: emp.id,
              name: `${emp.firstName} ${emp.lastName}`,
              date: emp.dateOfJoining,
              years,
              designation: emp.designation?.title,
              profilePhoto: emp.profilePhoto,
            }
          }),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching employee stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee statistics' },
      { status: 500 }
    )
  }
}
