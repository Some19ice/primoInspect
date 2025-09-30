import { z } from 'zod'

export const CreateInspectionSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  checklistId: z.string().uuid('Invalid checklist ID'),
  assignedTo: z.string().uuid('Invalid user ID').optional(),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
})

export const InspectionFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  projectId: z.string().uuid().optional(),
  status: z.array(z.enum(['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'])).optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH'])).optional(),
  search: z.string().optional(),
  dueAfter: z.string().datetime().optional(),
  dueBefore: z.string().datetime().optional(),
  includeDrafts: z.boolean().default(false),
})

export type CreateInspectionRequest = z.infer<typeof CreateInspectionSchema>
export type InspectionFilter = z.infer<typeof InspectionFilterSchema>