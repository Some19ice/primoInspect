'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { supabaseDatabase } from '@/lib/supabase/database'
import { supabaseStorage } from '@/lib/supabase/storage'

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface EvidenceFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  url?: string
  evidenceId?: string
}

interface UseEvidenceUploadOptions {
  inspectionId: string
  onUploadComplete?: (evidenceId: string, url: string) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number // in MB
  allowedTypes?: string[]
}

export function useEvidenceUpload({
  inspectionId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10, // 10MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
}: UseEvidenceUploadOptions) {
  const [files, setFiles] = useState<EvidenceFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [totalProgress, setTotalProgress] = useState(0)

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${maxFileSize}MB`
    }
    
    return null
  }, [allowedTypes, maxFileSize])

  // Add files to upload queue
  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: EvidenceFile[] = []
    
    newFiles.forEach(file => {
      const error = validateFile(file)
      
      validFiles.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined
      })
    })
    
    setFiles(prev => [...prev, ...validFiles])
    return validFiles.filter(f => f.status !== 'error')
  }, [validateFile])

  // Remove file from queue
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  // Upload single file with progress tracking
  const uploadSingleFile = useCallback(async (evidenceFile: EvidenceFile): Promise<boolean> => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === evidenceFile.id 
          ? { ...f, status: 'uploading' as const, progress: 0 }
          : f
      ))

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Generate unique filename
      const fileExt = evidenceFile.file.name.split('.').pop()
      const fileName = `${inspectionId}/${Date.now()}-${Math.random()}.${fileExt}`

      // Upload to Supabase Storage with progress tracking
      const { data: uploadData, error: uploadError } = await supabaseStorage.uploadEvidence(
        evidenceFile.file,
        inspectionId,
        user.id,
        {
          timestamp: new Date(),
        }
      )

      if (uploadError) {
        throw uploadError
      }

      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === evidenceFile.id 
          ? { ...f, status: 'processing' as const, progress: 100 }
          : f
      ))

      // Get public URL from upload result
      const publicUrl = uploadData?.publicUrl
      if (!publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Create evidence record in database
      const evidenceData = {
        inspection_id: inspectionId,
        uploaded_by: user.id,
        filename: evidenceFile.file.name,
        original_name: evidenceFile.file.name,
        mime_type: evidenceFile.file.type,
        file_size: evidenceFile.file.size,
        storage_path: uploadData?.path || '',
        public_url: publicUrl,
        timestamp: new Date().toISOString(),
        metadata: {
          uploadedAt: new Date().toISOString(),
          fileId: evidenceFile.id
        }
      }

      const { data: evidence, error: dbError } = await supabaseDatabase.createEvidence(evidenceData)
      
      if (dbError) {
        throw dbError
      }

      // Update status to completed
      setFiles(prev => prev.map(f => 
        f.id === evidenceFile.id 
          ? { 
              ...f, 
              status: 'completed' as const, 
              url: publicUrl,
              evidenceId: (evidence as any)?.id || ''
            }
          : f
      ))

      // Call success callback
      onUploadComplete?.((evidence as any)?.id || '', publicUrl)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      // Update status to error
      setFiles(prev => prev.map(f => 
        f.id === evidenceFile.id 
          ? { ...f, status: 'error' as const, error: errorMessage }
          : f
      ))

      // Call error callback
      onUploadError?.(errorMessage)
      
      return false
    }
  }, [inspectionId, onUploadComplete, onUploadError])

  // Upload all pending files
  const uploadAll = useCallback(async (): Promise<void> => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    
    try {
      // Upload files in parallel with concurrency limit
      const concurrencyLimit = 3
      const results: boolean[] = []
      
      for (let i = 0; i < pendingFiles.length; i += concurrencyLimit) {
        const batch = pendingFiles.slice(i, i + concurrencyLimit)
        const batchResults = await Promise.all(
          batch.map(file => uploadSingleFile(file))
        )
        results.push(...batchResults)
        
        // Update total progress
        const completed = i + batch.length
        const totalProgressPercentage = Math.round((completed / pendingFiles.length) * 100)
        setTotalProgress(totalProgressPercentage)
      }

      console.log(`Upload completed: ${results.filter(Boolean).length}/${results.length} successful`)
    } finally {
      setIsUploading(false)
      setTotalProgress(0)
    }
  }, [files, uploadSingleFile])

  // Retry failed uploads
  const retryFailed = useCallback(async (): Promise<void> => {
    const failedFiles = files.filter(f => f.status === 'error')
    
    if (failedFiles.length === 0) return

    // Reset failed files to pending
    setFiles(prev => prev.map(f => 
      f.status === 'error' 
        ? { ...f, status: 'pending' as const, error: undefined, progress: 0 }
        : f
    ))

    // Upload them
    await uploadAll()
  }, [files, uploadAll])

  // Clear completed files
  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'))
  }, [])

  // Clear all files
  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  // Get upload statistics
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    processing: files.filter(f => f.status === 'processing').length,
    completed: files.filter(f => f.status === 'completed').length,
    failed: files.filter(f => f.status === 'error').length
  }

  return {
    files,
    isUploading,
    totalProgress,
    stats,
    addFiles,
    removeFile,
    uploadAll,
    uploadSingleFile,
    retryFailed,
    clearCompleted,
    clearAll,
    validateFile
  }
}