import { z } from 'zod'

export const EvidenceSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  uploadedBy: z.string().uuid(),
  filename: z.string().min(1, 'Filename is required'),
  originalName: z.string(),
  mimeType: z
    .string()
    .regex(/^(image|video)\//, 'Only images and videos are allowed'),
  fileSize: z
    .number()
    .max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
  timestamp: z.date(),
  verified: z.boolean().default(false),
  annotations: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        text: z.string(),
      })
    )
    .optional(),
  metadata: z
    .object({
      exif: z.record(z.unknown()).optional(),
      duration: z.number().optional(), // For videos
      dimensions: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional(),
    })
    .optional(),
  createdAt: z.date(),
})

export const CreateEvidenceSchema = z.object({
  inspectionId: z.string().uuid('Invalid inspection ID'),
  filename: z.string().min(1, 'Filename is required'),
  originalName: z.string(),
  mimeType: z
    .string()
    .regex(
      /^(image\/(jpeg|jpg|png|webp|gif)|video\/(mp4|mov|avi|webm))$/,
      'Unsupported file type. Only JPEG, PNG, WebP, GIF, MP4, MOV, AVI, WebM are allowed'
    ),
  fileSize: z
    .number()
    .max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().min(0).optional(),
    })
    .optional(),
  annotations: z
    .array(
      z.object({
        x: z.number().min(0).max(1), // Normalized coordinates
        y: z.number().min(0).max(1),
        text: z.string().min(1, 'Annotation text is required'),
      })
    )
    .optional(),
  metadata: z
    .object({
      exif: z.record(z.unknown()).optional(),
      duration: z.number().min(0).optional(),
      dimensions: z
        .object({
          width: z.number().min(1),
          height: z.number().min(1),
        })
        .optional(),
    })
    .optional(),
})

export const UpdateEvidenceSchema = z.object({
  annotations: z
    .array(
      z.object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        text: z.string().min(1),
      })
    )
    .optional(),
  verified: z.boolean().optional(),
})

// Mobile upload progress tracking
export const EvidenceUploadProgressSchema = z.object({
  evidenceId: z.string().uuid(),
  progress: z.number().min(0).max(100),
  status: z.enum(['uploading', 'processing', 'completed', 'error']),
  error: z.string().optional(),
})

// Validation for total inspection evidence size (1GB limit)
export const InspectionEvidenceSizeSchema = z
  .object({
    inspectionId: z.string().uuid(),
    currentTotalSize: z.number(),
    newFileSize: z.number(),
  })
  .refine(
    data => data.currentTotalSize + data.newFileSize <= 1024 * 1024 * 1024,
    {
      message: 'Total evidence size per inspection cannot exceed 1GB',
      path: ['newFileSize'],
    }
  )

export type Evidence = z.infer<typeof EvidenceSchema>
export type CreateEvidence = z.infer<typeof CreateEvidenceSchema>
export type UpdateEvidence = z.infer<typeof UpdateEvidenceSchema>
export type EvidenceUploadProgress = z.infer<
  typeof EvidenceUploadProgressSchema
>
export type InspectionEvidenceSize = z.infer<
  typeof InspectionEvidenceSizeSchema
>
