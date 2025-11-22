import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseStatus } from '@prisma/client'

/**
 * POST /api/expenses/approve
 * Approve or reject expense (Manager only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only managers can approve expenses' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validation
    if (!body.expenseId || !body.action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get expense
    const expense = await prisma.expense.findUnique({
      where: { id: body.expenseId },
      include: {
        employee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            reportingManagerId: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if expense is in submitted status
    if (expense.status !== ExpenseStatus.SUBMITTED) {
      return NextResponse.json(
        { success: false, error: 'Expense is not in submitted status' },
        { status: 400 }
      )
    }

    // Check if user is the reporting manager
    if (expense.employee.reportingManagerId !== session.user.employeeId) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to approve this expense' },
        { status: 403 }
      )
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id: body.expenseId },
      data: {
        status: body.action === 'approve' ? ExpenseStatus.APPROVED : ExpenseStatus.REJECTED,
        approvedBy: session.user.employeeId,
        approvedAt: new Date(),
        rejectedReason: body.action === 'reject' ? body.reason : null,
      },
    })

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: expense.employee.userId,
        type: 'EXPENSE',
        title: body.action === 'approve' ? 'Expense Approved' : 'Expense Rejected',
        message:
          body.action === 'approve'
            ? `Your expense of ${expense.currency} ${expense.amount} has been approved`
            : `Your expense of ${expense.currency} ${expense.amount} has been rejected${body.reason ? `: ${body.reason}` : ''}`,
        link: `/expenses`,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedExpense,
      message: body.action === 'approve' ? 'Expense approved successfully' : 'Expense rejected',
    })
  } catch (error) {
    console.error('Error processing expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process expense' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/expenses/approve
 * Get pending expenses for approval
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only managers can view pending approvals' },
        { status: 403 }
      )
    }

    // Get employees reporting to current user
    const reportees = await prisma.employee.findMany({
      where: {
        reportingManagerId: session.user.employeeId,
      },
      select: {
        id: true,
      },
    })

    const reporteeIds = reportees.map((r) => r.id)

    // Get pending expenses
    const expenses = await prisma.expense.findMany({
      where: {
        employeeId: {
          in: reporteeIds,
        },
        status: ExpenseStatus.SUBMITTED,
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
      orderBy: {
        submittedAt: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: expenses,
    })
  } catch (error) {
    console.error('Error fetching pending expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending expenses' },
      { status: 500 }
    )
  }
}
