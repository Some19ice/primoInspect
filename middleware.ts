import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/types'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/projects',
  '/api/inspections',
  '/api/evidence',
  '/api/reports',
  '/api/users/me'
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

  // Create Supabase client for middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

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

  // Get session for protected routes
  if (isProtectedRoute) {
    const { data: { session }, error } = await supabase.auth.getSession()

    // Redirect to signin if not authenticated
    if (!session || error) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Get user profile for role-based access control
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      console.error('Profile not found for authenticated user')
      const redirectUrl = new URL('/auth/signin', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Role-based access control for dashboard routes
    if (pathname.startsWith('/dashboard/')) {
      const requiredRole = getDashboardRole(pathname)
      
      if (requiredRole && !hasRoleAccess((profile as any)?.role, requiredRole)) {
        // Redirect to appropriate dashboard based on user role
        const userDashboard = getRoleDashboard((profile as any)?.role)
        return NextResponse.redirect(new URL(userDashboard, request.url))
      }
    }

    // API route role validation is handled by withSupabaseAuth in each route
    // Just ensure session exists for API routes
    if (pathname.startsWith('/api/')) {
      // Add user info to headers for API routes
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-role', (profile as any)?.role || 'inspector')
    }
  }

  return response
}

// Extract required role from dashboard path
function getDashboardRole(pathname: string): string | null {
  if (pathname.startsWith('/dashboard/executive')) return 'EXECUTIVE'
  if (pathname.startsWith('/dashboard/manager')) return 'PROJECT_MANAGER'
  if (pathname.startsWith('/dashboard/inspector')) return 'INSPECTOR'
  return null
}

// Check if user role has access to required role
function hasRoleAccess(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, string[]> = {
    'EXECUTIVE': ['EXECUTIVE'],
    'PROJECT_MANAGER': ['PROJECT_MANAGER', 'INSPECTOR'],
    'INSPECTOR': ['INSPECTOR']
  }

  return roleHierarchy[userRole]?.includes(requiredRole) || userRole === requiredRole
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