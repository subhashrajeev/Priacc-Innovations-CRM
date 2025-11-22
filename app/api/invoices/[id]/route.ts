import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isManager } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/invoices/[id]
 * Get a single invoice by ID
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

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        project: {
          include: {
            department: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/invoices/[id]
 * Update an invoice
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
        { success: false, error: 'Forbidden: Only managers can update invoices' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // If invoice number is being updated, check if new number already exists
    if (body.invoiceNumber && body.invoiceNumber !== existingInvoice.invoiceNumber) {
      const numberExists = await prisma.invoice.findUnique({
        where: { invoiceNumber: body.invoiceNumber },
      })

      if (numberExists) {
        return NextResponse.json(
          { success: false, error: 'Invoice number already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}

    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber
    if (body.clientId !== undefined) updateData.clientId = body.clientId
    if (body.projectId !== undefined) updateData.projectId = body.projectId
    if (body.items !== undefined) updateData.items = body.items
    if (body.issueDate !== undefined) updateData.issueDate = new Date(body.issueDate)
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate)
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.termsConditions !== undefined) updateData.termsConditions = body.termsConditions

    // Recalculate totals if amounts changed
    if (body.subtotal !== undefined || body.tax !== undefined || body.discount !== undefined) {
      const subtotal = body.subtotal !== undefined ? body.subtotal : existingInvoice.subtotal
      const tax = body.tax !== undefined ? body.tax : existingInvoice.tax
      const discount = body.discount !== undefined ? body.discount : existingInvoice.discount
      const total = subtotal + tax - discount

      updateData.subtotal = subtotal
      updateData.tax = tax
      updateData.discount = discount
      updateData.total = total
    }

    // Handle status updates
    if (body.status !== undefined) {
      updateData.status = body.status
      // Set paidDate when status is set to PAID
      if (body.status === 'PAID' && !existingInvoice.paidDate) {
        updateData.paidDate = new Date()
      }
    }

    // Handle manual paidDate updates
    if (body.paidDate !== undefined) {
      updateData.paidDate = body.paidDate ? new Date(body.paidDate) : null
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/invoices/[id]
 * Delete an invoice
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
        { success: false, error: 'Forbidden: Only managers can delete invoices' },
        { status: 403 }
      )
    }

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting paid invoices
    if (invoice.status === 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete paid invoice. Set status to CANCELLED instead.'
        },
        { status: 400 }
      )
    }

    // Delete invoice
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
