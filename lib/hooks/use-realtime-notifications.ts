'use client'

import { useEffect, useState, useCallback } from 'react'
import { realtimeService } from '@/lib/supabase/realtime'
import { Database } from '@/lib/supabase/types'

type Notification = Database['public']['Tables']['notifications']['Row']

interface UseRealtimeNotificationsOptions {
  userId?: string
  autoMarkAsRead?: boolean
  maxNotifications?: number
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!options.userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Call the API route
      const limit = options.maxNotifications || 50
      const response = await fetch(`/api/notifications?limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch notifications' }))
        throw new Error(errorData.error || 'Failed to fetch notifications')
      }
      
      const result = await response.json()
      setNotifications(result.notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [options.userId, options.maxNotifications])

  // Handle real-time notification updates
  const handleNotificationUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord } = payload

    if (eventType === 'INSERT') {
      setNotifications(current => [newRecord, ...current])
      
      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(newRecord.title, {
            body: newRecord.message,
            icon: '/favicon.ico',
            tag: newRecord.id
          })
        }
      }

      // Auto-mark as read if enabled
      if (options.autoMarkAsRead) {
        setTimeout(() => {
          markAsRead(newRecord.id)
        }, 3000)
      }
    }
  }, [options.autoMarkAsRead])

  // Set up real-time subscription
  useEffect(() => {
    if (!options.userId) return

    let unsubscribeNotifications: (() => void) | undefined
    let unsubscribeConnection: (() => void) | undefined

    // Subscribe to user notifications
    unsubscribeNotifications = realtimeService.subscribeToUserNotifications(
      options.userId,
      handleNotificationUpdate
    )

    // Subscribe to connection state
    unsubscribeConnection = realtimeService.subscribeToConnectionState(
      (status) => {
        setIsConnected(status === 'SUBSCRIBED')
      }
    )

    return () => {
      unsubscribeNotifications?.()
      unsubscribeConnection?.()
    }
  }, [options.userId, handleNotificationUpdate])

  // Fetch initial data
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(current =>
        current.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      )

      // Call the API route
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      
      if (!response.ok) {
        // Revert on error
        await fetchNotifications()
        const errorData = await response.json().catch(() => ({ error: 'Failed to mark notification as read' }))
        throw new Error(errorData.error || 'Failed to mark notification as read')
      }
    } catch (error) {
      await fetchNotifications()
      throw error
    }
  }, [fetchNotifications])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(current =>
        current.map(notification => ({ ...notification, is_read: true }))
      )

      // Call the API route
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      })
      
      if (!response.ok) {
        // Revert on error
        await fetchNotifications()
        const errorData = await response.json().catch(() => ({ error: 'Failed to mark all as read' }))
        throw new Error(errorData.error || 'Failed to mark all as read')
      }
    } catch (error) {
      await fetchNotifications()
      throw error
    }
  }, [fetchNotifications])

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  // Filter functions
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.is_read)
  }, [notifications])

  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type)
  }, [notifications])

  const getNotificationsByPriority = useCallback((priority: Notification['priority']) => {
    return notifications.filter(notification => notification.priority === priority)
  }, [notifications])

  return {
    notifications,
    loading,
    error,
    isConnected,
    
    // Actions
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    refresh: fetchNotifications,
    
    // Filters
    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    
    // Statistics
    stats: {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      high: notifications.filter(n => n.priority === 'HIGH').length,
      medium: notifications.filter(n => n.priority === 'MEDIUM').length,
      low: notifications.filter(n => n.priority === 'LOW').length,
    }
  }
}
