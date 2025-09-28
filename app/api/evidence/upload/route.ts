import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { SupabaseStorageService } from '@/lib/supabase/storage'

const storageService = new SupabaseStorageService()

export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const inspectionId = formData.get('inspectionId') as string
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string
    const accuracy = formData.get('accuracy') as string

    if (!file || !inspectionId) {
      return NextResponse.json(
        { error: 'File and inspectionId are required' },
        { status: 400 }
      )
    }

    // Upload evidence with metadata
    const result = await storageService.uploadEvidence(
      file,
      inspectionId,
      user!.id,
      {
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
        timestamp: new Date(),
      }
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Log audit event
    await logAuditEvent(
      'EVIDENCE',
      result.data!.path,
      'UPLOADED',
      user!.id,
      { inspectionId, fileName: file.name, fileSize: file.size }
    )

    return NextResponse.json({
      success: true,
      evidence: result.data
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
