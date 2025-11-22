import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LeaveType, LeaveStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') || session.user.employeeId
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear()

    // Check if user can view other employees' data
    const canViewOthers = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'MANAGER'].includes(
      session.user.role
    )
    if (employeeId !== session.user.employeeId && !canViewOthers) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Get all leave policies
    const policies = await prisma.leavePolicy.findMany({
      where: { isActive: true },
    })

    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59)

    // Get all leaves for the year
    const leaves = await prisma.leave.findMany({
      where: {
        employeeId,
        status: {
          in: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
        },
        startDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    })

    // Calculate balance for each leave type
    const balances = await Promise.all(
      policies.map(async (policy) => {
        const usedLeaves = leaves.filter((leave) => leave.leaveType === policy.leaveType)
        const totalUsed = usedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0)
        const pending = usedLeaves
          .filter((leave) => leave.status === LeaveStatus.PENDING)
          .reduce((sum, leave) => sum + leave.totalDays, 0)

        const allocated = policy.totalDays
        const available = allocated - totalUsed
        const approved = totalUsed - pending

        return {
          leaveType: policy.leaveType,
          allocated,
          used: totalUsed,
          available: Math.max(0, available),
          pending,
          approved,
          carryForward: policy.carryForward,
          maxCarryForward: policy.maxCarryForward,
        }
      })
    )

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        firstName: true,
        lastName: true,
        employeeCode: true,
        dateOfJoining: true,
      },
    })

    return NextResponse.json({
      employee,
      year,
      balances,
      totalAllocated: balances.reduce((sum, b) => sum + b.allocated, 0),
      totalUsed: balances.reduce((sum, b) => sum + b.used, 0),
      totalAvailable: balances.reduce((sum, b) => sum + b.available, 0),
    })
  } catch (error) {
    console.error('Error fetching leave balance:', error)
    return NextResponse.json(
      { message: 'Failed to fetch leave balance' },
      { status: 500 }
    )
  }
}
