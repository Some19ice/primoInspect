import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Role = Profile['role']

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
}

export interface AuthError {
  code: string
  message: string
  statusCode: number
}

export interface AuthResult {
  user?: AuthenticatedUser
  error?: AuthError
}

// Standardized error responses
export const AUTH_ERRORS = {
  AUTHENTICATION_REQUIRED: {
    code: 'AUTH_REQUIRED',
    message: 'Authentication required',
    statusCode: 401,
  },
  INVALID_SESSION: {
    code: 'INVALID_SESSION',
    message: 'Invalid or expired session',
    statusCode: 401,
  },
  PROFILE_NOT_FOUND: {
    code: 'PROFILE_NOT_FOUND',
    message: 'User profile not found',
    statusCode: 401,
  },
  ACCOUNT_DEACTIVATED: {
    code: 'ACCOUNT_DEACTIVATED',
    message: 'Account is deactivated',
    statusCode: 403,
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions',
    statusCode: 403,
  },
  PROJECT_ACCESS_DENIED: {
    code: 'PROJECT_ACCESS_DENIED',
    message: 'Project access denied',
    statusCode: 403,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Authentication service error',
    statusCode: 500,
  },
} as const

// Create server-side Supabase client with cookies for authentication
async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Create Supabase client for middleware using request cookies
function createSupabaseMiddlewareClient(request: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // Cannot set cookies in middleware during auth check
        },
        remove() {
          // Cannot remove cookies in middleware during auth check
        },
      },
    }
  )
}

// Create server-side Supabase client with service role for database operations
function createSupabaseServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      cookies: {
        get: () => undefined,
        set: () => { },
        remove: () => { }
      }
    }
  )
}

// Main authentication service
export class AuthService {
  private static instance: AuthService

  private constructor() { }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async authenticate(request: NextRequest): Promise<AuthResult> {
    try {
      // Use middleware-compatible client
      const supabaseServer = createSupabaseMiddlewareClient(request)

      // Get the current user session
      const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

      if (userError || !user) {
        return {
          error: AUTH_ERRORS.AUTHENTICATION_REQUIRED,
        }
      }

      // Get the user's profile from our profiles table
      const { data: profile, error: profileError } = await supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      let userProfile = profile

      // If profile doesn't exist, create it from user metadata (for new users)
      if (profileError || !profile) {
        console.log('Profile not found, creating from user metadata:', user.user_metadata)

        // Create profile from user metadata
        const newProfile = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: (user.user_metadata?.role || 'INSPECTOR') as any,
          avatar: null,
          is_active: true,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString()
        }

        // Try to insert the profile
        const { data: insertedProfile, error: insertError } = await supabaseServer
          .from('profiles')
          .insert(newProfile as any)
          .select()
          .single()

        if (insertError) {
          console.warn('Failed to create profile, using fallback:', insertError)
          // Use fallback profile
          userProfile = newProfile as any
        } else {
          userProfile = insertedProfile
        }
      }

      // Check if user is active
      if (!(userProfile as any)?.is_active) {
        return {
          error: AUTH_ERRORS.ACCOUNT_DEACTIVATED,
        }
      }

      const authenticatedUser: AuthenticatedUser = {
        id: (userProfile as any)?.id,
        email: (userProfile as any)?.email,
        name: (userProfile as any)?.name,
        role: (userProfile as any)?.role,
        isActive: (userProfile as any)?.is_active,
      }

      return { user: authenticatedUser }
    } catch (error) {
      console.error('Authentication error:', error)
      return {
        error: AUTH_ERRORS.INTERNAL_ERROR,
      }
    }
  }

  async checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const supabaseServer = await createSupabaseServerClient()

      const { data: membership, error } = await supabaseServer
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle()

      return !error && !!membership
    } catch (error) {
      console.error('Error checking project access:', error)
      return false
    }
  }

  createErrorResponse(error: AuthError): NextResponse {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    )
  }
}

// Role hierarchy checking
export function hasRoleAccess(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, Role[]> = {
    PROJECT_MANAGER: ['PROJECT_MANAGER', 'INSPECTOR'],
    EXECUTIVE: ['EXECUTIVE'],
    INSPECTOR: ['INSPECTOR'],
  }

  return roleHierarchy[userRole]?.includes(requiredRole) || false
}

// Helper function to extract project ID from request
export function getProjectIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')

  // Look for project ID in common patterns
  const projectIndex = pathSegments.indexOf('projects')
  if (projectIndex !== -1 && pathSegments[projectIndex + 1]) {
    return pathSegments[projectIndex + 1]
  }

  // Check query parameters
  return url.searchParams.get('projectId')
}

// Audit logging helper
export async function logAuditEvent(
  entityType: string,
  entityId: string,
  action: string,
  userId: string,
  metadata: any = {},
  request?: NextRequest
) {
  try {
    const supabaseService = createSupabaseServiceClient()

    await supabaseService
      .from('audit_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        user_id: userId,
        metadata: {
          ...metadata,
          ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
          user_agent: request?.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      } as any)
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging shouldn't break the main flow
  }
}