import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseDatabase } from '@/lib/supabase/database'

const EVIDENCE_BUCKET = 'evidence-files'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const inspectionId = formData.get('inspectionId') as string
    const questionId = formData.get('questionId') as string | null
    const latitude = formData.get('latitude') as string | null
    const longitude = formData.get('longitude') as string | null
    const accuracy = formData.get('accuracy') as string | null

    if (!file || !inspectionId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, inspectionId' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 50MB limit. Current size: ${Math.round(file.size / 1024 / 1024)}MB` },
        { status: 400 }
      )
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop()
    const fileName = `${inspectionId}/${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExtension}`
    const filePath = `evidence/${fileName}`

    // Upload file to Supabase Storage using server client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Upload failed' },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(EVIDENCE_BUCKET)
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Create evidence record in database
    const evidenceData = {
      inspection_id: inspectionId,
      uploaded_by: user.id,
      filename: file.name,
      original_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      storage_path: uploadData.path,
      public_url: publicUrl,
      question_id: questionId || undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
      timestamp: new Date().toISOString(),
      metadata: {
        uploadedAt: new Date().toISOString(),
        linkedToQuestion: !!questionId,
        contentType: file.type,
        originalSize: file.size,
      },
    }

    console.log('[Evidence Upload] Creating evidence record:', {
      inspectionId,
      questionId,
      filename: file.name,
      size: file.size,
      path: uploadData.path,
    })

    const { data: evidence, error: dbError } =
      await supabaseDatabase.createEvidence(evidenceData)

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from(EVIDENCE_BUCKET).remove([filePath])
      return NextResponse.json(
        { error: 'Failed to create evidence record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        evidenceId: (evidence as any)?.id,
        url: publicUrl,
        path: uploadData.path,
      },
    })
  } catch (error) {
    console.error('Evidence upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
