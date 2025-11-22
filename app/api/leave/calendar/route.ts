import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LeaveStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const departmentId = searchParams.get('departmentId')
    const teamOnly = searchParams.get('teamOnly') === 'true'

    // Check if user is manager
    const canViewTeam = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER', 'TEAM_LEAD'].includes(
      session.user.role
    )

    if (!canViewTeam) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      startDate = new Date(year, monthNum - 1, 1)
      endDate = new Date(year, monthNum, 0, 23, 59, 59)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // Build where clause for employees
    let employeeWhere: any = {}

    if (teamOnly) {
      // Get team members (employees reporting to current user)
      employeeWhere.reportingManagerId = session.user.employeeId
    } else if (departmentId) {
      employeeWhere.departmentId = departmentId
    }

    // Get team members
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
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
    })

    const employeeIds = employees.map((e) => e.id)

    // Get all approved/pending leaves for these employees
    const leaves = await prisma.leave.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
        status: {
          in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    // Get holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    return NextResponse.json({
      employees,
      leaves,
      holidays,
      startDate,
      endDate,
    })
  } catch (error) {
    console.error('Error fetching leave calendar:', error)
    return NextResponse.json(
      { message: 'Failed to fetch leave calendar' },
      { status: 500 }
    )
  }
}
