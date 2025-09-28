import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    
    const result = await supabaseDatabase.getEvidenceForInspection(id)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Evidence not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    
    const evidenceData = {
      inspection_id: id,
      uploaded_by: user!.id,
      filename: body.filename,
      original_name: body.originalName,
      mime_type: body.mimeType,
      file_size: body.fileSize,
      storage_path: body.storagePath || body.url, // Use storagePath or fallback to url
      public_url: body.url,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy,
      timestamp: body.timestamp || new Date().toISOString(),
      metadata: body.metadata,
    }
    
    const result = await supabaseDatabase.createEvidence(evidenceData)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to add evidence' },
        { status: 500 }
      )
    }

    await logAuditEvent('INSPECTION', id, 'EVIDENCE_ADDED', user!.id, body)
    
    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add evidence' },
      { status: 500 }
    )
  }
}
