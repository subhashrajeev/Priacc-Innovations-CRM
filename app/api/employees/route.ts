import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEmployeeCode, hashPassword } from '@/lib/utils'
import { UserStatus } from '@prisma/client'

/**
 * GET /api/employees
 * List all employees with pagination, filtering, and search
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const department = searchParams.get('department') || ''
    const designation = searchParams.get('designation') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { personalEmail: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (department) {
      where.departmentId = department
    }

    if (designation) {
      where.designationId = designation
    }

    if (status) {
      where.employmentStatus = status as UserStatus
    }

    // Get total count
    const total = await prisma.employee.count({ where })

    // Get employees with relations
    const employees = await prisma.employee.findMany({
      where,
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
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
            code: true,
            level: true,
          },
        },
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employees
 * Create a new employee
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

    // Check if user has HR role
    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only HR can create employees' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.dateOfJoining) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Generate employee code
    const employeeCount = await prisma.employee.count()
    const employeeCode = body.employeeCode || generateEmployeeCode('PRI', employeeCount)

    // Check if employee code already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode },
    })

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee code already exists' },
        { status: 400 }
      )
    }

    // Generate default password (employee code or random)
    const defaultPassword = body.password || employeeCode
    const hashedPassword = await hashPassword(defaultPassword)

    // Create user and employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          role: body.role || 'EMPLOYEE',
          status: 'ACTIVE',
          image: body.profilePhoto,
        },
      })

      // Create employee
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode,

          // Personal Information
          firstName: body.firstName,
          middleName: body.middleName,
          lastName: body.lastName,
          displayName: body.displayName || `${body.firstName} ${body.lastName}`,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          gender: body.gender,
          maritalStatus: body.maritalStatus,
          bloodGroup: body.bloodGroup,
          nationality: body.nationality || 'Indian',

          // Contact Information
          personalEmail: body.personalEmail,
          phoneNumber: body.phoneNumber,
          alternatePhone: body.alternatePhone,
          currentAddress: body.currentAddress,
          permanentAddress: body.permanentAddress,
          city: body.city,
          state: body.state,
          country: body.country || 'India',
          pincode: body.pincode,

          // Employment Information
          employeeType: body.employeeType || 'FULL_TIME',
          dateOfJoining: new Date(body.dateOfJoining),
          confirmationDate: body.confirmationDate ? new Date(body.confirmationDate) : null,
          probationPeriod: body.probationPeriod,
          noticePeriod: body.noticePeriod,

          // Organizational Information
          departmentId: body.departmentId,
          designationId: body.designationId,
          reportingManagerId: body.reportingManagerId,
          workLocation: body.workLocation,
          employmentStatus: 'ACTIVE',

          // Documents
          profilePhoto: body.profilePhoto,
          resumeUrl: body.resumeUrl,
          aadharNumber: body.aadharNumber,
          panNumber: body.panNumber,
          passportNumber: body.passportNumber,
          drivingLicense: body.drivingLicense,

          // Emergency Contact
          emergencyContactName: body.emergencyContactName,
          emergencyContactPhone: body.emergencyContactPhone,
          emergencyContactRelation: body.emergencyContactRelation,

          // Bank Details
          bankName: body.bankName,
          accountNumber: body.accountNumber,
          ifscCode: body.ifscCode,
          upiId: body.upiId,
        },
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

      return { user, employee }
    })

    return NextResponse.json({
      success: true,
      data: result.employee,
      message: 'Employee created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
