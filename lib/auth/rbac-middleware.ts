import { NextRequest, NextResponse } from 'next/server'
import { AuthService, AuthenticatedUser, getProjectIdFromRequest, logAuditEvent } from './auth-service'
import { PermissionChecker } from './permissions'
import { Database } from '@/lib/supabase/types'

type Role = Database['public']['Tables']['profiles']['Row']['role']

export interface RBACOptions {
  requiredRole?: Role
  requiredRoles?: Role[]
  allowSameUser?: boolean
  checkProjectAccess?: boolean
  requireActiveAccount?: boolean
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser
  permissions: PermissionChecker
}

// Higher-order function for API route protection with standardized error handling
export function withRBAC(options: RBACOptions = {}) {
  return function <T extends (...args: any[]) => any>(handler: T) {
    return async function (request: NextRequest, ...args: any[]) {
      const authService = AuthService.getInstance()
      
      // Authenticate user
      const authResult = await authService.authenticate(request)
      
      if (authResult.error) {
        return authService.createErrorResponse(authResult.error)
      }

      const user = authResult.user!

      // Check role-based access
      if (options.requiredRole) {
        const { hasRoleAccess } = await import('./auth-service')
        if (!hasRoleAccess(user.role, options.requiredRole)) {
          return authService.createErrorResponse({
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Required role: ${options.requiredRole}`,
            statusCode: 403,
          })
        }
      }

      if (options.requiredRoles && !options.requiredRoles.includes(user.role)) {
        return authService.createErrorResponse({
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Required roles: ${options.requiredRoles.join(', ')}`,
          statusCode: 403,
        })
      }

      // Check project access if required
      if (options.checkProjectAccess) {
        const projectId = getProjectIdFromRequest(request)
        if (projectId) {
          const hasAccess = await authService.checkProjectAccess(user.id, projectId)
          if (!hasAccess) {
            return authService.createErrorResponse({
              code: 'PROJECT_ACCESS_DENIED',
              message: 'You do not have access to this project',
              statusCode: 403,
            })
          }
        }
      }

      // Add user and permission checker to request context
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user
      authenticatedRequest.permissions = new PermissionChecker(user)

      try {
        const response = await handler(authenticatedRequest, ...args)
        
        // Log successful API access for audit trail
        const method = request.method
        const path = new URL(request.url).pathname
        
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          await logAuditEvent(
            'API_ACCESS',
            path,
            method,
            user.id,
            {
              endpoint: path,
              method,
              userRole: user.role,
            },
            request
          )
        }

        return response
      } catch (error) {
        console.error('API handler error:', error)
        
        // Log failed API access
        await logAuditEvent(
          'API_ERROR',
          new URL(request.url).pathname,
          request.method,
          user.id,
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            userRole: user.role,
          },
          request
        )

        return NextResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Internal server error',
            },
          },
          { status: 500 }
        )
      }
    }
  }
}

// Specialized middleware functions for common use cases
export const requireProjectManager = () => withRBAC({ requiredRole: 'PROJECT_MANAGER' })
export const requireExecutive = () => withRBAC({ requiredRole: 'EXECUTIVE' })
export const requireInspector = () => withRBAC({ requiredRole: 'INSPECTOR' })

export const requireProjectAccess = (options: Omit<RBACOptions, 'checkProjectAccess'> = {}) =>
  withRBAC({ ...options, checkProjectAccess: true })

export const requireManagerOrExecutive = () =>
  withRBAC({ requiredRoles: ['PROJECT_MANAGER', 'EXECUTIVE'] })

// Utility function to check if user can access specific resource
export async function canAccessResource(
  request: NextRequest,
  resourceType: 'inspection' | 'project' | 'evidence',
  resourceId: string,
  requiredAction?: string
): Promise<{ allowed: boolean; user?: AuthenticatedUser; error?: any }> {
  const authService = AuthService.getInstance()
  const authResult = await authService.authenticate(request)
  
  if (authResult.error) {
    return { allowed: false, error: authResult.error }
  }

  const user = authResult.user!
  const permissions = new PermissionChecker(user)

  // Check resource-specific permissions
  switch (resourceType) {
    case 'inspection':
      if (requiredAction === 'edit') {
        // Would need to fetch inspection details to check assignee and status
        // For now, return true and let RLS handle it
        return { allowed: true, user }
      }
      if (requiredAction === 'approve') {
        return { allowed: permissions.canApproveInspection(), user }
      }
      return { allowed: permissions.canViewInspection(), user }
      
    case 'project':
      if (requiredAction === 'manage') {
        return { allowed: permissions.canManageProject(), user }
      }
      // Check project membership
      const hasAccess = await authService.checkProjectAccess(user.id, resourceId)
      return { allowed: hasAccess, user }
      
    case 'evidence':
      if (requiredAction === 'upload') {
        // Would need inspection assignee info
        return { allowed: user.role === 'INSPECTOR', user }
      }
      return { allowed: permissions.canViewEvidence(), user }
      
    default:
      return { allowed: false, error: { message: 'Unknown resource type' } }
  }
}

// Helper for checking multiple permissions at once
export function checkPermissions(
  user: AuthenticatedUser,
  checks: Array<{
    action: keyof PermissionChecker
    args?: any[]
  }>
): Record<string, boolean> {
  const permissions = new PermissionChecker(user)
  const results: Record<string, boolean> = {}

  for (const check of checks) {
    const method = permissions[check.action] as Function
    if (typeof method === 'function') {
      results[check.action] = method.apply(permissions, check.args || [])
    } else {
      results[check.action] = false
    }
  }

  return results
}