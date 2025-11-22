import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseType, ExpenseStatus } from '@prisma/client'

/**
 * GET /api/expenses
 * Get expenses - own expenses or all for managers
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

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const expenseType = searchParams.get('expenseType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    // Determine access level
    const canViewAll = isManager(session.user.role)

    if (employeeId && canViewAll) {
      where.employeeId = employeeId
    } else if (!canViewAll) {
      where.employeeId = session.user.employeeId
    }

    if (status) {
      where.status = status as ExpenseStatus
    }

    if (expenseType) {
      where.expenseType = expenseType as ExpenseType
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const expenses = await prisma.expense.findMany({
      where,
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
        date: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: expenses,
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/expenses
 * Create a new expense
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

    const body = await request.json()

    // Validation
    if (!body.expenseType || !body.amount || !body.date || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        employeeId: session.user.employeeId,
        expenseType: body.expenseType as ExpenseType,
        amount: body.amount,
        currency: body.currency || 'INR',
        date: new Date(body.date),
        description: body.description,
        receiptUrl: body.receiptUrl,
        status: body.submit ? ExpenseStatus.SUBMITTED : ExpenseStatus.DRAFT,
        submittedAt: body.submit ? new Date() : null,
        projectId: body.projectId,
        billableToClient: body.billableToClient || false,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
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

    // Notify manager if submitted
    if (body.submit && expense.employee.reportingManager) {
      await prisma.notification.create({
        data: {
          userId: expense.employee.reportingManager.userId,
          type: 'EXPENSE',
          title: 'New Expense for Approval',
          message: `${expense.employee.firstName} ${expense.employee.lastName} submitted an expense of ${body.currency} ${body.amount}`,
          link: `/expenses/approvals`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: expense,
      message: body.submit ? 'Expense submitted successfully' : 'Expense saved as draft',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
