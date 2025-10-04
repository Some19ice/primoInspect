import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

/**
 * PATCH /api/notifications/mark-all-read
 * 
 * Mark all notifications as read for the authenticated user
 */
export async function PATCH(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    // First, get all unread notifications for the user
    const notificationsResult = await supabaseDatabase.getNotificationsForUser(
      user!.id,
      1000 // Get a large number to cover all notifications
    )

    if (notificationsResult.error) {
      console.error('Error fetching notifications:', notificationsResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    const unreadNotifications = notificationsResult.data.filter(
      (n: any) => !n.is_read
    )

    // Mark each unread notification as read
    const results = await Promise.allSettled(
      unreadNotifications.map((notification: any) =>
        supabaseDatabase.markNotificationAsRead(notification.id)
      )
    )

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    if (failed > 0) {
      console.warn(`Failed to mark ${failed} notifications as read`)
    }

    return NextResponse.json({
      success: true,
      markedAsRead: successful,
      failed: failed
    })
  } catch (error) {
    console.error('Error in PATCH /api/notifications/mark-all-read:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
