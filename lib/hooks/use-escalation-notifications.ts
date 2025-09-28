'use client'

import { useEffect, useState, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabaseDatabase } from '@/lib/supabase/database'
import { Database } from '@/lib/supabase/types'

type EscalationQueue = Database['public']['Tables']['escalation_queue']['Row']

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
      
      const result = await supabaseDatabase.getActiveEscalation(options.inspectionId)
      
      if (result.error && result.error.code !== 'PGRST116') { // PGRST116 = no rows returned
        setError(result.error.message)
      } else {
        setEscalationStatus(result.data)
      }
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
      
      const result = await supabaseDatabase.getEscalationQueueForManager(options.managerId)
      
      if (result.error) {
        setError(result.error.message)
      } else {
        setEscalationQueue(result.data || [])
      }
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
      // Get escalation queue for manager
      const result = await supabaseDatabase.getEscalationQueueForManager(options.managerId)
      
      if (result.error) {
        console.error('Error fetching escalation metrics:', result.error)
        return
      }

      const escalations = result.data || []
      
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
      const result = await supabaseDatabase.createEscalation(escalationData)
      
      if (result.error) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to create escalation'
        setError(errorMessage)
        return { data: null, error: errorMessage }
      }

      // Refresh metrics after creating escalation
      await fetchEscalationMetrics()
      
      return { data: result.data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create escalation'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }, [fetchEscalationMetrics])

  // Resolve escalation
  const resolveEscalation = useCallback(async (escalationId: string) => {
    try {
      const result = await supabaseDatabase.updateEscalationStatus(escalationId, 'RESOLVED')
      
      if (result.error) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to resolve escalation'
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
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const channels: RealtimeChannel[] = []

    // Subscribe to specific inspection escalation
    if (options.inspectionId) {
      const inspectionChannel = supabaseDatabase.subscribeToInspectionEscalation(
        options.inspectionId,
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setEscalationStatus(payload.new as EscalationQueue)
          } else if (payload.eventType === 'DELETE') {
            setEscalationStatus(null)
          }
        }
      )
      channels.push(inspectionChannel)
    }

    // Subscribe to escalation queue changes for manager
    if (options.managerId) {
      const queueChannel = supabaseDatabase.subscribeToEscalationQueue((payload) => {
        // Refresh queue and metrics on any escalation changes
        fetchEscalationQueue()
        fetchEscalationMetrics()
      })
      channels.push(queueChannel)
    }

    return () => {
      // Cleanup subscriptions
      channels.forEach(channel => {
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe()
        }
      })
    }
  }, [options.inspectionId, options.managerId, fetchEscalationQueue, fetchEscalationMetrics])

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