import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSalaryStructure } from '@/lib/payroll-utils'

/**
 * GET /api/payroll/salary/[id]
 * Get a salary structure by ID
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

    // Only HR can view salary structures
    if (!isHR(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const salaryStructure = await prisma.salaryStructure.findUnique({
      where: { id: params.id },
      include: {
        designation: true,
      },
    })

    if (!salaryStructure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: salaryStructure,
    })
  } catch (error) {
    console.error('Error fetching salary structure:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salary structure' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/payroll/salary/[id]
 * Update a salary structure
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

    // Only HR can update salary structures
    if (!isHR(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Check if salary structure exists
    const existingStructure = await prisma.salaryStructure.findUnique({
      where: { id: params.id },
    })

    if (!existingStructure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      )
    }

    // If updating components, validate them
    if (body.basicSalary || body.hra || body.specialAllowance) {
      const components = {
        basic: (body.basicSalary || existingStructure.basicSalary) / 12,
        hra: (body.hra || existingStructure.hra) / 12,
        specialAllowance: (body.specialAllowance || existingStructure.specialAllowance) / 12,
        conveyance: (body.conveyance || existingStructure.conveyance) / 12,
        medicalAllowance: (body.medicalAllowance || existingStructure.medicalAllowance) / 12,
        otherAllowances: (body.otherAllowances || existingStructure.otherAllowances) / 12,
      }

      const validation = validateSalaryStructure(components)

      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid salary structure', details: validation.errors },
          { status: 400 }
        )
      }
    }

    // Update salary structure
    const salaryStructure = await prisma.salaryStructure.update({
      where: { id: params.id },
      data: body,
      include: {
        designation: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: salaryStructure,
    })
  } catch (error) {
    console.error('Error updating salary structure:', error)
    return NextResponse.json(
      { error: 'Failed to update salary structure' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/payroll/salary/[id]
 * Delete a salary structure
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only HR can delete salary structures
    if (!isHR(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if salary structure exists
    const existingStructure = await prisma.salaryStructure.findUnique({
      where: { id: params.id },
    })

    if (!existingStructure) {
      return NextResponse.json(
        { error: 'Salary structure not found' },
        { status: 404 }
      )
    }

    // Soft delete by marking as inactive
    const salaryStructure = await prisma.salaryStructure.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Salary structure deleted successfully',
      data: salaryStructure,
    })
  } catch (error) {
    console.error('Error deleting salary structure:', error)
    return NextResponse.json(
      { error: 'Failed to delete salary structure' },
      { status: 500 }
    )
  }
}
