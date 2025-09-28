import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Role = Profile['role']

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
}

export interface RBACOptions {
  requiredRole?: Role
  requiredRoles?: Role[]
  allowSameUser?: boolean
  checkProjectAccess?: boolean
}

// Create server-side Supabase client with cookies
function createSupabaseServerClient() {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookies = await cookieStore
          return cookies.get(name)?.value
        },
      },
    }
  )
}

// Main RBAC middleware function for Supabase
export async function withSupabaseAuth(
  request: NextRequest,
  options: RBACOptions = {}
): Promise<{ user: AuthenticatedUser | null; error?: NextResponse }> {
  try {
    const supabaseServer = createSupabaseServerClient()
    
    // Get the current user session
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

    if (userError || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    // Get the user's profile from our profiles table
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'User profile not found' },
          { status: 401 }
        ),
      }
    }

    // Check if user is active
    if (!(profile as any)?.is_active) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Account is deactivated' },
          { status: 403 }
        ),
      }
    }

    const authenticatedUser: AuthenticatedUser = {
      id: (profile as any)?.id,
      email: (profile as any)?.email,
      name: (profile as any)?.name,
      role: (profile as any)?.role,
      isActive: (profile as any)?.is_active,
    }

    // Check role-based access
    if (options.requiredRole && !hasRole(authenticatedUser.role, options.requiredRole)) {
      return {
        user: authenticatedUser,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      }
    }

    if (options.requiredRoles && !options.requiredRoles.includes(authenticatedUser.role)) {
      return {
        user: authenticatedUser,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      }
    }

    // Check project access if required
    if (options.checkProjectAccess) {
      const projectId = getProjectIdFromRequest(request)
      if (projectId && !(await hasProjectAccess(authenticatedUser.id, projectId))) {
        return {
          user: authenticatedUser,
          error: NextResponse.json(
            { error: 'Project access denied' },
            { status: 403 }
          ),
        }
      }
    }

    return { user: authenticatedUser }
  } catch (error) {
    console.error('RBAC error:', error)
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    }
  }
}

// Check if user has required role
export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, Role[]> = {
    PROJECT_MANAGER: ['PROJECT_MANAGER', 'INSPECTOR'],
    EXECUTIVE: ['EXECUTIVE'],
    INSPECTOR: ['INSPECTOR'],
  }

  return roleHierarchy[userRole]?.includes(requiredRole) || false
}

// Check if user has access to specific project
export async function hasProjectAccess(
  userId: string,
  projectId: string
): Promise<boolean> {
  const supabaseServer = createSupabaseServerClient()
  
  const { data: membership, error } = await supabaseServer
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  return !error && !!membership
}

// Permission checking class for specific actions
export class SupabasePermissionChecker {
  constructor(private user: AuthenticatedUser) {}

