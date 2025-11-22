import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/training/my-trainings
 * Get all trainings enrolled by the current user
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {
      employeeId: session.user.employeeId,
    }

    if (status) {
      where.status = status
    }

    const enrollments = await prisma.employeeTraining.findMany({
      where,
      include: {
        training: {
          include: {
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledDate: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: enrollments,
    })
  } catch (error) {
    console.error('Error fetching my trainings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trainings' },
      { status: 500 }
    )
  }
}
