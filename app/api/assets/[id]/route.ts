import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AssetType, AssetStatus } from '@prisma/client'

/**
 * GET /api/assets/[id]
 * Get asset details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        allocations: {
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
            allocatedDate: 'desc',
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

    return NextResponse.json({
      success: true,
      data: asset,
    })
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/assets/[id]
 * Update asset (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Forbidden: Only admins can update assets' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        name: body.name,
        type: body.type as AssetType,
        brand: body.brand,
        model: body.model,
        serialNumber: body.serialNumber,
        specifications: body.specifications,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        purchasePrice: body.purchasePrice,
        vendor: body.vendor,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
        status: body.status as AssetStatus,
        condition: body.condition,
        depreciationRate: body.depreciationRate,
        currentValue: body.currentValue,
      },
    })

    return NextResponse.json({
      success: true,
      data: asset,
      message: 'Asset updated successfully',
    })
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/assets/[id]
 * Delete asset (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Forbidden: Only admins can delete assets' },
        { status: 403 }
      )
    }

    // Check if asset has active allocations
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        allocations: {
          where: {
            returnDate: null,
          },
        },
      },
    })

    if (asset && asset.allocations.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete asset with active allocations' },
        { status: 400 }
      )
    }

    await prisma.asset.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
