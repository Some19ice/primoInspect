import { z } from 'zod'

export const InspectionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  checklistId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['draft', 'pending', 'in-review', 'approved', 'rejected']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.date().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
      address: z.string().optional(),
    })
    .optional(),
  responses: z.record(z.unknown()),
  rejectionCount: z
    .number()
    .min(0)
    .max(2, 'Maximum 2 rejections before escalation')
    .default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  submittedAt: z.date().optional(),
  completedAt: z.date().optional(),
})

export const CreateInspectionSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  checklistId: z.string().uuid('Invalid checklist ID'),
  assignedTo: z.string().uuid('Invalid assignee ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.date().optional(),
})

export const UpdateInspectionSchema = z.object({
  responses: z.record(z.unknown()).optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
  status: z.enum(['draft', 'pending']).optional(),
})

export const SubmitInspectionSchema = z.object({
  responses: z.record(z.unknown()),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }),
})

// Mobile-optimized pagination schema
export const InspectionListQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z
    .enum(['draft', 'pending', 'in-review', 'approved', 'rejected'])
    .optional(),
  assignedTo: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20), // Mobile-friendly pagination
})

// Alias for backward compatibility
export const InspectionFilterSchema = InspectionListQuerySchema

export type Inspection = z.infer<typeof InspectionSchema>
export type CreateInspection = z.infer<typeof CreateInspectionSchema>
export type UpdateInspection = z.infer<typeof UpdateInspectionSchema>
export type SubmitInspection = z.infer<typeof SubmitInspectionSchema>
export type InspectionListQuery = z.infer<typeof InspectionListQuerySchema>
