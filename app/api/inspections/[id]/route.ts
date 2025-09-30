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
    
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/inspections/[id]:', error)
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

    // Use the database service which should handle RLS properly
    const result = await supabaseDatabase.updateInspection(id, body)
    
    if (result.error) {
      console.error('Error updating inspection:', result.error)
      return NextResponse.json(
        { error: 'Failed to update inspection' },
        { status: 500 }
      )
    }

    await logAuditEvent('INSPECTION', id, 'UPDATED', user!.id, body)
    
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in PUT /api/inspections/[id]:', error)
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
      console.error('Error deleting inspection:', result.error)
      return NextResponse.json(
        { error: 'Failed to delete inspection' },
        { status: 500 }
      )
    }

    await logAuditEvent('INSPECTION', id, 'DELETED', user!.id, {})
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/inspections/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete inspection' },
      { status: 500 }
    )
  }
}
