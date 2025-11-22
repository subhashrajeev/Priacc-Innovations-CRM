import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AssetStatus } from '@prisma/client'

/**
 * POST /api/assets/allocate
 * Allocate asset to employee (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins can allocate assets' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validation
    if (!body.assetId || !body.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id: body.assetId },
      include: {
        allocations: {
          where: {
            returnDate: null,
          },
        },
      },
    })

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }

    if (asset.allocations.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Asset is already allocated' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Create allocation and update asset status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create allocation
      const allocation = await tx.assetAllocation.create({
        data: {
          assetId: body.assetId,
          employeeId: body.employeeId,
          allocatedDate: new Date(),
          expectedReturnDate: body.expectedReturnDate ? new Date(body.expectedReturnDate) : null,
          condition: body.condition,
          notes: body.notes,
        },
        include: {
          asset: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
        },
      })

      // Update asset status
      await tx.asset.update({
        where: { id: body.assetId },
        data: {
          status: AssetStatus.ALLOCATED,
        },
      })

      return allocation
    })

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: employee.userId,
        type: 'SYSTEM',
        title: 'Asset Allocated',
        message: `${asset.name} (${asset.assetCode}) has been allocated to you`,
        link: `/assets/my-assets`,
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Asset allocated successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error allocating asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to allocate asset' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/assets/allocate
 * Return asset (Admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins can return assets' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validation
    if (!body.allocationId) {
      return NextResponse.json(
        { success: false, error: 'Missing allocation ID' },
        { status: 400 }
      )
    }

    // Get allocation
    const allocation = await prisma.assetAllocation.findUnique({
      where: { id: body.allocationId },
      include: {
        asset: true,
        employee: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!allocation) {
      return NextResponse.json(
        { success: false, error: 'Allocation not found' },
        { status: 404 }
      )
    }

    if (allocation.returnDate) {
      return NextResponse.json(
        { success: false, error: 'Asset already returned' },
        { status: 400 }
      )
    }

    // Update allocation and asset status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update allocation
      const updatedAllocation = await tx.assetAllocation.update({
        where: { id: body.allocationId },
        data: {
          returnDate: new Date(),
          condition: body.condition,
          notes: body.notes,
        },
      })

      // Update asset status
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: {
          status: AssetStatus.AVAILABLE,
          condition: body.condition,
        },
      })

      return updatedAllocation
    })

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: allocation.employee.userId,
        type: 'SYSTEM',
        title: 'Asset Returned',
        message: `${allocation.asset.name} (${allocation.asset.assetCode}) has been returned`,
        link: `/assets/my-assets`,
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Asset returned successfully',
    })
  } catch (error) {
    console.error('Error returning asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to return asset' },
      { status: 500 }
    )
  }
}
