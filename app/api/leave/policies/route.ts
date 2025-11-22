import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.employeeId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const policies = await prisma.leavePolicy.findMany({
      where: { isActive: true },
      orderBy: {
        leaveType: 'asc',
      },
    })

    return NextResponse.json(policies)
  } catch (error) {
    console.error('Error fetching leave policies:', error)
    return NextResponse.json(
      { message: 'Failed to fetch leave policies' },
      { status: 500 }
    )
  }
}
