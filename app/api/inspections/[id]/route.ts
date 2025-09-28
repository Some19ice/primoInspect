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
    
    const result = await supabaseDatabase.getInspectionById(id)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inspection' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    
    // Use updateInspectionStatus for status updates
    if (body.status) {
      const result = await supabaseDatabase.updateInspectionStatus(id, body.status, body)
      
      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to update inspection' },
          { status: 500 }
        )
      }

      await logAuditEvent('INSPECTION', id, 'UPDATED', user!.id, body)
      
      return NextResponse.json(result.data)
    }
    
    // Use general updateInspection method for other fields
    const result = await supabaseDatabase.updateInspection(id, body)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to update inspection' },
        { status: 500 }
      )
    }

    await logAuditEvent('INSPECTION', id, 'UPDATED', user!.id, body)
    
    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update inspection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params
    
    const result = await supabaseDatabase.deleteInspection(id)
    
    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to delete inspection' },
        { status: 500 }
      )
    }

    await logAuditEvent('INSPECTION', id, 'DELETED', user!.id, {})
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete inspection' },
      { status: 500 }
    )
  }
}
