import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/utils'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            employee: {
              include: {
                department: true,
                designation: true,
              },
            },
          },
        })

        if (!user) {
          throw new Error('User not found')
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Account is not active')
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.employee
            ? `${user.employee.firstName} ${user.employee.lastName}`
            : user.email,
          image: user.employee?.profilePhoto || null,
          employeeId: user.employee?.id || null,
          employeeCode: user.employee?.employeeCode || null,
          department: user.employee?.department?.name || null,
          designation: user.employee?.designation?.title || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.employeeId = user.employeeId
        token.employeeCode = user.employeeCode
        token.department = user.department
        token.designation = user.designation
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole
        session.user.employeeId = token.employeeId as string
        session.user.employeeCode = token.employeeCode as string
        session.user.department = token.department as string
        session.user.designation = token.designation as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper function to check user role
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

// Helper function to check if user is admin
export function isAdmin(userRole: UserRole): boolean {
  return hasRole(userRole, [UserRole.SUPER_ADMIN, UserRole.ADMIN])
}

// Helper function to check if user is HR
export function isHR(userRole: UserRole): boolean {
  return hasRole(userRole, [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.HR_EXECUTIVE,
  ])
}

// Helper function to check if user is manager
export function isManager(userRole: UserRole): boolean {
  return hasRole(userRole, [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.TEAM_LEAD,
  ])
}
