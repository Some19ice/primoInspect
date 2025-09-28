import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { supabaseDatabase } from '@/lib/supabase/database'

// Upload configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_INSPECTION_SIZE: 1024 * 1024 * 1024, // 1GB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/webm',
  ],
  UPLOAD_DIR:
    process.env.NODE_ENV === 'production' ? '/tmp/uploads' : './public/uploads',
  THUMBNAIL_DIR:
    process.env.NODE_ENV === 'production'
      ? '/tmp/thumbnails'
      : './public/uploads/thumbnails',
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for resumable uploads
} as const

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  fileSize: number
  url: string
  thumbnailUrl?: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    exif?: Record<string, any>
  }
}

export interface UploadProgress {
  id: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export class FileUploadService {
  private static uploadDir = UPLOAD_CONFIG.UPLOAD_DIR
  private static thumbnailDir = UPLOAD_CONFIG.THUMBNAIL_DIR

  // Initialize upload directories
  static async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true })
      await fs.mkdir(this.thumbnailDir, { recursive: true })
      console.log('Upload directories initialized')
    } catch (error) {
      console.error('Failed to initialize upload directories:', error)
    }
  }

  // Validate file before upload
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      }
    }

    // Check file type
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`,
      }
    }

    return { isValid: true }
  }

  // Check inspection evidence size limit
  static async checkInspectionSizeLimit(
    inspectionId: string,
    newFileSize: number
  ): Promise<{ withinLimit: boolean; currentSize: number; error?: string }> {
    try {
      const currentSize = await supabaseDatabase.getTotalEvidenceSizeForInspection(inspectionId)

      if (currentSize + newFileSize > UPLOAD_CONFIG.MAX_INSPECTION_SIZE) {
        return {
          withinLimit: false,
          currentSize,
          error: `Total evidence size would exceed 1GB limit for this inspection`,
        }
      }

      return { withinLimit: true, currentSize }
    } catch (error) {
      return {
        withinLimit: false,
        currentSize: 0,
        error: 'Failed to check inspection size limit',
      }
    }
  }

  // Process multipart form data from request
  static async processUpload(request: NextRequest): Promise<{
    files: UploadedFile[]
    fields: Record<string, string>
    error?: string
  }> {
    try {
      const formData = await request.formData()
      const files: UploadedFile[] = []
      const fields: Record<string, string> = {}

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          // Validate file
          const validation = this.validateFile(value)
          if (!validation.isValid) {
            return { files: [], fields: {}, error: validation.error }
          }

          // Process file upload
          const uploadedFile = await this.saveFile(value)
          files.push(uploadedFile)
        } else {
          fields[key] = value as string
        }
      }

      return { files, fields }
    } catch (error) {
      console.error('Upload processing error:', error)
      return {
        files: [],
        fields: {},
        error: 'Failed to process upload',
      }
    }
  }

  // Save file to disk and generate metadata
  private static async saveFile(file: File): Promise<UploadedFile> {
    const fileId = uuidv4()
    const fileExtension = path.extname(file.name)
    const filename = `${fileId}${fileExtension}`
    const filePath = path.join(this.uploadDir, filename)

    // Save file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fs.writeFile(filePath, buffer)

    const uploadedFile: UploadedFile = {
      id: fileId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      url: `/uploads/${filename}`,
    }

    // Generate thumbnail and metadata for images
    if (file.type.startsWith('image/')) {
      try {
        const thumbnailData = await this.generateImageThumbnail(
          buffer,
          fileId,
          fileExtension
        )
        uploadedFile.thumbnailUrl = thumbnailData.url
        uploadedFile.metadata = thumbnailData.metadata
      } catch (error) {
        console.error('Thumbnail generation failed:', error)
      }
    }

    // Extract video metadata
    if (file.type.startsWith('video/')) {
      try {
        uploadedFile.metadata = await this.extractVideoMetadata(buffer)
      } catch (error) {
        console.error('Video metadata extraction failed:', error)
      }
    }

    return uploadedFile
  }

  // Generate thumbnail for images
  private static async generateImageThumbnail(
    imageBuffer: Buffer,
    fileId: string,
    extension: string
  ): Promise<{ url: string; metadata: any }> {
    const thumbnailFilename = `${fileId}_thumb${extension}`
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename)

    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    // Generate thumbnail (max 300x300, maintain aspect ratio)
    await image
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)

    return {
      url: `/uploads/thumbnails/${thumbnailFilename}`,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        exif: metadata.exif,
      },
    }
  }

  // Extract video metadata (placeholder - would use ffprobe in production)
  private static async extractVideoMetadata(videoBuffer: Buffer): Promise<any> {
    // TODO: Implement video metadata extraction using ffprobe
    return {
      duration: 0, // Duration in seconds
      width: 0,
      height: 0,
    }
  }

  // Delete file and thumbnail
  static async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename)
      await fs.unlink(filePath)

      // Delete thumbnail if it exists
      const fileId = path.parse(filename).name
      const thumbnailPattern = `${fileId}_thumb`

      try {
        const thumbnailFiles = await fs.readdir(this.thumbnailDir)
        const thumbnailToDelete = thumbnailFiles.find(file =>
          file.startsWith(thumbnailPattern)
        )

        if (thumbnailToDelete) {
          const thumbnailPath = path.join(this.thumbnailDir, thumbnailToDelete)
          await fs.unlink(thumbnailPath)
        }
      } catch (error) {
        console.error('Thumbnail deletion failed:', error)
      }
    } catch (error) {
      console.error('File deletion failed:', error)
      throw error
    }
  }

  // Get file URL
  static getFileUrl(filename: string): string {
    return `/uploads/${filename}`
  }

  // Get thumbnail URL
  static getThumbnailUrl(filename: string): string {
    const fileId = path.parse(filename).name
    const extension = path.parse(filename).ext
    return `/uploads/thumbnails/${fileId}_thumb${extension}`
  }

  // Chunked upload support for large files
  static async processChunkedUpload(
    chunkData: Buffer,
    chunkIndex: number,
    totalChunks: number,
    uploadId: string
  ): Promise<{ completed: boolean; progress: number }> {
    const chunkDir = path.join(this.uploadDir, 'chunks', uploadId)
    await fs.mkdir(chunkDir, { recursive: true })

    const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`)
    await fs.writeFile(chunkPath, chunkData)

    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
    const completed = chunkIndex === totalChunks - 1

    if (completed) {
      // Combine all chunks
      await this.combineChunks(uploadId, totalChunks)
    }

    return { completed, progress }
  }

  // Combine uploaded chunks
  private static async combineChunks(
    uploadId: string,
    totalChunks: number
  ): Promise<void> {
    const chunkDir = path.join(this.uploadDir, 'chunks', uploadId)
    const finalPath = path.join(this.uploadDir, `${uploadId}.tmp`)

    const writeStream = require('fs').createWriteStream(finalPath)

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk_${i}`)
      const chunkData = await fs.readFile(chunkPath)
      writeStream.write(chunkData)
    }

    writeStream.end()

    // Clean up chunk directory
    await fs.rm(chunkDir, { recursive: true })
  }
}

// Mobile-optimized upload utilities
export class MobileUploadUtils {
  // Compress image for mobile upload
  static async compressImageForMobile(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const compressed = await sharp(buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer()

      return new File([new Uint8Array(compressed)], file.name, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      })
    } catch (error) {
      console.error('Image compression failed:', error)
      return file
    }
  }

  // Check network conditions and adjust upload strategy
  static getUploadStrategy(): 'standard' | 'chunked' | 'compressed' {
    // In a real implementation, this would check network conditions
    // For now, return chunked for files > 5MB
    return 'chunked'
  }

  // Progress tracking for mobile uploads
  static createProgressTracker(fileId: string): {
    update: (progress: number) => void
    complete: () => void
    error: (error: string) => void
  } {
    return {
      update: (progress: number) => {
        // Broadcast progress update
        console.log(`Upload ${fileId}: ${progress}%`)
      },
      complete: () => {
        console.log(`Upload ${fileId}: completed`)
      },
      error: (error: string) => {
        console.error(`Upload ${fileId}: ${error}`)
      },
    }
  }
}

// Export individual functions for backward compatibility
export const validateFileSize = (file: File): boolean => {
  return file.size <= UPLOAD_CONFIG.MAX_FILE_SIZE
}

export const validateFileType = (file: File): boolean => {
  return UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)
}

export const checkInspectionSizeLimit = FileUploadService.checkInspectionSizeLimit

export const processUpload = FileUploadService.processUpload

// Initialize upload directories on module load
FileUploadService.initializeDirectories().catch(console.error)
