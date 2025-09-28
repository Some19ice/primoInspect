import { z } from 'zod'

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    'assignment',
    'status-change',
    'approval-required',
    'escalation',
    'report-ready',
  ]),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message too long'),
  relatedEntityType: z.enum(['inspection', 'project', 'approval', 'report']),
  relatedEntityId: z.string().uuid(),
  isRead: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  deliveryChannel: z.enum(['in-app', 'email', 'push']).default('in-app'),
  scheduledFor: z.date().optional(),
  deliveredAt: z.date().optional(),
  createdAt: z.date(),
})

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  type: z.enum([
    'assignment',
    'status-change',
    'approval-required',
    'escalation',
    'report-ready',
  ]),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message too long'),
  relatedEntityType: z.enum(['inspection', 'project', 'approval', 'report']),
  relatedEntityId: z.string().uuid('Invalid entity ID'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  deliveryChannel: z.enum(['in-app', 'email', 'push']).default('in-app'),
  scheduledFor: z.date().optional(),
})

export const BulkNotificationSchema = z.object({
  userIds: z
    .array(z.string().uuid())
    .min(1, 'At least one user ID is required'),
  type: z.enum([
    'assignment',
    'status-change',
    'approval-required',
    'escalation',
    'report-ready',
  ]),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message too long'),
  relatedEntityType: z.enum(['inspection', 'project', 'approval', 'report']),
  relatedEntityId: z.string().uuid('Invalid entity ID'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  deliveryChannel: z.enum(['in-app', 'email', 'push']).default('in-app'),
})

export const MarkNotificationsReadSchema = z.object({
  notificationIds: z
    .array(z.string().uuid())
    .min(1, 'At least one notification ID is required'),
})

// Mobile-optimized notification query
export const NotificationQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().default(false),
  type: z
    .enum([
      'assignment',
      'status-change',
      'approval-required',
      'escalation',
      'report-ready',
    ])
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

// Escalation notification template
export const EscalationNotificationSchema = z.object({
  inspectionId: z.string().uuid(),
  inspectionTitle: z.string(),
  projectName: z.string(),
  inspectorName: z.string(),
  rejectionCount: z.number().min(2), // Must be 2 or more to escalate
  projectManagerIds: z.array(z.string().uuid()),
})

// Real-time notification push schema
export const NotificationPushSchema = z.object({
  notificationId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    'assignment',
    'status-change',
    'approval-required',
    'escalation',
    'report-ready',
  ]),
  title: z.string(),
  message: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  timestamp: z.date(),
  actionUrl: z.string().optional(),
})

export type Notification = z.infer<typeof NotificationSchema>
export type CreateNotification = z.infer<typeof CreateNotificationSchema>
export type BulkNotification = z.infer<typeof BulkNotificationSchema>
export type MarkNotificationsRead = z.infer<typeof MarkNotificationsReadSchema>
export type NotificationQuery = z.infer<typeof NotificationQuerySchema>
export type EscalationNotification = z.infer<
  typeof EscalationNotificationSchema
>
export type NotificationPush = z.infer<typeof NotificationPushSchema>