  // Inspection permissions
  canCreateInspection(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  canViewInspection(inspectionAssigneeId?: string): boolean {
    // Project managers can view all inspections in their projects (handled by RLS)
    if (hasRole(this.user.role, 'PROJECT_MANAGER')) {
      return true
    }

    // Inspectors can view their own inspections
    if (
      this.user.role === 'INSPECTOR' &&
      inspectionAssigneeId === this.user.id
    ) {
      return true
    }

    // Executives can view all inspections (handled by RLS)
    return this.user.role === 'EXECUTIVE'
  }

  canEditInspection(
    inspectionAssigneeId: string,
    inspectionStatus: string
  ): boolean {
    // Only inspectors can edit their own draft/pending inspections
    return (
      this.user.role === 'INSPECTOR' &&
      inspectionAssigneeId === this.user.id &&
      ['DRAFT', 'PENDING'].includes(inspectionStatus)
    )
  }

  canApproveInspection(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  // Evidence permissions
  canUploadEvidence(inspectionAssigneeId: string): boolean {
    // Only the assigned inspector can upload evidence
    return (
      this.user.role === 'INSPECTOR' && 
      inspectionAssigneeId === this.user.id
    )
  }

  canViewEvidence(): boolean {
    // All roles can view evidence (access controlled by RLS)
    return true
  }

  canVerifyEvidence(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  // Project permissions
  canCreateProject(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  canManageProject(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  canViewProject(): boolean {
    // All roles can view projects they're members of (handled by RLS)
    return true
  }

  // User management permissions
  canInviteUsers(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  canManageUsers(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  // Report permissions
  canGenerateReports(): boolean {
    return (
      hasRole(this.user.role, 'PROJECT_MANAGER') ||
      this.user.role === 'EXECUTIVE'
    )
  }

  canViewReports(): boolean {
    // All roles can view reports (access controlled by RLS)
    return true
  }

  // Notification permissions
  canManageNotifications(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  // Real-time subscription permissions
  canSubscribeToProject(projectId: string): boolean {
    // This would need to be checked against project membership
    // For now, assume it's handled by RLS
    return true
  }

  canSubscribeToInspections(projectId: string): boolean {
    // Project-level subscription permissions
    return true
  }

  canSubscribeToNotifications(): boolean {
    // Users can always subscribe to their own notifications
    return true
  }
}

// Helper functions
function getProjectIdFromRequest(request: NextRequest): string | null {
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

// Higher-order function for API route protection
export function withSupabaseRBAC(options: RBACOptions = {}) {
  return function <T extends (...args: any[]) => any>(handler: T) {
    return async function (request: NextRequest, ...args: any[]) {
      const { user, error } = await withSupabaseAuth(request, options)

      if (error) {
        return error
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Add user and permission checker to request context
      ;(request as any).user = user
      ;(request as any).permissions = new SupabasePermissionChecker(user)

      return handler(request, ...args)
    }
  }
}

// Audit trail helper for Supabase
export async function logAuditEvent(
  entityType: string,
  entityId: string,
  action: string,
  userId: string,
  metadata: any = {},
  ipAddress?: string,
  userAgent?: string
) {
  const supabaseServer = createSupabaseServerClient()
  
  try {
    await supabaseServer
      .from('audit_logs')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        user_id: userId,
        metadata: {
          ...metadata,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString(),
        },
      } as any)
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging shouldn't break the main flow
  }
}

// Escalation helper for inspection workflow
export async function checkInspectionEscalation(inspectionId: string): Promise<boolean> {
  const supabaseServer = createSupabaseServerClient()
  
  try {
    // Get rejection count for the inspection
    const { data: inspection, error } = await supabaseServer
      .from('inspections')
      .select('rejection_count, project_id')
      .eq('id', inspectionId)
      .single()

    if (error || !inspection) {
      console.error('Failed to check escalation:', error)
      return false
    }

    // Check if escalation is needed (2 rejections per FR-020)
    if ((inspection as any)?.rejection_count >= 2) {
      // Create escalation notification
      const { data: projectManagers } = await supabaseServer
        .from('project_members')
        .select('user_id, profiles!inner(name, email)')
        .eq('project_id', (inspection as any)?.project_id)
        .eq('role', 'PROJECT_MANAGER')

      if (projectManagers && projectManagers.length > 0) {
        // Create notifications for all project managers
        const notifications = projectManagers.map(pm => ({
          user_id: (pm as any)?.user_id,
          type: 'ESCALATION' as const,
          title: 'Inspection Escalated',
          message: `Inspection has been rejected 2 times and requires manual reassignment`,
          related_entity_type: 'INSPECTION' as const,
          related_entity_id: inspectionId,
          priority: 'HIGH' as const,
        }))

        await supabaseServer
          .from('notifications')
          .insert(notifications as any)

        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking escalation:', error)
    return false
  }
}

// Export individual permission functions for backward compatibility
export const canUploadEvidence = (user: AuthenticatedUser, inspectionAssigneeId: string): boolean => {
  return new SupabasePermissionChecker(user).canUploadEvidence(inspectionAssigneeId)
}

export const canViewInspection = (user: AuthenticatedUser, inspectionAssigneeId?: string): boolean => {
  return new SupabasePermissionChecker(user).canViewInspection(inspectionAssigneeId)
}

export const canEditInspection = (user: AuthenticatedUser, inspectionAssigneeId: string, inspectionStatus: string): boolean => {
  return new SupabasePermissionChecker(user).canEditInspection(inspectionAssigneeId, inspectionStatus)
}

export const canGenerateReports = (user: AuthenticatedUser): boolean => {
  return new SupabasePermissionChecker(user).canGenerateReports()
}