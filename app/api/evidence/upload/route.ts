import { NextRequest, NextResponse } from 'next/server'
import { withRBAC, AuthenticatedRequest } from '@/lib/auth/rbac-middleware'
import { logAuditEvent } from '@/lib/auth/auth-service'
import { secureStorageService } from '@/lib/storage/secure-storage'

export const POST = withRBAC()(async (request: AuthenticatedRequest) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const inspectionId = formData.get('inspectionId') as string
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string
    const accuracy = formData.get('accuracy') as string

    if (!file || !inspectionId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File and inspectionId are required',
          },
        },
        { status: 400 }
      )
    }

    // Validate file size and type
    const maxSizeBytes = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size must be less than 50MB',
          },
        },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'application/pdf',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'File type not supported',
          },
        },
        { status: 400 }
      )
    }

    // Use secure storage service for upload with validation
    const result = await secureStorageService.uploadEvidenceFile(
      request.user.id,
      inspectionId,
      file,
      {
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
        timestamp: new Date(),
      }
    )

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'UPLOAD_FAILED',
            message: result.error || 'Failed to upload evidence',
          },
        },
        { status: 400 }
      )
    }

    // Log audit event
    await logAuditEvent(
      'EVIDENCE',
      result.data!.id,
      'UPLOADED',
      request.user.id,
      {
        inspectionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasLocation: !!(latitude && longitude),
      },
      request
    )

    return NextResponse.json({
      success: true,
      evidence: {
        id: result.data!.id,
        filename: result.data!.filename,
        originalName: result.data!.original_name,
        mimeType: result.data!.mime_type,
        fileSize: result.data!.file_size,
        url: result.data!.url,
        verified: result.data!.verified,
        timestamp: result.data!.timestamp,
        location: latitude && longitude ? {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy ? parseFloat(accuracy) : undefined,
        } : null,
        createdAt: result.data!.created_at,
      },
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Log failed upload attempt
    await logAuditEvent(
      'EVIDENCE',
      'upload_failed',
      'UPLOAD_FAILED',
      request.user.id,
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      request
    )

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during upload',
        },
      },
      { status: 500 }
    )
  }
})
