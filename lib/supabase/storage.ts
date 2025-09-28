import { supabase } from './client'

export class SupabaseStorageService {
  private readonly EVIDENCE_BUCKET = 'evidence-files'
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  private readonly MAX_INSPECTION_SIZE = 1024 * 1024 * 1024 // 1GB

  // ===== FILE UPLOAD =====

  async uploadEvidence(
    file: File,
    inspectionId: string,
    userId: string,
    metadata: {
      latitude?: number
      longitude?: number
      accuracy?: number
      timestamp: Date
    }
  ): Promise<{
    data: {
      path: string
      publicUrl?: string
      signedUrl?: string
    } | null
    error: any
  }> {
    try {
      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          data: null,
          error: new Error(`File size exceeds 50MB limit. Current size: ${Math.round(file.size / 1024 / 1024)}MB`)
        }
      }

      // Check total inspection evidence size
      const totalSize = await this.getTotalInspectionEvidenceSize(inspectionId)
      if (totalSize + file.size > this.MAX_INSPECTION_SIZE) {
        return {
          data: null,
          error: new Error(`Total inspection evidence would exceed 1GB limit`)
        }
      }

      // Validate file type
      if (!this.isValidFileType(file.type)) {
        return {
          data: null,
          error: new Error(`Unsupported file type: ${file.type}`)
        }
      }

      // Generate unique file path
      const fileExtension = file.name.split('.').pop()
      const fileName = `${inspectionId}/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
      const filePath = `evidence/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.EVIDENCE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            inspectionId,
            userId,
            originalName: file.name,
            mimeType: file.type,
            latitude: metadata.latitude?.toString(),
            longitude: metadata.longitude?.toString(),
            accuracy: metadata.accuracy?.toString(),
            timestamp: metadata.timestamp.toISOString(),
          }
        })

      if (uploadError) {
        return { data: null, error: uploadError }
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(this.EVIDENCE_BUCKET)
        .getPublicUrl(filePath)

      return {
        data: {
          path: filePath,
          publicUrl: urlData.publicUrl,
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // ===== FILE MANAGEMENT =====

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<{
    data: { signedUrl: string } | null
    error: any
  }> {
    const { data, error } = await supabase.storage
      .from(this.EVIDENCE_BUCKET)
      .createSignedUrl(filePath, expiresIn)

    return { data, error }
  }

  async deleteFile(filePath: string): Promise<{ error: any }> {
    const { error } = await supabase.storage
      .from(this.EVIDENCE_BUCKET)
      .remove([filePath])

    return { error }
  }

  async getFileMetadata(filePath: string) {
    const { data, error } = await supabase.storage
      .from(this.EVIDENCE_BUCKET)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop(),
        limit: 1
      })

    if (error || !data || data.length === 0) {
      return { data: null, error: error || new Error('File not found') }
    }

    return { data: data[0], error: null }
  }

  // ===== VALIDATION HELPERS =====

  private isValidFileType(mimeType: string): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      // Videos
      'video/mp4',
      'video/mov',
      'video/quicktime',
    ]

    return allowedTypes.includes(mimeType.toLowerCase())
  }

  private async getTotalInspectionEvidenceSize(inspectionId: string): Promise<number> {
    // This would need to query the evidence table to get total file sizes
    // For now, return 0 - this should be implemented with database query
    try {
      const { data, error } = await supabase
        .from('evidence')
        .select('file_size')
        .eq('inspection_id', inspectionId)

      if (error || !data) return 0

      return data.reduce((total: number, evidence: { file_size: number }) => total + evidence.file_size, 0)
    } catch {
      return 0
    }
  }

  // ===== THUMBNAIL GENERATION =====

  async generateThumbnail(
    filePath: string,
    width: number = 300,
    height: number = 300
  ): Promise<{
    data: { thumbnailPath: string; publicUrl: string } | null
    error: any
  }> {
    try {
      // Get the original file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.EVIDENCE_BUCKET)
        .download(filePath)

      if (downloadError) {
        return { data: null, error: downloadError }
      }

      // For now, return the original file path as thumbnail
      // In production, you'd use an image processing service
      const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg')
      
      const { data: urlData } = supabase.storage
        .from(this.EVIDENCE_BUCKET)
        .getPublicUrl(filePath)

      return {
        data: {
          thumbnailPath,
          publicUrl: urlData.publicUrl
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // ===== BATCH OPERATIONS =====

  async uploadMultipleFiles(
    files: File[],
    inspectionId: string,
    userId: string,
    metadata: {
      latitude?: number
      longitude?: number
      accuracy?: number
      timestamp: Date
    }
  ): Promise<{
    successful: Array<{ file: File; path: string; publicUrl: string }>
    failed: Array<{ file: File; error: any }>
  }> {
    const successful: Array<{ file: File; path: string; publicUrl: string }> = []
    const failed: Array<{ file: File; error: any }> = []

    // Upload files in parallel but limit concurrency
    const batchSize = 3
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (file) => {
        const result = await this.uploadEvidence(file, inspectionId, userId, metadata)
        
        if (result.error) {
          failed.push({ file, error: result.error })
        } else if (result.data) {
          successful.push({
            file,
            path: result.data.path,
            publicUrl: result.data.publicUrl || ''
          })
        }
      })

      await Promise.all(batchPromises)
    }

    return { successful, failed }
  }

  // ===== CLEANUP OPERATIONS =====

  async cleanupInspectionEvidence(inspectionId: string): Promise<{ error: any }> {
    try {
      // List all files for the inspection
      const { data: files, error: listError } = await supabase.storage
        .from(this.EVIDENCE_BUCKET)
        .list(`evidence/${inspectionId}`, {
          limit: 100,
          offset: 0
        })

      if (listError) {
        return { error: listError }
      }

      if (!files || files.length === 0) {
        return { error: null }
      }

      // Delete all files
      const filePaths = files.map(file => `evidence/${inspectionId}/${file.name}`)
      const { error: deleteError } = await supabase.storage
        .from(this.EVIDENCE_BUCKET)
        .remove(filePaths)

      return { error: deleteError }
    } catch (error) {
      return { error }
    }
  }

  // ===== PROGRESS TRACKING =====

  async uploadWithProgress(
    file: File,
    inspectionId: string,
    userId: string,
    metadata: {
      latitude?: number
      longitude?: number
      accuracy?: number
      timestamp: Date
    },
    onProgress?: (progress: number) => void
  ): Promise<{
    data: {
      path: string
      publicUrl?: string
    } | null
    error: any
  }> {
    // For chunked upload with progress tracking
    // This is a simplified version - real implementation would use chunked upload
    
    if (onProgress) {
      onProgress(0) // Start
    }

    const result = await this.uploadEvidence(file, inspectionId, userId, metadata)

    if (onProgress) {
      onProgress(100) // Complete
    }

    return result
  }
}

export const supabaseStorage = new SupabaseStorageService()