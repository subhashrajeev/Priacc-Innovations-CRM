import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculatePayslip,
  getWorkingDaysInMonth,
  calculateMonthlyTDS
} from '@/lib/payroll-utils'
import { AttendanceStatus } from '@prisma/client'

/**
 * GET /api/payroll/payslip
 * Get payslips for the logged-in employee or all payslips (HR)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    const where: any = {}

    // If not HR, can only view their own payslips
    if (!isHR(session.user.role)) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (month) {
      where.month = parseInt(month)
    }

    if (year) {
      where.year = parseInt(year)
    }

    if (status) {
      where.status = status
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
        salary: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json({
      success: true,
      data: payslips,
    })
  } catch (error) {
    console.error('Error fetching payslips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payslips' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payroll/payslip
 * Generate payslips for employees
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only HR can generate payslips
    if (!isHR(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { employeeIds, month, year } = body

    // Validate required fields
    if (!employeeIds || !Array.isArray(employeeIds) || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeIds (array), month, year' },
        { status: 400 }
      )
    }

    const generatedPayslips = []
    const errors = []

    for (const employeeId of employeeIds) {
      try {
        // Check if payslip already exists
        const existingPayslip = await prisma.payslip.findUnique({
          where: {
            employeeId_month_year: {
              employeeId,
              month,
              year,
            },
          },
        })

        if (existingPayslip) {
          errors.push({
            employeeId,
            error: 'Payslip already exists for this month',
          })
          continue
        }

        // Get employee with salary details
        const employee = await prisma.employee.findUnique({
          where: { id: employeeId },
          include: {
            salary: true,
          },
        })

        if (!employee) {
          errors.push({
            employeeId,
            error: 'Employee not found',
          })
          continue
        }

        if (!employee.salary) {
          errors.push({
            employeeId,
            error: 'No salary structure assigned',
          })
          continue
        }

        // Get attendance data for the month
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)

        const attendance = await prisma.attendance.findMany({
          where: {
            employeeId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        })

        // Calculate attendance summary
        const totalWorkingDays = getWorkingDaysInMonth(year, month)
        const daysPresent = attendance.filter(
          a => a.status === AttendanceStatus.PRESENT ||
               a.status === AttendanceStatus.WORK_FROM_HOME
        ).length
        const daysAbsent = attendance.filter(
          a => a.status === AttendanceStatus.ABSENT
        ).length

        // Get leave data
        const leaves = await prisma.leave.findMany({
          where: {
            employeeId,
            status: 'APPROVED',
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        })

        const paidLeaves = leaves.filter(
          l => l.leaveType !== 'LOSS_OF_PAY'
        ).reduce((sum, l) => sum + l.totalDays, 0)

        const unpaidLeaves = leaves.filter(
          l => l.leaveType === 'LOSS_OF_PAY'
        ).reduce((sum, l) => sum + l.totalDays, 0)

        // Prepare salary components
        const salaryComponents = {
          basic: employee.salary.basicSalary,
          hra: employee.salary.hra,
          specialAllowance: employee.salary.specialAllowance,
          conveyance: employee.salary.conveyance,
          medicalAllowance: employee.salary.medicalAllowance,
          otherAllowances: employee.salary.otherAllowances,
        }

        // Calculate payslip
        const calculation = calculatePayslip(
          salaryComponents,
          month,
          year,
          {
            totalWorkingDays,
            daysPresent,
            daysAbsent,
            paidLeaves: Math.round(paidLeaves),
            unpaidLeaves: Math.round(unpaidLeaves),
          },
          {}, // Additional earnings can be added later
          employee.salary.ctc, // Annual income for TDS calculation
        )

        // Create payslip
        const payslip = await prisma.payslip.create({
          data: {
            employeeId,
            salaryId: employee.salary.id,
            month,
            year,
            basicSalary: calculation.earnings.basic,
            hra: calculation.earnings.hra,
            specialAllowance: calculation.earnings.specialAllowance,
            conveyance: calculation.earnings.conveyance,
            medicalAllowance: calculation.earnings.medicalAllowance,
            otherAllowances: calculation.earnings.otherAllowances,
            bonus: calculation.earnings.bonus,
            incentives: calculation.earnings.incentives,
            overtime: calculation.earnings.overtime,
            grossEarnings: calculation.grossEarnings,
            pf: calculation.deductions.pf,
            esi: calculation.deductions.esi,
            professionalTax: calculation.deductions.professionalTax,
            tds: calculation.deductions.tds,
            lop: calculation.deductions.lop,
            otherDeductions: calculation.deductions.otherDeductions,
            totalDeductions: calculation.totalDeductions,
            netPay: calculation.netPay,
            totalWorkingDays,
            daysPresent,
            daysAbsent,
            paidLeaves: Math.round(paidLeaves),
            unpaidLeaves: Math.round(unpaidLeaves),
            status: 'GENERATED',
          },
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

        generatedPayslips.push(payslip)
      } catch (error: any) {
        errors.push({
          employeeId,
          error: error.message || 'Failed to generate payslip',
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        generated: generatedPayslips,
        errors,
        summary: {
          total: employeeIds.length,
          success: generatedPayslips.length,
          failed: errors.length,
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating payslips:', error)
    return NextResponse.json(
      { error: 'Failed to generate payslips' },
      { status: 500 }
    )
  }
}
