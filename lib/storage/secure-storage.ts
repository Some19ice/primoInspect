import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase/types'
import { AuthService } from '@/lib/auth/auth-service'
import { PermissionChecker } from '@/lib/auth/permissions'

interface EvidenceFile {
  id: string
  inspection_id: string
  uploaded_by: string
  filename: string
  url: string
  verified: boolean
}

interface FileAccessValidation {
  allowed: boolean
  reason?: string
  evidence?: EvidenceFile
}

export class SecureStorageService {
  private static instance: SecureStorageService
  
  private constructor() {}
  
  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService()
    }
    return SecureStorageService.instance
  }

  private createSupabaseServerClient() {
    const cookieStore = cookies()
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookies = await cookieStore
            return cookies.get(name)?.value
          },
        },
      }
    )
  }

  /**
   * Validate if user can access a specific evidence file
   * This replaces the insecure URL pattern-based access control
   */
  async validateFileAccess(
    userId: string,
    filePath: string
  ): Promise<FileAccessValidation> {
    try {
      const supabase = this.createSupabaseServerClient()
      
      // Extract evidence ID or inspection ID from file path
      const pathSegments = filePath.split('/')
      const inspectionId = pathSegments[1] // evidence/{inspection_id}/{user_id}/{filename}
      
      if (!inspectionId) {
        return {
          allowed: false,
          reason: 'Invalid file path format',
        }
      }

      // Get evidence record from database
      const { data: evidence, error } = await supabase
        .from('evidence')
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('url', filePath)
        .single()

      if (error || !evidence) {
        return {
          allowed: false,
          reason: 'Evidence file not found',
        }
      }

      // Get user's role and permissions
      const authService = AuthService.getInstance()
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) {
        return {
          allowed: false,
          reason: 'User profile not found',
        }
      }

      const user = {
        id: (profile as any)?.id,
        email: (profile as any)?.email,
        name: (profile as any)?.name,
        role: (profile as any)?.role,
        isActive: (profile as any)?.is_active,
      }

      const permissions = new PermissionChecker(user)

      // Check if user can view evidence
      if (!permissions.canViewEvidence()) {
        return {
          allowed: false,
          reason: 'Insufficient permissions to view evidence',
        }
      }

      // Check inspection-specific access
      const { data: inspection } = await supabase
        .from('inspections')
        .select('assigned_to, project_id')
        .eq('id', inspectionId)
        .single()

      if (!inspection) {
        return {
          allowed: false,
          reason: 'Associated inspection not found',
        }
      }

      // Check if user has access to the inspection
      const hasInspectionAccess = permissions.canViewInspection((inspection as any)?.assigned_to)
      
      if (!hasInspectionAccess) {
        // Additional check for project membership
        const hasProjectAccess = await authService.checkProjectAccess(userId, (inspection as any)?.project_id)
        
        if (!hasProjectAccess) {
          return {
            allowed: false,
            reason: 'No access to associated inspection or project',
          }
        }
      }

      return {
        allowed: true,
        evidence: evidence as EvidenceFile,
      }
    } catch (error) {
      console.error('Error validating file access:', error)
      return {
        allowed: false,
        reason: 'Internal error during access validation',
      }
    }
  }

  /**
   * Generate secure, time-limited download URL for evidence files
   */
  async generateSecureDownloadUrl(
    userId: string,
    filePath: string,
    expirationMinutes: number = 60
  ): Promise<{ url?: string; error?: string }> {
    const validation = await this.validateFileAccess(userId, filePath)
    
    if (!validation.allowed) {
      return {
        error: validation.reason || 'Access denied',
      }
    }

    try {
      const supabase = this.createSupabaseServerClient()
      
      // Generate signed URL with expiration
      const { data, error } = await supabase.storage
        .from('evidence-files')
        .createSignedUrl(filePath, expirationMinutes * 60)

      if (error) {
        console.error('Error generating signed URL:', error)
        return {
          error: 'Failed to generate download URL',
        }
      }

      return {
        url: data.signedUrl,
      }
    } catch (error) {
      console.error('Error generating secure download URL:', error)
      return {
        error: 'Internal error generating download URL',
      }
    }
  }

  /**
   * Validate and upload evidence file with proper security checks
   */
  async uploadEvidenceFile(
    userId: string,
    inspectionId: string,
    file: File,
    metadata: {
      latitude?: number
      longitude?: number
      accuracy?: number
      timestamp: Date
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const supabase = this.createSupabaseServerClient()
      
      // Validate user can upload evidence to this inspection
      const { data: inspection } = await supabase
        .from('inspections')
        .select('assigned_to, status, project_id')
        .eq('id', inspectionId)
        .single()

      if (!inspection) {
        return {
          success: false,
          error: 'Inspection not found',
        }
      }

      // Check if user is assigned to this inspection
      if ((inspection as any)?.assigned_to !== userId) {
        return {
          success: false,
          error: 'You can only upload evidence to your assigned inspections',
        }
      }

      // Check inspection status allows evidence upload
      if (!['DRAFT', 'PENDING'].includes((inspection as any)?.status)) {
        return {
          success: false,
          error: 'Cannot upload evidence to completed inspections',
        }
      }

      // Generate secure file path
      const timestamp = Date.now()
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `evidence/${inspectionId}/${userId}/${timestamp}_${sanitizedFilename}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence-files')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('File upload error:', uploadError)
        return {
          success: false,
          error: 'Failed to upload file',
        }
      }

      // Create evidence record in database
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .insert({
          inspection_id: inspectionId,
          uploaded_by: userId,
          filename: sanitizedFilename,
          original_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          url: uploadData.path,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          accuracy: metadata.accuracy,
          timestamp: metadata.timestamp.toISOString(),
          verified: false,
        } as any)
        .select()
        .single()

      if (evidenceError) {
        console.error('Evidence record creation error:', evidenceError)
        
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('evidence-files')
          .remove([uploadData.path])

        return {
          success: false,
          error: 'Failed to create evidence record',
        }
      }

      return {
        success: true,
        data: evidenceData,
      }
    } catch (error) {
      console.error('Error uploading evidence file:', error)
      return {
        success: false,
        error: 'Internal error during file upload',
      }
    }
  }

  /**
   * Delete evidence file with proper authorization
   */
  async deleteEvidenceFile(
    userId: string,
    evidenceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.createSupabaseServerClient()
      
      // Get evidence record
      const { data: evidence, error } = await supabase
        .from('evidence')
        .select('*, inspections!inner(assigned_to, status, project_id)')
        .eq('id', evidenceId)
        .single()

      if (error || !evidence) {
        return {
          success: false,
          error: 'Evidence file not found',
        }
      }

      // Check if user can delete this evidence
      const canDelete = 
        (evidence as any)?.uploaded_by === userId || // User uploaded it
        await this.userCanManageInspection(userId, (evidence as any)?.inspections?.project_id)

      if (!canDelete) {
        return {
          success: false,
          error: 'You do not have permission to delete this evidence',
        }
      }

      // Check if inspection status allows deletion
      if (!['DRAFT', 'PENDING'].includes((evidence as any)?.inspections?.status)) {
        return {
          success: false,
          error: 'Cannot delete evidence from completed inspections',
        }
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('evidence-files')
        .remove([(evidence as any)?.url])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage deletion fails
      }

      // Delete evidence record
      const { error: deleteError } = await supabase
        .from('evidence')
        .delete()
        .eq('id', evidenceId)

      if (deleteError) {
        console.error('Evidence deletion error:', deleteError)
        return {
          success: false,
          error: 'Failed to delete evidence record',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error('Error deleting evidence file:', error)
      return {
        success: false,
        error: 'Internal error during file deletion',
      }
    }
  }

  private async userCanManageInspection(userId: string, projectId: string): Promise<boolean> {
    try {
      const supabase = this.createSupabaseServerClient()
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (!profile) return false

      // Project managers and executives can manage inspections
      if (['PROJECT_MANAGER', 'EXECUTIVE'].includes((profile as any)?.role)) {
        // Check if they have access to the project
        const authService = AuthService.getInstance()
        return await authService.checkProjectAccess(userId, projectId)
      }

      return false
    } catch (error) {
      console.error('Error checking inspection management permissions:', error)
      return false
    }
  }
}

export const secureStorageService = SecureStorageService.getInstance()