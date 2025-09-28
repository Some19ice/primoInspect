import { z } from 'zod'

export const ApprovalSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  approverId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().min(1, 'Notes are required for approval decisions'),
  reviewDate: z.date(),
  isEscalated: z.boolean().default(false),
  escalationReason: z.string().optional(),
  previousApprovalId: z.string().uuid().optional(),
  attachments: z.array(z.string().uuid()).optional(),
  createdAt: z.date(),
})

export const CreateApprovalSchema = z.object({
  inspectionId: z.string().uuid('Invalid inspection ID'),
  decision: z.enum(['approved', 'rejected'], {
    errorMap: () => ({
      message: 'Decision must be either approved or rejected',
    }),
  }),
  notes: z
    .string()
    .min(1, 'Notes are required for approval decisions')
    .max(1000, 'Notes too long'),
  attachments: z.array(z.string().uuid()).optional(),
})

export const EscalationApprovalSchema = z.object({
  inspectionId: z.string().uuid('Invalid inspection ID'),
  escalationReason: z.string().min(1, 'Escalation reason is required'),
  previousApprovalId: z.string().uuid('Invalid previous approval ID'),
  reassignTo: z.string().uuid('Invalid reassignment user ID'),
})

// Rejection escalation validation (after 2 rejections)
export const RejectionEscalationSchema = z
  .object({
    inspectionId: z.string().uuid(),
    currentRejectionCount: z.number(),
    newDecision: z.enum(['approved', 'rejected']),
  })
  .refine(
    data => {
      // If this would be the 3rd rejection, auto-escalate
      if (data.newDecision === 'rejected' && data.currentRejectionCount >= 2) {
        return false // This should trigger escalation workflow
      }
      return true
    },
    {
      message: 'Inspection must be escalated after 2 rejections',
      path: ['newDecision'],
    }
  )

// Mobile-optimized approval queue item
export const ApprovalQueueItemSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  inspectionTitle: z.string(),
  projectName: z.string(),
  assigneeName: z.string(),
  submittedAt: z.date(),
  priority: z.enum(['low', 'medium', 'high']),
  evidenceCount: z.number(),
  dueDate: z.date().optional(),
  rejectionCount: z.number(),
  isUrgent: z.boolean(),
})

// Approval workflow state validation
export const ApprovalWorkflowSchema = z
  .object({
    inspectionId: z.string().uuid(),
    currentStatus: z.enum([
      'draft',
      'pending',
      'in-review',
      'approved',
      'rejected',
    ]),
    targetStatus: z.enum(['in-review', 'approved', 'rejected']),
    approverId: z.string().uuid(),
    userRole: z.enum(['executive', 'project-manager', 'inspector']),
  })
  .refine(
    data => {
      // Only project managers can approve inspections
      if (
        data.targetStatus === 'approved' ||
        data.targetStatus === 'rejected'
      ) {
        return data.userRole === 'project-manager'
      }
      return true
    },
    {
      message: 'Only project managers can approve or reject inspections',
      path: ['userRole'],
    }
  )

export type Approval = z.infer<typeof ApprovalSchema>
export type CreateApproval = z.infer<typeof CreateApprovalSchema>
export type EscalationApproval = z.infer<typeof EscalationApprovalSchema>
export type RejectionEscalation = z.infer<typeof RejectionEscalationSchema>
export type ApprovalQueueItem = z.infer<typeof ApprovalQueueItemSchema>
export type ApprovalWorkflow = z.infer<typeof ApprovalWorkflowSchema>
