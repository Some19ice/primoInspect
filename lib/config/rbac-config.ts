/**
 * RBAC Configuration for PrimoInspect
 * Centralized configuration for all role-based access control settings
 */

import { Database } from '@/lib/supabase/types'

export type Role = Database['public']['Tables']['profiles']['Row']['role']
export type InspectionStatus = NonNullable<Database['public']['Tables']['inspections']['Row']['status']>
export type NotificationType = Database['public']['Tables']['notifications']['Row']['type']

// ===== ROLE DEFINITIONS =====

export const ROLES = {
  EXECUTIVE: 'EXECUTIVE' as const,
  PROJECT_MANAGER: 'PROJECT_MANAGER' as const,
  INSPECTOR: 'INSPECTOR' as const,
} as const

export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  EXECUTIVE: ['EXECUTIVE'],
  PROJECT_MANAGER: ['PROJECT_MANAGER', 'INSPECTOR'],
  INSPECTOR: ['INSPECTOR'],
}

export const ROLE_PERMISSIONS = {
  [ROLES.EXECUTIVE]: {
    // System-wide access
    canViewAllProjects: true,
    canViewAllInspections: true,
    canViewAllReports: true,
    canViewSystemMetrics: true,
    canManageSystem: true,
    canViewAuditLogs: true,
    canSendBroadcastNotifications: true,
    
    // Limited operational permissions
    canCreateProjects: false,
    canManageProjects: false,
    canApproveInspections: false,
    canCreateInspections: false,
    canAssignRoles: true,
  },
  
  [ROLES.PROJECT_MANAGER]: {
    // Project management
    canCreateProjects: true,
    canManageProjects: true,
    canArchiveProjects: true,
    canInviteUsers: true,
    canManageUsers: true,
    canDeactivateUsers: true,
    
    // Inspection management
    canCreateInspections: true,
    canApproveInspections: true,
    canRejectInspections: true,
    canEscalateInspections: true,
    canResolveEscalations: true,
    canVerifyEvidence: true,
    
    // Reporting and notifications
    canGenerateReports: true,
    canExportReports: true,
    canManageNotifications: true,
    
    // Checklist management
    canCreateChecklists: true,
    canEditChecklists: true,
    canArchiveChecklists: true,
    
    // Limited system access
    canViewProjectAuditLogs: true,
    canAssignInspectorRole: true,
  },
  
  [ROLES.INSPECTOR]: {
    // Inspection operations
    canViewAssignedInspections: true,
    canEditAssignedInspections: true,
    canSubmitInspections: true,
    canUploadEvidence: true,
    canViewEvidence: true,
    canDeleteOwnEvidence: true,
    
    // Limited reporting
    canViewReports: true,
    
    // Own profile management
    canUpdateOwnProfile: true,
    canViewOwnNotifications: true,
    canSubscribeToNotifications: true,
    
    // No administrative permissions
    canCreateProjects: false,
    canManageUsers: false,
    canApproveInspections: false,
    canManageSystem: false,
  },
} as const

// ===== INSPECTION WORKFLOW CONFIGURATION =====

export const INSPECTION_STATUS_TRANSITIONS: Record<InspectionStatus, {
  allowedNext: InspectionStatus[]
  requiredRoles: Role[]
  conditions?: string[]
}> = {
  DRAFT: {
    allowedNext: ['PENDING'],
    requiredRoles: ['INSPECTOR'],
    conditions: ['Must be assigned inspector', 'All required fields completed'],
  },
  PENDING: {
    allowedNext: ['APPROVED', 'REJECTED', 'IN_REVIEW'],
    requiredRoles: ['PROJECT_MANAGER'],
    conditions: ['Evidence must be provided'],
  },
  IN_REVIEW: {
    allowedNext: ['APPROVED', 'REJECTED', 'PENDING'],
    requiredRoles: ['PROJECT_MANAGER'],
    conditions: ['Review notes required for rejection'],
  },
  APPROVED: {
    allowedNext: [],
    requiredRoles: ['PROJECT_MANAGER'],
    conditions: ['Final status - no further transitions'],
  },
  REJECTED: {
    allowedNext: ['PENDING'],
    requiredRoles: ['INSPECTOR'],
    conditions: ['Only assigned inspector can resubmit', 'Max 2 rejections before escalation'],
  },
}

export const ESCALATION_RULES = {
  MAX_REJECTIONS: 2,
  ESCALATION_TIMEOUT_HOURS: 24,
  AUTO_ESCALATE_PRIORITY: ['HIGH'] as const,
  ESCALATION_NOTIFICATION_ROLES: ['PROJECT_MANAGER', 'EXECUTIVE'] as const,
}

// ===== FILE STORAGE CONFIGURATION =====

export const STORAGE_CONFIG = {
  EVIDENCE_BUCKET: 'evidence-files',
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
  ],
  SIGNED_URL_EXPIRATION_MINUTES: 60,
  FILE_PATH_PATTERN: 'evidence/{inspection_id}/{user_id}/{timestamp}_{filename}',
}

// ===== NOTIFICATION CONFIGURATION =====

