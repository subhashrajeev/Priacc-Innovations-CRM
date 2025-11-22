import { UserRole } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: UserRole
    employeeId: string | null
    employeeCode: string | null
    department: string | null
    designation: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      image: string | null
      role: UserRole
      employeeId: string
      employeeCode: string
      department: string
      designation: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    employeeId: string | null
    employeeCode: string | null
    department: string | null
    designation: string | null
  }
}
