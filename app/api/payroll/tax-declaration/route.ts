import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFinancialYear } from '@/lib/utils'

/**
 * GET /api/payroll/tax-declaration
 * Get tax declarations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const financialYear = searchParams.get('financialYear')

    const where: any = {}

    // If not HR, can only view their own declarations
    if (!isHR(session.user.role)) {
      where.employeeId = session.user.employeeId
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    if (financialYear) {
      where.financialYear = financialYear
    }

    const taxDeclarations = await prisma.taxDeclaration.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: taxDeclarations,
    })
  } catch (error) {
    console.error('Error fetching tax declarations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax declarations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payroll/tax-declaration
 * Create or update tax declaration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      financialYear,
      ppf,
      elss,
      lifInsurance,
      homeLoanPrincipal,
      tuitionFees,
      nsc,
      healthInsurance,
      hraExemption,
      nps,
      homeLoanInterest,
      proofsUrl,
    } = body

    // Use current financial year if not provided
    const fy = financialYear || getFinancialYear()

    // Employees can only create their own declarations
    const employeeId = isHR(session.user.role) && body.employeeId
      ? body.employeeId
      : session.user.employeeId

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Validate Section 80C limit (₹1.5L)
    const section80CTotal = (ppf || 0) + (elss || 0) + (lifInsurance || 0) +
                            (homeLoanPrincipal || 0) + (tuitionFees || 0) + (nsc || 0)

    if (section80CTotal > 150000) {
      return NextResponse.json(
        { error: 'Section 80C total cannot exceed ₹1,50,000' },
        { status: 400 }
      )
    }

    // Check if declaration already exists
    const existingDeclaration = await prisma.taxDeclaration.findUnique({
      where: {
        employeeId_financialYear: {
          employeeId,
          financialYear: fy,
        },
      },
    })

    let taxDeclaration

    if (existingDeclaration) {
      // Update existing declaration
      taxDeclaration = await prisma.taxDeclaration.update({
        where: {
          employeeId_financialYear: {
            employeeId,
            financialYear: fy,
          },
        },
        data: {
          ppf: ppf || 0,
          elss: elss || 0,
          lifInsurance: lifInsurance || 0,
          homeLoanPrincipal: homeLoanPrincipal || 0,
          tuitionFees: tuitionFees || 0,
          nsc: nsc || 0,
          healthInsurance: healthInsurance || 0,
          hraExemption: hraExemption || 0,
          nps: nps || 0,
          homeLoanInterest: homeLoanInterest || 0,
          proofsSubmitted: !!proofsUrl,
          proofsUrl: proofsUrl || existingDeclaration.proofsUrl,
          submittedAt: body.submit ? new Date() : existingDeclaration.submittedAt,
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
        },
      })
    } else {
      // Create new declaration
      taxDeclaration = await prisma.taxDeclaration.create({
        data: {
          employeeId,
          financialYear: fy,
          ppf: ppf || 0,
          elss: elss || 0,
          lifInsurance: lifInsurance || 0,
          homeLoanPrincipal: homeLoanPrincipal || 0,
          tuitionFees: tuitionFees || 0,
          nsc: nsc || 0,
          healthInsurance: healthInsurance || 0,
          hraExemption: hraExemption || 0,
          nps: nps || 0,
          homeLoanInterest: homeLoanInterest || 0,
          proofsSubmitted: !!proofsUrl,
          proofsUrl: proofsUrl || null,
          submittedAt: body.submit ? new Date() : null,
        },
        include: {
          employee: {
            include: {
              department: true,
              designation: true,
            },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: taxDeclaration,
      message: existingDeclaration ? 'Tax declaration updated' : 'Tax declaration created',
    }, { status: existingDeclaration ? 200 : 201 })
  } catch (error) {
    console.error('Error saving tax declaration:', error)
    return NextResponse.json(
      { error: 'Failed to save tax declaration' },
      { status: 500 }
    )
  }
}
