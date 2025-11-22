import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/utils'
import { UserRole, UserStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, employeeCode, password } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !employeeCode || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      )
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      )
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Check if employee code already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode },
    })

    if (existingEmployee) {
      return NextResponse.json(
        { message: 'Employee code already exists' },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create user and employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.EMPLOYEE,
          status: UserStatus.ACTIVE,
        },
      })

      // Create employee record
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode,
          firstName,
          lastName,
          dateOfJoining: new Date(),
        },
      })

      return { user, employee }
    })

    // Return success response (without sensitive data)
    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          employeeCode: result.employee.employeeCode,
          name: `${result.employee.firstName} ${result.employee.lastName}`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

    // Handle Prisma unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { message: 'Email or employee code already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    )
  }
}
