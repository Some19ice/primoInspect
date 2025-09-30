import { AuthenticatedUser, hasRoleAccess } from './auth-service'

// Centralized permission checking class
export class PermissionChecker {
  constructor(private user: AuthenticatedUser) {}

  // Inspection permissions
  canCreateInspection(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canViewInspection(inspectionAssigneeId?: string): boolean {
    // Project managers can view all inspections in their projects (handled by RLS)
    if (hasRoleAccess(this.user.role, 'PROJECT_MANAGER')) {
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
      ['DRAFT', 'PENDING'].includes(inspectionStatus.toUpperCase())
    )
  }

  canApproveInspection(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canRejectInspection(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
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
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canDeleteEvidence(uploadedBy: string): boolean {
    // Users can delete their own evidence or project managers can delete any
    return (
      uploadedBy === this.user.id ||
      hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
    )
  }

  // Project permissions
  canCreateProject(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canManageProject(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canViewProject(): boolean {
    // All roles can view projects they're members of (handled by RLS)
    return true
  }

  canArchiveProject(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  // User management permissions
  canInviteUsers(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canManageUsers(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canChangeUserRole(targetRole: string): boolean {
    // Only project managers can assign inspector roles
    // Only executives can assign project manager roles
    if (targetRole === 'INSPECTOR') {
      return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
    }
    if (targetRole === 'PROJECT_MANAGER') {
      return this.user.role === 'EXECUTIVE'
    }
    if (targetRole === 'EXECUTIVE') {
      return false // Executive roles must be assigned at system level
    }
    return false
  }

  canDeactivateUser(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  // Report permissions
  canGenerateReports(): boolean {
    return (
      hasRoleAccess(this.user.role, 'PROJECT_MANAGER') ||
      this.user.role === 'EXECUTIVE'
    )
  }

  canViewReports(): boolean {
    // All roles can view reports (access controlled by RLS)
    return true
  }

  canExportReports(): boolean {
    return (
      hasRoleAccess(this.user.role, 'PROJECT_MANAGER') ||
      this.user.role === 'EXECUTIVE'
    )
  }

  // Notification permissions
  canManageNotifications(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canSendBroadcastNotifications(): boolean {
    return this.user.role === 'EXECUTIVE'
  }

  // Audit permissions
  canViewAuditLogs(entityType?: string, entityId?: string): boolean {
    // Executives can view all audit logs
    if (this.user.role === 'EXECUTIVE') {
      return true
    }

    // Project managers can view audit logs for their projects
    if (hasRoleAccess(this.user.role, 'PROJECT_MANAGER')) {
      return true // RLS will filter appropriately
    }

    // Inspectors can view audit logs for their own inspections
    if (this.user.role === 'INSPECTOR' && entityType === 'INSPECTION') {
      return true // RLS will check if they're assigned to the inspection
    }

    return false
  }

  // System administration permissions
  canManageSystem(): boolean {
    return this.user.role === 'EXECUTIVE'
  }

  canViewSystemMetrics(): boolean {
    return this.user.role === 'EXECUTIVE'
  }

  // Real-time subscription permissions
  canSubscribeToProject(projectId: string): boolean {
    // Project membership is checked separately
    return true
  }

  canSubscribeToInspections(projectId: string): boolean {
    // Project membership is checked separately
    return true
  }

  canSubscribeToNotifications(): boolean {
    // Users can always subscribe to their own notifications
    return true
  }

  // Escalation permissions
  canEscalateInspection(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canResolveEscalation(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  // Checklist permissions
  canCreateChecklist(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canEditChecklist(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }

  canArchiveChecklist(): boolean {
    return hasRoleAccess(this.user.role, 'PROJECT_MANAGER')
  }
}

// Individual permission functions for backward compatibility
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

export const canApproveInspection = (user: AuthenticatedUser): boolean => {
  return new PermissionChecker(user).canApproveInspection()
}