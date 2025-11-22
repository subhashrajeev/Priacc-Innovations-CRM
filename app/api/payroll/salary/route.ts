import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateCTCBreakdown, validateSalaryStructure } from '@/lib/payroll-utils'

/**
 * GET /api/payroll/salary
 * Get all salary structures
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only HR can view all salary structures
    if (!isHR(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const designationId = searchParams.get('designationId')
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (designationId) {
      where.designationId = designationId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const salaryStructures = await prisma.salaryStructure.findMany({
      where,
      include: {
        designation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: salaryStructures,
    })
  } catch (error) {
    console.error('Error fetching salary structures:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salary structures' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payroll/salary
 * Create a new salary structure
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only HR can create salary structures
    if (!isHR(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      designationId,
      name,
      minCTC,
      maxCTC,
      basicSalary,
      hra,
      specialAllowance,
      conveyance,
      medicalAllowance,
      otherAllowances,
      pf,
      esi,
      professionalTax,
    } = body

    // Validate required fields
    if (!designationId || !name || !minCTC || !maxCTC) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate designation exists
    const designation = await prisma.designation.findUnique({
      where: { id: designationId },
    })

    if (!designation) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      )
    }

    // If components are not provided, calculate from minCTC
    let components = {
      basicSalary: basicSalary || 0,
      hra: hra || 0,
      specialAllowance: specialAllowance || 0,
      conveyance: conveyance || 19200, // Annual
      medicalAllowance: medicalAllowance || 15000, // Annual
      otherAllowances: otherAllowances || 0,
    }

    if (!basicSalary) {
      const breakdown = calculateCTCBreakdown(minCTC)
      components = breakdown.annual
    }

    // Validate salary structure
    const validation = validateSalaryStructure({
      basic: components.basicSalary / 12,
      hra: components.hra / 12,
      specialAllowance: components.specialAllowance / 12,
      conveyance: components.conveyance / 12,
      medicalAllowance: components.medicalAllowance / 12,
      otherAllowances: components.otherAllowances / 12,
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid salary structure', details: validation.errors },
        { status: 400 }
      )
    }

    // Create salary structure
    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        designationId,
        name,
        minCTC,
        maxCTC,
        ...components,
        pf: pf || 0,
        esi: esi || 0,
        professionalTax: professionalTax || 0,
      },
      include: {
        designation: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: salaryStructure,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating salary structure:', error)
    return NextResponse.json(
      { error: 'Failed to create salary structure' },
      { status: 500 }
    )
  }
}