export const NOTIFICATION_CONFIG = {
  PRIORITY_MAPPING: {
    LOW: ['ASSIGNMENT'] as NotificationType[],
    MEDIUM: ['STATUS_CHANGE', 'REPORT_READY'] as NotificationType[],
    HIGH: ['APPROVAL_REQUIRED', 'ESCALATION'] as NotificationType[],
  },
  
  DELIVERY_CHANNELS: {
    IN_APP: ['ASSIGNMENT', 'STATUS_CHANGE', 'APPROVAL_REQUIRED', 'ESCALATION', 'REPORT_READY'],
    EMAIL: ['ESCALATION', 'APPROVAL_REQUIRED'],
    PUSH: ['ESCALATION'],
  } as Record<string, NotificationType[]>,
  
  AUTO_MARK_READ_AFTER_DAYS: 30,
  MAX_NOTIFICATIONS_PER_USER: 1000,
}

// ===== AUDIT CONFIGURATION =====

export const AUDIT_CONFIG = {
  RETENTION_DAYS: 2555, // 7 years for compliance
  LOG_LEVELS: {
    SYSTEM: ['USER_ROLE', 'SYSTEM_CONFIG'],
    SECURITY: ['LOGIN', 'LOGOUT', 'PERMISSION_DENIED', 'UNAUTHORIZED_ACCESS'],
    BUSINESS: ['INSPECTION', 'PROJECT', 'EVIDENCE', 'APPROVAL'],
    API: ['API_ACCESS', 'API_ERROR'],
  },
  
  SENSITIVE_FIELDS: [
    'password',
    'email',
    'phone',
    'personal_info',
  ],
  
  REQUIRE_AUDIT_FOR_ROLES: ['EXECUTIVE', 'PROJECT_MANAGER'] as Role[],
}

// ===== SECURITY CONFIGURATION =====

export const SECURITY_CONFIG = {
  SESSION_TIMEOUT_MINUTES: 480, // 8 hours
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  
  RATE_LIMITING: {
    API_REQUESTS_PER_MINUTE: 100,
    FILE_UPLOADS_PER_HOUR: 50,
    AUTHENTICATION_ATTEMPTS_PER_HOUR: 10,
  },
  
  ALLOWED_DOMAINS: process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [],
}

// ===== VALIDATION HELPERS =====

export function hasRoleAccess(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole]?.includes(requiredRole) || false
}

export function canTransitionInspectionStatus(
  userRole: Role, 
  fromStatus: InspectionStatus, 
  toStatus: InspectionStatus
): boolean {
  const transition = INSPECTION_STATUS_TRANSITIONS[fromStatus]
  return (
    transition?.allowedNext.includes(toStatus) &&
    transition?.requiredRoles.includes(userRole)
  ) || false
}

export function getRolePermissions(role: Role) {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]
}

export function isFileTypeAllowed(mimeType: string): boolean {
  return STORAGE_CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)
}

export function isFileSizeAllowed(sizeBytes: number): boolean {
  return sizeBytes <= STORAGE_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024
}

export function getNotificationPriority(type: NotificationType): 'LOW' | 'MEDIUM' | 'HIGH' {
  for (const [priority, types] of Object.entries(NOTIFICATION_CONFIG.PRIORITY_MAPPING)) {
    if (types.includes(type)) {
      return priority as 'LOW' | 'MEDIUM' | 'HIGH'
    }
  }
  return 'MEDIUM'
}

export function shouldEscalateInspection(rejectionCount: number, priority?: string): boolean {
  return (
    rejectionCount >= ESCALATION_RULES.MAX_REJECTIONS ||
    Boolean(priority && ESCALATION_RULES.AUTO_ESCALATE_PRIORITY.includes(priority as any))
  )
}

// ===== ROUTE PROTECTION CONFIGURATION =====

export const PROTECTED_ROUTES = {
  AUTHENTICATION_REQUIRED: [
    '/dashboard',
    '/api/projects',
    '/api/inspections', 
    '/api/evidence',
    '/api/reports',
    '/api/users/me',
    '/api/audit',
    '/api/escalations',
    '/api/checklists',
  ],
  
  ROLE_SPECIFIC: {
    '/dashboard/executive': ['EXECUTIVE'],
    '/dashboard/manager': ['PROJECT_MANAGER'],
    '/dashboard/inspector': ['INSPECTOR'],
    '/api/projects': ['PROJECT_MANAGER', 'EXECUTIVE'],
    '/api/users': ['PROJECT_MANAGER', 'EXECUTIVE'],
    '/api/audit': ['PROJECT_MANAGER', 'EXECUTIVE'],
    '/api/system': ['EXECUTIVE'],
  } as Record<string, Role[]>,
  
  PUBLIC_ROUTES: [
    '/',
    '/auth/signin',
    '/auth/signup', 
    '/auth/reset-password',
    '/api/health',
  ],
}

// Export default configuration object
export const RBAC_CONFIG = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  INSPECTION_STATUS_TRANSITIONS,
  ESCALATION_RULES,
  STORAGE_CONFIG,
  NOTIFICATION_CONFIG,
  AUDIT_CONFIG,
  SECURITY_CONFIG,
  PROTECTED_ROUTES,
} as const

export default RBAC_CONFIG