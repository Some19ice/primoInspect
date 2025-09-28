'use client'

import { useEffect, useState, useCallback } from 'react'
import { realtimeService } from '@/lib/supabase/realtime'

interface OfflineStateOptions {
  onOnline?: () => void
  onOffline?: () => void
  syncOnReconnect?: boolean
}

export function useOfflineState(options: OfflineStateOptions = {}) {
  const [isOnline, setIsOnline] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null)

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnlineTime(new Date())
      options.onOnline?.()
      
      if (options.syncOnReconnect) {
        // Trigger sync when coming back online
        window.dispatchEvent(new CustomEvent('sync-required'))
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      options.onOffline?.()
    }

    // Set initial state
    setIsOnline(navigator.onLine)

    // Listen for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [options])

  // Monitor real-time connection state
  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToConnectionState(
      (status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      }
    )

    return unsubscribe
  }, [])

  // Force sync function
  const forceSync = useCallback(() => {
    window.dispatchEvent(new CustomEvent('sync-required'))
  }, [])

  // Get connection quality
  const getConnectionQuality = useCallback(() => {
    if (!isOnline) return 'offline'
    if (!isRealtimeConnected) return 'poor'
    return 'good'
  }, [isOnline, isRealtimeConnected])

  return {
    isOnline,
    isRealtimeConnected,
    lastOnlineTime,
    connectionQuality: getConnectionQuality(),
    forceSync,
    
    // Helper states
    isFullyConnected: isOnline && isRealtimeConnected,
    hasNetworkIssues: isOnline && !isRealtimeConnected,
  }
}
