import { z } from 'zod'

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum([
    'project',
    'inspection',
    'evidence',
    'user',
    'approval',
    'report',
    'notification',
  ]),
  entityId: z.string().uuid(),
  action: z.enum([
    'created',
    'updated',
    'deleted',
    'submitted',
    'approved',
    'rejected',
    'escalated',
    'assigned',
    'uploaded',
    'verified',
    'generated',
    'exported',
    'invited',
    'login',
    'logout',
  ]),
  userId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

export const CreateAuditLogSchema = z.object({
  entityType: z.enum([
    'project',
    'inspection',
    'evidence',
    'user',
    'approval',
    'report',
    'notification',
  ]),
  entityId: z.string().uuid('Invalid entity ID'),
  action: z.enum([
    'created',
    'updated',
    'deleted',
    'submitted',
    'approved',
    'rejected',
    'escalated',
    'assigned',
    'uploaded',
    'verified',
    'generated',
    'exported',
    'invited',
    'login',
    'logout',
  ]),
  userId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

// Audit trail query for compliance reporting
export const AuditTrailQuerySchema = z.object({
  entityType: z
    .enum([
      'project',
      'inspection', 
      'evidence',
      'user',
      'approval',
      'report',
      'notification',
    ])
    .optional(),
  entityId: z.string().uuid().optional(),
  action: z
    .enum([
      'created',
      'updated',
      'deleted',
      'submitted',
      'approved',
      'rejected',
      'escalated',
      'assigned',
      'uploaded',
      'verified',
      'generated',
      'exported',
      'invited',
      'login',
      'logout',
    ])
    .optional(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['timestamp', 'action', 'entityType']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

// Inspection activity timeline for evidence-driven decisions
export const InspectionTimelineSchema = z.object({
  inspectionId: z.string().uuid(),
  events: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum([
        'created',
        'submitted',
        'approved',
        'rejected',
        'escalated',
        'evidence_uploaded',
      ]),
      description: z.string(),
      userId: z.string().uuid().optional(),
      userName: z.string().optional(),
      timestamp: z.date(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
})

// Compliance audit report schema
export const ComplianceAuditSchema = z.object({
  projectId: z.string().uuid(),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
  auditTrail: z.array(AuditLogSchema),
  summary: z.object({
    totalActions: z.number(),
    actionsByType: z.record(z.number()),
    userActivity: z.record(z.number()),
    criticalEvents: z.array(AuditLogSchema),
  }),
})

// Real-time audit logging for critical actions
export const CriticalActionAuditSchema = z.object({
  entityType: z.enum(['inspection', 'approval', 'evidence']),
  entityId: z.string().uuid(),
  action: z.enum(['approved', 'rejected', 'escalated', 'uploaded', 'verified']),
  userId: z.string().uuid(),
  timestamp: z.date(),
  metadata: z.object({
    previousState: z.record(z.unknown()).optional(),
    newState: z.record(z.unknown()).optional(),
    reason: z.string().optional(),
    evidenceCount: z.number().optional(),
    rejectionCount: z.number().optional(),
  }),
  requiresNotification: z.boolean().default(true),
})

export type AuditLog = z.infer<typeof AuditLogSchema>
export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>
export type AuditTrailQuery = z.infer<typeof AuditTrailQuerySchema>
export type InspectionTimeline = z.infer<typeof InspectionTimelineSchema>
export type ComplianceAudit = z.infer<typeof ComplianceAuditSchema>
export type CriticalActionAudit = z.infer<typeof CriticalActionAuditSchema>
