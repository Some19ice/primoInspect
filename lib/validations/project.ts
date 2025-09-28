import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long'),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'on-hold', 'cancelled']),
  startDate: z.date(),
  endDate: z.date().optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  teamMembers: z
    .array(z.string().uuid())
    .max(10, 'Maximum 10 team members per project'),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
})

export const CreateProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(100, 'Project name too long'),
    description: z.string().optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    location: z.object({
      latitude: z
        .number()
        .min(-90, 'Invalid latitude')
        .max(90, 'Invalid latitude'),
      longitude: z
        .number()
        .min(-180, 'Invalid longitude')
        .max(180, 'Invalid longitude'),
      address: z.string().optional(),
    }),
  })
  .refine(data => !data.endDate || data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export const UpdateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name too long')
    .optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  location: z.object({
    latitude: z
      .number()
      .min(-90, 'Invalid latitude')
      .max(90, 'Invalid latitude'),
    longitude: z
      .number()
      .min(-180, 'Invalid longitude')
      .max(180, 'Invalid longitude'),
    address: z.string().optional(),
  }).optional(),
})

export type Project = z.infer<typeof ProjectSchema>
export type CreateProject = z.infer<typeof CreateProjectSchema>
export type UpdateProject = z.infer<typeof UpdateProjectSchema>
