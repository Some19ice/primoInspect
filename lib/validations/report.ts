import { z } from 'zod'

export const ReportSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  type: z.enum(['compliance', 'summary', 'progress', 'custom']),
  status: z.enum(['generating', 'ready', 'error']),
  format: z.enum(['pdf', 'excel', 'csv']),
  url: z.string().url().optional(),
  filters: z.object({
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    inspectionStatus: z.array(z.string()).optional(),
    assignedTo: z.array(z.string().uuid()).optional(),
  }),
  generatedBy: z.string().uuid(),
  generatedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
})

export const CreateReportSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  type: z.enum(['compliance', 'summary', 'progress', 'custom']),
  format: z.enum(['pdf', 'excel', 'csv']),
  templateId: z.string().uuid().optional(),
  filters: z.object({
    dateRange: z
      .object({
        start: z.date(),
        end: z.date(),
      })
      .refine(data => data.end >= data.start, {
        message: 'End date must be after or equal to start date',
        path: ['end'],
      }),
    inspectionStatus: z
      .array(z.enum(['draft', 'pending', 'in-review', 'approved', 'rejected']))
      .optional(),
    assignedTo: z.array(z.string().uuid()).optional(),
  }),
})

export const UpdateReportSchema = z.object({
  status: z.enum(['generating', 'ready', 'error']).optional(),
  url: z.string().url().optional(),
  generatedAt: z.date().optional(),
  expiresAt: z.date().optional(),
})

// Report template schema
export const ReportTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Template name is required'),
  type: z.enum(['compliance', 'summary', 'progress', 'custom']),
  format: z.enum(['pdf', 'excel', 'csv']),
  defaultFilters: z.object({
    inspectionStatus: z.array(z.string()).optional(),
    dateRangeDays: z.number().min(1).optional(), // Last N days
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
})

// Mobile-optimized report list query
export const ReportQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  type: z.enum(['compliance', 'summary', 'progress', 'custom']).optional(),
  status: z.enum(['generating', 'ready', 'error']).optional(),
  generatedBy: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

// Report generation progress tracking
export const ReportProgressSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['generating', 'ready', 'error']),
  progress: z.number().min(0).max(100),
  message: z.string().optional(),
  error: z.string().optional(),
  estimatedTimeRemaining: z.number().optional(), // seconds
})

// Pre-built report types with validation
export const ComplianceReportSchema = CreateReportSchema.extend({
  type: z.literal('compliance'),
  filters: z.object({
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    inspectionStatus: z
      .array(z.enum(['approved', 'rejected']))
      .default(['approved', 'rejected']),
    assignedTo: z.array(z.string().uuid()).optional(),
  }),
})

export const SummaryReportSchema = CreateReportSchema.extend({
  type: z.literal('summary'),
  filters: z.object({
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    inspectionStatus: z.array(z.string()).optional(),
    assignedTo: z.array(z.string().uuid()).optional(),
  }),
})

export const ProgressReportSchema = CreateReportSchema.extend({
  type: z.literal('progress'),
  filters: z.object({
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    assignedTo: z.array(z.string().uuid()).optional(),
  }),
})

export type Report = z.infer<typeof ReportSchema>
export type CreateReport = z.infer<typeof CreateReportSchema>
export type UpdateReport = z.infer<typeof UpdateReportSchema>
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>
export type ReportQuery = z.infer<typeof ReportQuerySchema>
export type ReportProgress = z.infer<typeof ReportProgressSchema>
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>
export type SummaryReport = z.infer<typeof SummaryReportSchema>
export type ProgressReport = z.infer<typeof ProgressReportSchema>
