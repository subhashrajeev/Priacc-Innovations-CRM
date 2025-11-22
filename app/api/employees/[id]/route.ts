import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/employees/:id
 * Get a single employee by ID
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

    const { id } = params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            status: true,
            image: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
            code: true,
            level: true,
            description: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: {
              select: {
                title: true,
              },
            },
          },
        },
        reportees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: {
              select: {
                title: true,
              },
            },
            profilePhoto: true,
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            type: true,
            fileUrl: true,
            fileName: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check if user can view this employee
    // Employees can view their own profile, HR and Admins can view all
    if (
      !isHR(session.user.role) &&
      employee.id !== session.user.employeeId
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only view your own profile' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee,
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/employees/:id
 * Update an employee
 * HR can update any employee, employees can update their own limited fields
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

    const { id } = params
    const body = await request.json()

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwnProfile = existingEmployee.id === session.user.employeeId
    const canEdit = isHR(session.user.role) || isOwnProfile

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to edit this employee' },
        { status: 403 }
      )
    }

    // If not HR, limit what can be updated
    const allowedFields = isHR(session.user.role)
      ? body
      : {
          // Employees can only update these fields
          personalEmail: body.personalEmail,
          phoneNumber: body.phoneNumber,
          alternatePhone: body.alternatePhone,
          currentAddress: body.currentAddress,
          profilePhoto: body.profilePhoto,
          emergencyContactName: body.emergencyContactName,
          emergencyContactPhone: body.emergencyContactPhone,
          emergencyContactRelation: body.emergencyContactRelation,
          bankName: body.bankName,
          accountNumber: body.accountNumber,
          ifscCode: body.ifscCode,
          upiId: body.upiId,
        }

    // Prepare update data
    const updateData: any = {}

    // Personal Information (HR only for most)
    if (isHR(session.user.role)) {
      if (body.firstName !== undefined) updateData.firstName = body.firstName
      if (body.middleName !== undefined) updateData.middleName = body.middleName
      if (body.lastName !== undefined) updateData.lastName = body.lastName
      if (body.displayName !== undefined) updateData.displayName = body.displayName
      if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null
      if (body.gender !== undefined) updateData.gender = body.gender
      if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus
      if (body.bloodGroup !== undefined) updateData.bloodGroup = body.bloodGroup
      if (body.nationality !== undefined) updateData.nationality = body.nationality
      if (body.employeeType !== undefined) updateData.employeeType = body.employeeType
      if (body.dateOfJoining !== undefined) updateData.dateOfJoining = new Date(body.dateOfJoining)
      if (body.confirmationDate !== undefined) updateData.confirmationDate = body.confirmationDate ? new Date(body.confirmationDate) : null
      if (body.probationPeriod !== undefined) updateData.probationPeriod = body.probationPeriod
      if (body.noticePeriod !== undefined) updateData.noticePeriod = body.noticePeriod
      if (body.departmentId !== undefined) updateData.departmentId = body.departmentId
      if (body.designationId !== undefined) updateData.designationId = body.designationId
      if (body.reportingManagerId !== undefined) updateData.reportingManagerId = body.reportingManagerId
      if (body.workLocation !== undefined) updateData.workLocation = body.workLocation
      if (body.employmentStatus !== undefined) updateData.employmentStatus = body.employmentStatus
      if (body.resumeUrl !== undefined) updateData.resumeUrl = body.resumeUrl
      if (body.aadharNumber !== undefined) updateData.aadharNumber = body.aadharNumber
      if (body.panNumber !== undefined) updateData.panNumber = body.panNumber
      if (body.passportNumber !== undefined) updateData.passportNumber = body.passportNumber
      if (body.drivingLicense !== undefined) updateData.drivingLicense = body.drivingLicense
      if (body.permanentAddress !== undefined) updateData.permanentAddress = body.permanentAddress
      if (body.city !== undefined) updateData.city = body.city
      if (body.state !== undefined) updateData.state = body.state
      if (body.country !== undefined) updateData.country = body.country
      if (body.pincode !== undefined) updateData.pincode = body.pincode
    }

    // Fields employees can update
    if (allowedFields.personalEmail !== undefined) updateData.personalEmail = allowedFields.personalEmail
    if (allowedFields.phoneNumber !== undefined) updateData.phoneNumber = allowedFields.phoneNumber
    if (allowedFields.alternatePhone !== undefined) updateData.alternatePhone = allowedFields.alternatePhone
    if (allowedFields.currentAddress !== undefined) updateData.currentAddress = allowedFields.currentAddress
    if (allowedFields.profilePhoto !== undefined) updateData.profilePhoto = allowedFields.profilePhoto
    if (allowedFields.emergencyContactName !== undefined) updateData.emergencyContactName = allowedFields.emergencyContactName
    if (allowedFields.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = allowedFields.emergencyContactPhone
    if (allowedFields.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = allowedFields.emergencyContactRelation
    if (allowedFields.bankName !== undefined) updateData.bankName = allowedFields.bankName
    if (allowedFields.accountNumber !== undefined) updateData.accountNumber = allowedFields.accountNumber
    if (allowedFields.ifscCode !== undefined) updateData.ifscCode = allowedFields.ifscCode
    if (allowedFields.upiId !== undefined) updateData.upiId = allowedFields.upiId

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            status: true,
          },
        },
        department: true,
        designation: true,
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
    })

    // Update user role if provided and user is HR
    if (isHR(session.user.role) && body.role !== undefined) {
      await prisma.user.update({
        where: { id: existingEmployee.userId },
        data: { role: body.role },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/employees/:id
 * Soft delete an employee (set status to TERMINATED)
 * Restricted to HR and Admins
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

    // Check if user has HR role
    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR can delete employees' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - permanently remove from database
      await prisma.$transaction([
        prisma.employee.delete({ where: { id } }),
        prisma.user.delete({ where: { id: employee.userId } }),
      ])

      return NextResponse.json({
        success: true,
        message: 'Employee permanently deleted',
      })
    } else {
      // Soft delete - set status to TERMINATED
      const now = new Date()
      await prisma.$transaction([
        prisma.employee.update({
          where: { id },
          data: {
            employmentStatus: 'TERMINATED',
            lastWorkingDate: now,
          },
        }),
        prisma.user.update({
          where: { id: employee.userId },
          data: {
            status: 'TERMINATED',
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        message: 'Employee marked as terminated',
      })
    }
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
