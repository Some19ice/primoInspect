import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

/**
 * GET /api/notifications
 * 
 * Fetch notifications for the authenticated user
 * Query params:
 * - limit: max notifications to fetch (default 50)
 */
export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Fetch notifications for the authenticated user
    const result = await supabaseDatabase.getNotificationsForUser(
      user!.id,
      limit
    )

    if (result.error) {
      console.error('Error fetching notifications:', result.error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications', notifications: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({
      notifications: result.data || [],
    })
  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        notifications: []
      },
      { status: 500 }
    )
  }
}
