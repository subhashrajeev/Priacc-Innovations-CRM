import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AnnouncementPriority } from '@prisma/client'

/**
 * GET /api/announcements/[id]
 * Get announcement details
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

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
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
    })

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    })
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcement' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/announcements/[id]
 * Update announcement (HR/Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Forbidden: Only HR/Admin can update announcements' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: {
        title: body.title,
        content: body.content,
        priority: body.priority as AnnouncementPriority,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        targetDepartments: body.targetDepartments?.join(','),
        targetEmployees: body.targetEmployees?.join(','),
        attachments: body.attachments,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully',
    })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/announcements/[id]
 * Delete announcement (HR/Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: 'Forbidden: Only HR/Admin can delete announcements' },
        { status: 403 }
      )
    }

    await prisma.announcement.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}
