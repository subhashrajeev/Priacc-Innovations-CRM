import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseType, ExpenseStatus } from '@prisma/client'

/**
 * GET /api/expenses/[id]
 * Get expense details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
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
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check access rights
    const canView = expense.employeeId === session.user.employeeId || isManager(session.user.role)
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: expense,
    })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/expenses/[id]
 * Update expense (only if draft or own expense)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Get existing expense
    const existing = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            reportingManagerId: true,
            reportingManager: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if user can update
    if (existing.employeeId !== session.user.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Cannot update if already approved or reimbursed
    if (existing.status === ExpenseStatus.APPROVED || existing.status === ExpenseStatus.REIMBURSED) {
      return NextResponse.json(
        { success: false, error: 'Cannot update approved or reimbursed expense' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        expenseType: body.expenseType as ExpenseType,
        amount: body.amount,
        currency: body.currency,
        date: body.date ? new Date(body.date) : undefined,
        description: body.description,
        receiptUrl: body.receiptUrl,
        status: body.submit ? ExpenseStatus.SUBMITTED : existing.status,
        submittedAt: body.submit && !existing.submittedAt ? new Date() : undefined,
        projectId: body.projectId,
        billableToClient: body.billableToClient,
      },
    })

    // Notify manager if newly submitted
    if (body.submit && !existing.submittedAt && existing.employee.reportingManager) {
      await prisma.notification.create({
        data: {
          userId: existing.employee.reportingManager.userId,
          type: 'EXPENSE',
          title: 'New Expense for Approval',
          message: `Expense of ${body.currency || 'INR'} ${body.amount} submitted for approval`,
          link: `/expenses/approvals`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/expenses/[id]
 * Delete expense (only if draft)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Check if user can delete
    if (expense.employeeId !== session.user.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Can only delete draft expenses
    if (expense.status !== ExpenseStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft expenses' },
        { status: 400 }
      )
    }

    await prisma.expense.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
