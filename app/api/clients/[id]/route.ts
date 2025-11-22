import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/clients/[id]
 * Get a single client by ID
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

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                tasks: true,
                timesheets: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            projects: true,
            invoices: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: client,
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/clients/[id]
 * Update a client
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

    if (!isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only managers can update clients' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // If code is being updated, check if new code already exists
    if (body.code && body.code !== existingClient.code) {
      const codeExists = await prisma.client.findUnique({
        where: { code: body.code },
      })

      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Client code already exists' },
          { status: 400 }
        )
      }
    }

    // Update client
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        name: body.name,
        code: body.code,
        industry: body.industry,
        email: body.email,
        phone: body.phone,
        website: body.website,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        pincode: body.pincode,
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        status: body.status,
        revenue: body.revenue,
        notes: body.notes,
      },
      include: {
        _count: {
          select: {
            projects: true,
            invoices: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client
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

    if (!isManager(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only managers can delete clients' },
        { status: 403 }
      )
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            projects: true,
            invoices: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if client has associated projects or invoices
    if (client._count.projects > 0 || client._count.invoices > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete client with associated projects or invoices. Set status to INACTIVE instead.'
        },
        { status: 400 }
      )
    }

    // Delete client
    await prisma.client.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
