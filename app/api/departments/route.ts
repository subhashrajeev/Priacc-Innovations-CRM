import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/departments
 * List all departments
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

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: {
          select: {
            employees: true,
            projects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: departments,
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/departments
 * Create a new department
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
        { success: false, error: 'Forbidden: Only HR can create departments' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name and code' },
        { status: 400 }
      )
    }

    // Check if department with same name or code exists
    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { name: body.name },
          { code: body.code },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Department with this name or code already exists' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name: body.name,
        code: body.code,
        description: body.description,
        headId: body.headId,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Department created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create department' },
      { status: 500 }
    )
  }
}
