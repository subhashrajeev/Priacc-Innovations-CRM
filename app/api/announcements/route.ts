import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AnnouncementPriority } from '@prisma/client'

/**
 * GET /api/announcements
 * Get all announcements
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const priority = searchParams.get('priority')
    const active = searchParams.get('active')

    const where: any = {}

    if (priority) {
      where.priority = priority as AnnouncementPriority
    }

    if (active === 'true') {
      where.isActive = true
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ]
    }

    // Get employee's department
    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      select: { departmentId: true },
    })

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        publisher: {
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
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
    })

    // Filter announcements based on targeting
    const filteredAnnouncements = announcements.filter((announcement) => {
      // If no targeting specified, show to all
      if (!announcement.targetDepartments && !announcement.targetEmployees) {
        return true
      }

      // Check if targeted to specific departments
      if (announcement.targetDepartments && employee?.departmentId) {
        const departments = announcement.targetDepartments.split(',')
        if (departments.includes(employee.departmentId)) {
          return true
        }
      }

      // Check if targeted to specific employees
      if (announcement.targetEmployees) {
        const employees = announcement.targetEmployees.split(',')
        if (employees.includes(session.user.employeeId!)) {
          return true
        }
      }

      return false
    })

    return NextResponse.json({
      success: true,
      data: filteredAnnouncements,
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/announcements
 * Create a new announcement (HR/Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isHR(session.user.role) && !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR/Admin can create announcements' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validation
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        priority: body.priority || AnnouncementPriority.MEDIUM,
        publishedBy: session.user.employeeId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        targetDepartments: body.targetDepartments?.join(','),
        targetEmployees: body.targetEmployees?.join(','),
        attachments: body.attachments,
        isActive: body.isActive !== false,
      },
      include: {
        publisher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create notifications for targeted users
    let targetUsers: string[] = []

    if (!body.targetDepartments && !body.targetEmployees) {
      // Send to all employees
      const allEmployees = await prisma.employee.findMany({
        select: { userId: true },
      })
      targetUsers = allEmployees.map((emp) => emp.userId)
    } else {
      // Send to specific departments or employees
      const where: any = {}

      if (body.targetDepartments?.length > 0) {
        where.departmentId = { in: body.targetDepartments }
      }

      if (body.targetEmployees?.length > 0) {
        where.OR = [
          where.departmentId ? { departmentId: where.departmentId } : {},
          { id: { in: body.targetEmployees } },
        ]
        delete where.departmentId
      }

      const targetedEmployees = await prisma.employee.findMany({
        where,
        select: { userId: true },
      })
      targetUsers = targetedEmployees.map((emp) => emp.userId)
    }

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map((userId) => ({
          userId,
          type: 'ANNOUNCEMENT',
          title: 'New Announcement',
          message: body.title,
          link: `/announcements`,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}
