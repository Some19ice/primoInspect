import { z } from 'zod'

export const ChecklistQuestionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'file']),
  question: z.string().min(1, 'Question is required'),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
})

export const ChecklistSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z
    .string()
    .min(1, 'Checklist name is required')
    .max(100, 'Name too long'),
  description: z.string().optional(),
  version: z.string().default('1.0'),
  isActive: z.boolean().default(true),
  questions: z
    .array(ChecklistQuestionSchema)
    .min(1, 'At least one question is required'),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
})

export const CreateChecklistSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: z
    .string()
    .min(1, 'Checklist name is required')
    .max(100, 'Name too long'),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        type: z.enum([
          'text',
          'number',
          'boolean',
          'select',
          'multiselect',
          'file',
        ]),
        question: z.string().min(1, 'Question is required'),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
        validation: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
            pattern: z.string().optional(),
          })
          .optional(),
      })
    )
    .min(1, 'At least one question is required'),
})

export const UpdateChecklistSchema = CreateChecklistSchema.partial().extend({
  isActive: z.boolean().optional(),
  version: z.string().optional(),
})

// Mobile-optimized checklist response schema
export const ChecklistResponseSchema = z.object({
  questionId: z.string().uuid(),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'file']),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.literal('N/A'), // Not Applicable option for boolean questions
    z.null(),
  ]),
  evidence: z.array(z.string().uuid()).optional(), // Evidence IDs for file questions
})

export const ChecklistSubmissionSchema = z.object({
  checklistId: z.string().uuid('Invalid checklist ID'),
  responses: z.array(ChecklistResponseSchema),
})

// Validation for checklist completeness
export const ChecklistCompletionSchema = z
  .object({
    checklistId: z.string().uuid(),
    responses: z.record(z.unknown()),
    requiredQuestions: z.array(z.string().uuid()),
  })
  .refine(
    data => {
      const responseKeys = Object.keys(data.responses)
      return data.requiredQuestions.every(
        questionId =>
          responseKeys.includes(questionId) &&
          data.responses[questionId] !== null &&
          data.responses[questionId] !== undefined &&
          data.responses[questionId] !== ''
      )
    },
    {
      message: 'All required questions must be answered',
      path: ['responses'],
    }
  )

export type ChecklistQuestion = z.infer<typeof ChecklistQuestionSchema>
export type Checklist = z.infer<typeof ChecklistSchema>
export type CreateChecklist = z.infer<typeof CreateChecklistSchema>
export type UpdateChecklist = z.infer<typeof UpdateChecklistSchema>
export type ChecklistResponse = z.infer<typeof ChecklistResponseSchema>
export type ChecklistSubmission = z.infer<typeof ChecklistSubmissionSchema>
export type ChecklistCompletion = z.infer<typeof ChecklistCompletionSchema>
