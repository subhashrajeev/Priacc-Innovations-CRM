import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/designations
 * List all designations
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
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = includeInactive ? {} : { isActive: true }

    const designations = await prisma.designation.findMany({
      where,
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: designations,
    })
  } catch (error) {
    console.error('Error fetching designations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch designations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/designations
 * Create a new designation
 * Restricted to HR and Admins
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

    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR can create designations' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.title || !body.code || body.level === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, code, and level' },
        { status: 400 }
      )
    }

    // Check if designation with same title or code exists
    const existing = await prisma.designation.findFirst({
      where: {
        OR: [
          { title: body.title },
          { code: body.code },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Designation with this title or code already exists' },
        { status: 400 }
      )
    }

    const designation = await prisma.designation.create({
      data: {
        title: body.title,
        code: body.code,
        level: body.level,
        description: body.description,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    return NextResponse.json({
      success: true,
      data: designation,
      message: 'Designation created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating designation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create designation' },
      { status: 500 }
    )
  }
}
