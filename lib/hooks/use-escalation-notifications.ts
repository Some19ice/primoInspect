'use client'

import { useEffect, useState, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

// Define EscalationQueue type since escalations table is not in generated types yet
type EscalationQueue = {
  id: string
  inspection_id: string
  original_manager_id: string
  status: string
  priority_level: string
  escalation_threshold_hours: number
  notification_count: number
  created_at: string | null
  expires_at: string | null
  resolved_at: string | null
  resolved_by: string | null
}

interface UseEscalationNotificationsOptions {
  inspectionId?: string
  managerId?: string
  autoRefresh?: boolean
}

interface EscalationMetrics {
  totalEscalations: number
  activeEscalations: number
  urgentEscalations: number
  expiredEscalations: number
}

export function useEscalationNotifications(options: UseEscalationNotificationsOptions = {}) {
  const [escalationStatus, setEscalationStatus] = useState<EscalationQueue | null>(null)
  const [escalationQueue, setEscalationQueue] = useState<EscalationQueue[]>([])
  const [metrics, setMetrics] = useState<EscalationMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Fetch escalation status for specific inspection
  const fetchEscalationStatus = useCallback(async () => {
    if (!options.inspectionId) {
      setEscalationStatus(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Call the API route
      const response = await fetch(`/api/escalations?inspectionId=${options.inspectionId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch escalation' }))
        throw new Error(errorData.error || 'Failed to fetch escalation')
      }

      const result = await response.json()
      setEscalationStatus(result.escalation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch escalation status')
    } finally {
      setLoading(false)
    }
  }, [options.inspectionId])

  // Fetch escalation queue for manager
  const fetchEscalationQueue = useCallback(async () => {
    if (!options.managerId) {
      setEscalationQueue([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Call the API route
      const response = await fetch(`/api/escalations?managerId=${options.managerId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch escalation queue' }))
        throw new Error(errorData.error || 'Failed to fetch escalation queue')
      }

      const result = await response.json()
      setEscalationQueue(result.escalations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch escalation queue')
    } finally {
      setLoading(false)
    }
  }, [options.managerId])

  // Fetch escalation metrics for manager dashboard
  const fetchEscalationMetrics = useCallback(async () => {
    if (!options.managerId) {
      setMetrics(null)
      return
    }

    try {
      // Call the API route
      const response = await fetch(`/api/escalations?managerId=${options.managerId}`)
      
      if (!response.ok) {
        console.error('Error fetching escalation metrics')
        return
      }

      const result = await response.json()
      const escalations = result.escalations || []
      
      setMetrics({
        totalEscalations: escalations.length,
        activeEscalations: escalations.filter((e: any) => ['QUEUED', 'NOTIFIED'].includes(e.status)).length,
        urgentEscalations: escalations.filter((e: any) => e.priority_level === 'URGENT').length,
        expiredEscalations: escalations.filter((e: any) => e.status === 'EXPIRED').length
      })
    } catch (err) {
      console.error('Error fetching escalation metrics:', err)
    }
  }, [options.managerId])

  // Create escalation
  const createEscalation = useCallback(async (escalationData: {
    inspection_id: string
    original_manager_id: string
    escalation_reason: string
    priority_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }) => {
    try {
      // Call the API route
      const response = await fetch('/api/escalations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionId: escalationData.inspection_id,
          originalManagerId: escalationData.original_manager_id,
          escalationReason: escalationData.escalation_reason,
          priorityLevel: escalationData.priority_level,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create escalation' }))
        const errorMessage = errorData.error || 'Failed to create escalation'
        setError(errorMessage)
        return { data: null, error: errorMessage }
      }

      const result = await response.json()

      // Refresh metrics after creating escalation
      await fetchEscalationMetrics()
      
      return { data: result.escalation, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create escalation'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }, [fetchEscalationMetrics])

  // Resolve escalation
  const resolveEscalation = useCallback(async (escalationId: string) => {
    try {
      // Call the API route
      const response = await fetch(`/api/escalations/${escalationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'RESOLVED',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to resolve escalation' }))
        const errorMessage = errorData.error || 'Failed to resolve escalation'
        setError(errorMessage)
        return { error: errorMessage }
      }

      // Refresh metrics after resolving escalation
      await fetchEscalationMetrics()
      
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve escalation'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }, [fetchEscalationMetrics])

  // Set up real-time subscriptions
  // NOTE: Real-time updates are temporarily disabled to avoid using supabaseDatabase on client side.
  // These can be re-enabled once we implement proper client-side Supabase subscriptions.
  useEffect(() => {
    // TODO: Implement real-time subscriptions using client-side Supabase
    // For now, we rely on manual refresh and auto-refresh interval
  }, [options.inspectionId, options.managerId])

  // Initial data fetch
  useEffect(() => {
    if (options.inspectionId) {
      fetchEscalationStatus()
    }
    if (options.managerId) {
      fetchEscalationQueue()
      fetchEscalationMetrics()
    }
  }, [options.inspectionId, options.managerId, fetchEscalationStatus, fetchEscalationQueue, fetchEscalationMetrics])

  // Auto refresh
  useEffect(() => {
    if (!options.autoRefresh) return

    const interval = setInterval(() => {
      if (options.inspectionId) {
        fetchEscalationStatus()
      }
      if (options.managerId) {
        fetchEscalationQueue()
        fetchEscalationMetrics()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [options.autoRefresh, options.inspectionId, options.managerId, fetchEscalationStatus, fetchEscalationQueue, fetchEscalationMetrics])

  return {
    // Data
    escalationStatus,
    escalationQueue,
    metrics,
    
    // States
    loading,
    error,
    
    // Actions
    createEscalation,
    resolveEscalation,
    refreshStatus: fetchEscalationStatus,
    refreshQueue: fetchEscalationQueue,
    refreshMetrics: fetchEscalationMetrics,
  }
}