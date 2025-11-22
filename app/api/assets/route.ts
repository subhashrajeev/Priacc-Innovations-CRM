import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AssetType, AssetStatus } from '@prisma/client'

/**
 * GET /api/assets
 * List all assets with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (type) {
      where.type = type as AssetType
    }

    if (status) {
      where.status = status as AssetStatus
    }

    if (search) {
      where.OR = [
        { assetCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        allocations: {
          where: {
            returnDate: null,
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
        },
        _count: {
          select: {
            allocations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: assets,
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/assets
 * Create a new asset (Admin only)
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
        { success: false, error: 'Forbidden: Only admins can create assets' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validation
    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate asset code
    const count = await prisma.asset.count()
    const assetCode = body.assetCode || `AST-${String(count + 1).padStart(5, '0')}`

    // Check if code already exists
    const existing = await prisma.asset.findUnique({
      where: { assetCode },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Asset code already exists' },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.create({
      data: {
        assetCode,
        name: body.name,
        type: body.type as AssetType,
        brand: body.brand,
        model: body.model,
        serialNumber: body.serialNumber,
        specifications: body.specifications,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        purchasePrice: body.purchasePrice,
        vendor: body.vendor,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : null,
        status: body.status || AssetStatus.AVAILABLE,
        condition: body.condition,
        depreciationRate: body.depreciationRate,
        currentValue: body.currentValue || body.purchasePrice,
      },
    })

    return NextResponse.json({
      success: true,
      data: asset,
      message: 'Asset created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}
