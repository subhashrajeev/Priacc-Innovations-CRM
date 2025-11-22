import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect authenticated users away from auth pages
    if (path.startsWith('/auth') && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Check role-based access
    if (path.startsWith('/admin') && token?.role !== 'SUPER_ADMIN' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (path.startsWith('/hr') && !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'].includes(token?.role || '')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith('/auth')) {
          return true
        }
        // All other pages require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employees/:path*',
    '/attendance/:path*',
    '/leave/:path*',
    '/payroll/:path*',
    '/performance/:path*',
    '/recruitment/:path*',
    '/projects/:path*',
    '/training/:path*',
    '/assets/:path*',
    '/expenses/:path*',
    '/announcements/:path*',
    '/analytics/:path*',
    '/admin/:path*',
    '/hr/:path*',
    '/auth/:path*',
  ],
}
