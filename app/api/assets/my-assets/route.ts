import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/assets/my-assets
 * Get all assets allocated to the current user
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
    const includeReturned = searchParams.get('includeReturned') === 'true'

    const where: any = {
      employeeId: session.user.employeeId,
    }

    if (!includeReturned) {
      where.returnDate = null
    }

    const allocations = await prisma.assetAllocation.findMany({
      where,
      include: {
        asset: true,
      },
      orderBy: {
        allocatedDate: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: allocations,
    })
  } catch (error) {
    console.error('Error fetching my assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}
