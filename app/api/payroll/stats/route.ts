import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/payroll/stats
 * Get payroll statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // For employees, only show their own stats
    // For HR, show organization-wide stats
    const isHRUser = isHR(session.user.role)

    if (!isHRUser) {
      // Employee stats
      const currentDate = new Date()
      const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1
      const currentYear = year ? parseInt(year) : currentDate.getFullYear()

      // Get employee's current month payslip
      const currentPayslip = await prisma.payslip.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: session.user.employeeId,
            month: currentMonth,
            year: currentYear,
          },
        },
      })

      // Get year-to-date payslips
      const ytdPayslips = await prisma.payslip.findMany({
        where: {
          employeeId: session.user.employeeId,
          OR: [
            { year: currentYear },
            {
              year: currentYear - 1,
              month: { gte: 4 }, // April onwards
            },
          ],
        },
      })

      // Calculate YTD totals
      const ytdEarnings = ytdPayslips.reduce((sum, p) => sum + p.grossEarnings, 0)
      const ytdDeductions = ytdPayslips.reduce((sum, p) => sum + p.totalDeductions, 0)
      const ytdNetPay = ytdPayslips.reduce((sum, p) => sum + p.netPay, 0)
      const ytdTDS = ytdPayslips.reduce((sum, p) => sum + p.tds, 0)
      const ytdPF = ytdPayslips.reduce((sum, p) => sum + p.pf, 0)

      return NextResponse.json({
        success: true,
        data: {
          currentMonth: {
            month: currentMonth,
            year: currentYear,
            payslip: currentPayslip,
          },
          yearToDate: {
            totalPayslips: ytdPayslips.length,
            totalEarnings: ytdEarnings,
            totalDeductions: ytdDeductions,
            totalNetPay: ytdNetPay,
            totalTDS: ytdTDS,
            totalPF: ytdPF,
          },
        },
      })
    } else {
      // HR/Admin stats
      const currentDate = new Date()
      const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1
      const currentYear = year ? parseInt(year) : currentDate.getFullYear()

      // Get payslips for the selected month
      const monthPayslips = await prisma.payslip.findMany({
        where: {
          month: currentMonth,
          year: currentYear,
        },
        include: {
          employee: {
            include: {
              department: true,
            },
          },
        },
      })

      // Calculate month statistics
      const totalEmployees = monthPayslips.length
      const totalGrossPay = monthPayslips.reduce((sum, p) => sum + p.grossEarnings, 0)
      const totalDeductions = monthPayslips.reduce((sum, p) => sum + p.totalDeductions, 0)
      const totalNetPay = monthPayslips.reduce((sum, p) => sum + p.netPay, 0)
      const totalPF = monthPayslips.reduce((sum, p) => sum + p.pf, 0)
      const totalESI = monthPayslips.reduce((sum, p) => sum + p.esi, 0)
      const totalTDS = monthPayslips.reduce((sum, p) => sum + p.tds, 0)
      const totalPT = monthPayslips.reduce((sum, p) => sum + p.professionalTax, 0)

      // Payslip status breakdown
      const statusBreakdown = monthPayslips.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Department-wise breakdown
      const departmentBreakdown = monthPayslips.reduce((acc, p) => {
        const deptName = p.employee.department?.name || 'No Department'
        if (!acc[deptName]) {
          acc[deptName] = {
            count: 0,
            totalNetPay: 0,
          }
        }
        acc[deptName].count++
        acc[deptName].totalNetPay += p.netPay
        return acc
      }, {} as Record<string, { count: number; totalNetPay: number }>)

      // Get total active employees for comparison
      const totalActiveEmployees = await prisma.employee.count({
        where: {
          employmentStatus: 'ACTIVE',
        },
      })

      // Get year-to-date stats
      const ytdPayslips = await prisma.payslip.findMany({
        where: {
          OR: [
            { year: currentYear },
            {
              year: currentYear - 1,
              month: { gte: 4 }, // April onwards
            },
          ],
        },
      })

      const ytdTotalGross = ytdPayslips.reduce((sum, p) => sum + p.grossEarnings, 0)
      const ytdTotalNet = ytdPayslips.reduce((sum, p) => sum + p.netPay, 0)
      const ytdTotalTDS = ytdPayslips.reduce((sum, p) => sum + p.tds, 0)

      return NextResponse.json({
        success: true,
        data: {
          currentMonth: {
            month: currentMonth,
            year: currentYear,
            totalEmployees,
            totalActiveEmployees,
            payslipsGenerated: totalEmployees,
            pending: totalActiveEmployees - totalEmployees,
            totalGrossPay,
            totalDeductions,
            totalNetPay,
            averageNetPay: totalEmployees > 0 ? totalNetPay / totalEmployees : 0,
            deductionBreakdown: {
              pf: totalPF,
              esi: totalESI,
              tds: totalTDS,
              professionalTax: totalPT,
            },
            statusBreakdown,
            departmentBreakdown,
          },
          yearToDate: {
            totalPayslips: ytdPayslips.length,
            totalGrossPay: ytdTotalGross,
            totalNetPay: ytdTotalNet,
            totalTDS: ytdTotalTDS,
          },
        },
      })
    }
  } catch (error) {
    console.error('Error fetching payroll stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payroll statistics' },
      { status: 500 }
    )
  }
}
