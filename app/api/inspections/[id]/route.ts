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
      console.error('DB error in getInspectionById:', result.error)
      return NextResponse.json(
        { error: 'Failed to fetch inspection', details: result.error },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error('Error in GET /api/inspections/[id]:', err)
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

    console.log('Updating inspection:', id, 'with data:', JSON.stringify(body).substring(0, 200))

    // Use the database service which should handle RLS properly
    const result = await supabaseDatabase.updateInspection(id, body)
    
    if (result.error) {
      console.error('Error updating inspection:', result.error)
      console.error('Error details:', JSON.stringify(result.error, null, 2))
      return NextResponse.json(
        { 
          error: 'Failed to update inspection',
          details: result.error.message || String(result.error)
        },
        { status: 500 }
      )
    }

    console.log('Successfully updated inspection:', id)

    await logAuditEvent('INSPECTION', id, 'UPDATED', user!.id, body)
    
    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('Error in PUT /api/inspections/[id]:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to update inspection',
        details: error.message || String(error)
      },
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
