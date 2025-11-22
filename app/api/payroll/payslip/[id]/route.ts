import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/payroll/payslip/[id]
 * Get a single payslip by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payslip = await prisma.payslip.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        salary: true,
      },
    })

    if (!payslip) {
      return NextResponse.json(
        { error: 'Payslip not found' },
        { status: 404 }
      )
    }

    // Employees can only view their own payslips
    if (!isHR(session.user.role) && payslip.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: payslip,
    })
  } catch (error) {
    console.error('Error fetching payslip:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payslip' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/payroll/payslip/[id]
 * Update a payslip (status, amounts, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only HR can update payslips
    if (!isHR(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Check if payslip exists
    const existingPayslip = await prisma.payslip.findUnique({
      where: { id: params.id },
    })

    if (!existingPayslip) {
      return NextResponse.json(
        { error: 'Payslip not found' },
        { status: 404 }
      )
    }

    // If updating amounts, recalculate totals
    let updateData = { ...body }

    if (body.bonus !== undefined ||
        body.incentives !== undefined ||
        body.overtime !== undefined ||
        body.otherDeductions !== undefined) {

      const earnings =
        existingPayslip.basicSalary +
        existingPayslip.hra +
        existingPayslip.specialAllowance +
        existingPayslip.conveyance +
        existingPayslip.medicalAllowance +
        existingPayslip.otherAllowances +
        (body.bonus ?? existingPayslip.bonus) +
        (body.incentives ?? existingPayslip.incentives) +
        (body.overtime ?? existingPayslip.overtime)

      const deductions =
        existingPayslip.pf +
        existingPayslip.esi +
        existingPayslip.professionalTax +
        existingPayslip.tds +
        existingPayslip.lop +
        (body.otherDeductions ?? existingPayslip.otherDeductions)

      updateData.grossEarnings = earnings
      updateData.totalDeductions = deductions
      updateData.netPay = earnings - deductions
    }

    // Update status if provided
    if (body.status && body.status === 'PAID' && !body.paidDate) {
      updateData.paidDate = new Date()
    }

    const payslip = await prisma.payslip.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
        salary: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: payslip,
    })
  } catch (error) {
    console.error('Error updating payslip:', error)
    return NextResponse.json(
      { error: 'Failed to update payslip' },
      { status: 500 }
    )
  }
}
