import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Define Role type locally since Prisma is removed
export type Role = 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface RBACOptions {
  requiredRole?: Role
  requiredRoles?: Role[]
  allowSameUser?: boolean
  checkProjectAccess?: boolean
}

// Main RBAC middleware function
export async function withAuth(
  request: NextRequest,
  options: RBACOptions = {}
): Promise<{ user: AuthenticatedUser; error?: NextResponse }> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return {
        user: null as any,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      }
    }

    const user = session.user as AuthenticatedUser

    // Check role-based access
    if (options.requiredRole && !hasRole(user.role, options.requiredRole)) {
      return {
        user,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      }
    }

    if (options.requiredRoles && !options.requiredRoles.includes(user.role)) {
      return {
        user,
        error: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      }
    }

    // Check project access if required
    if (options.checkProjectAccess) {
      const projectId = getProjectIdFromRequest(request)
      if (projectId && !(await hasProjectAccess(user.id, projectId))) {
        return {
          user,
          error: NextResponse.json(
            { error: 'Project access denied' },
            { status: 403 }
          ),
        }
      }
    }

    return { user }
  } catch (error) {
    console.error('RBAC error:', error)
    return {
      user: null as any,
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
  try {
    // Import here to avoid circular dependencies
    const { supabase } = await import('@/lib/supabase/client')
    
    const { data: membership, error } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    return !error && !!membership
  } catch (error) {
    console.error('Error checking project access:', error)
    return false
  }
}

// Permission checking functions for specific actions
export class PermissionChecker {
  constructor(private user: AuthenticatedUser) {}

  // Inspection permissions
  canCreateInspection(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
  }

  canViewInspection(inspectionAssigneeId?: string): boolean {
    // Project managers can view all inspections
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

    // Executives can view all inspections
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
      this.user.role === 'INSPECTOR' && inspectionAssigneeId === this.user.id
    )
  }

  canViewEvidence(): boolean {
    // All roles can view evidence
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
    // All roles can view projects they're members of
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
    // All roles can view reports
    return true
  }

  // Notification permissions
  canManageNotifications(): boolean {
    return hasRole(this.user.role, 'PROJECT_MANAGER')
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
export function withRBAC(options: RBACOptions = {}) {
  return function <T extends (...args: any[]) => any>(handler: T) {
    return async function (request: NextRequest, ...args: any[]) {
      const { user, error } = await withAuth(request, options)

      if (error) {
        return error
      }

      // Add user and permission checker to request context
      ;(request as any).user = user
      ;(request as any).permissions = new PermissionChecker(user)

      return handler(request, ...args)
    }
  }
}

// Export individual permission functions for backward compatibility
export const canUploadEvidence = (user: AuthenticatedUser, inspectionAssigneeId: string): boolean => {
  return new PermissionChecker(user).canUploadEvidence(inspectionAssigneeId)
}

export const canViewInspection = (user: AuthenticatedUser, inspectionAssigneeId?: string): boolean => {
  return new PermissionChecker(user).canViewInspection(inspectionAssigneeId)
}

export const canEditInspection = (user: AuthenticatedUser, inspectionAssigneeId: string, inspectionStatus: string): boolean => {
  return new PermissionChecker(user).canEditInspection(inspectionAssigneeId, inspectionStatus)
}

export const canGenerateReports = (user: AuthenticatedUser): boolean => {
  return new PermissionChecker(user).canGenerateReports()
}
