import { NextRequest, NextResponse } from 'next/server'
import { AuthService, hasRoleAccess } from '@/lib/auth/auth-service'
import { Database } from '@/lib/supabase/types'

type Role = Database['public']['Tables']['profiles']['Row']['role']

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/projects',
  '/api/inspections',
  '/api/evidence',
  '/api/reports',
  '/api/users/me',
  '/api/audit',
  '/api/escalations',
  '/api/checklists'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password'
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Allow public routes without authentication
  if (isPublicRoute && !isProtectedRoute) {
    return response
  }

  // Handle authentication for protected routes
  if (isProtectedRoute) {
    const authService = AuthService.getInstance()
    const authResult = await authService.authenticate(request)

    // Handle authentication failure
    if (authResult.error) {
      // For API routes, return JSON error instead of redirecting
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: {
              code: authResult.error.code,
              message: authResult.error.message,
            },
          },
          { status: authResult.error.statusCode }
        )
      }
      
      // For page routes, redirect to signin
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const user = authResult.user!

    // Role-based access control for dashboard routes
    if (pathname.startsWith('/dashboard/')) {
      const requiredRole = getDashboardRole(pathname)
      
      if (requiredRole && !hasRoleAccess(user.role, requiredRole)) {
        // Redirect to appropriate dashboard based on user role
        const userDashboard = getRoleDashboard(user.role)
        return NextResponse.redirect(new URL(userDashboard, request.url))
      }
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-role', user.role)
      response.headers.set('x-user-email', user.email)
    }
  }

  return response
}

// Extract required role from dashboard path
function getDashboardRole(pathname: string): Role | null {
  if (pathname.startsWith('/dashboard/executive')) return 'EXECUTIVE'
  if (pathname.startsWith('/dashboard/manager')) return 'PROJECT_MANAGER'
  if (pathname.startsWith('/dashboard/inspector')) return 'INSPECTOR'
  return null
}

// Get appropriate dashboard for user role
function getRoleDashboard(role: string): string {
  switch (role) {
    case 'EXECUTIVE':
      return '/dashboard/executive'
    case 'PROJECT_MANAGER':
      return '/dashboard/manager'
    case 'INSPECTOR':
      return '/dashboard/inspector'
    default:
      return '/dashboard/inspector'
  }
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}