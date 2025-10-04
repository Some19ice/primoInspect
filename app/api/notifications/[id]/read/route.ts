import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

/**
 * PATCH /api/notifications/[id]/read
 * 
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { id } = await params

    // Mark notification as read
    const result = await supabaseDatabase.markNotificationAsRead(id)

    if (result.error) {
      console.error('Error marking notification as read:', result.error)
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification: result.data
    })
  } catch (error) {
    console.error('Error in PATCH /api/notifications/[id]/read:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
