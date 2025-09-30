import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR']),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
  projectIds: z.array(z.string().uuid()),
  permissions: z.object({
    canCreateProjects: z.boolean().default(false),
    canApproveInspections: z.boolean().default(false),
    canViewReports: z.boolean().default(true),
    canManageTeam: z.boolean().default(false),
  }),
  createdAt: z.date(),
  lastLoginAt: z.date().optional(),
})

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR']),
  avatar: z.string().url().optional(),
})

export const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export const UserInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR']),
  projectId: z.string().uuid('Invalid project ID'),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Role-based permission validation
export const PermissionSchema = z.object({
  userRole: z.enum(['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR']),
  requiredRole: z.enum(['EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR']),
  action: z.string(),
})

// Mobile-optimized user profile
export const UserProfileSchema = UserSchema.pick({
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  isActive: true,
})

export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type UserInvitation = z.infer<typeof UserInvitationSchema>
export type Login = z.infer<typeof LoginSchema>
export type ChangePassword = z.infer<typeof ChangePasswordSchema>
export type Permission = z.infer<typeof PermissionSchema>
export type UserProfile = z.infer<typeof UserProfileSchema>
