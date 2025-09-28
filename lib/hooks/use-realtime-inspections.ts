'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseDatabase } from '@/lib/supabase/database'
import { realtimeService } from '@/lib/supabase/realtime'
import { Database } from '@/lib/supabase/types'

type Inspection = Database['public']['Tables']['inspections']['Row']

interface UseRealtimeInspectionsOptions {
  projectId?: string
  userId?: string
  userRole?: 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR'
  autoRefresh?: boolean
}

interface InspectionWithDetails extends Inspection {
  profiles: {
    id: string
    name: string
    email: string
  } | null
  projects: {
    id: string
    name: string
  } | null
}

export function useRealtimeInspections(options: UseRealtimeInspectionsOptions = {}) {
  const [inspections, setInspections] = useState<InspectionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial data
  const fetchInspections = useCallback(async () => {
    if (!options.projectId) {
      setInspections([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      const result = await supabaseDatabase.getInspectionsForProject(
        options.projectId,
        {
          userRole: options.userRole,
          userId: options.userId,
        }
      )

      if (result.error) {
        setError(result.error.message)
      } else {
        setInspections(result.data as InspectionWithDetails[])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inspections')
    } finally {
      setLoading(false)
    }
  }, [options.projectId, options.userRole, options.userId])

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setInspections(current => {
      switch (eventType) {
        case 'INSERT':
          if (!current.find(i => i.id === newRecord.id)) {
            return [...current, newRecord]
          }
          return current

        case 'UPDATE':
          return current.map(inspection =>
            inspection.id === newRecord.id
              ? { ...inspection, ...newRecord }
              : inspection
          )

        case 'DELETE':
          return current.filter(inspection => inspection.id !== oldRecord.id)

        default:
          return current
      }
    })

    if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
      showStatusChangeNotification(newRecord)
    }
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!options.projectId) return

    let unsubscribeProject: (() => void) | undefined
    let unsubscribeConnection: (() => void) | undefined

    // Subscribe to project-level inspection changes
    unsubscribeProject = realtimeService.subscribeToProjectChanges(
      options.projectId,
      handleRealtimeUpdate
    )

    // Subscribe to connection state
    unsubscribeConnection = realtimeService.subscribeToConnectionState(
      (status) => {
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'TIMED_OUT' || status === 'CLOSED') {
          setError('Real-time connection lost')
        }
      }
    )

    return () => {
      unsubscribeProject?.()
      unsubscribeConnection?.()
    }
  }, [options.projectId, handleRealtimeUpdate])

  // Fetch initial data
  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true)
    fetchInspections()
  }, [fetchInspections])

  // Update inspection status with optimistic updates
  const updateInspectionStatus = useCallback(async (
    inspectionId: string,
    status: Inspection['status'],
    additionalData: any = {}
  ) => {
    // Optimistic update
    setInspections(current =>
      current.map(inspection =>
        inspection.id === inspectionId
          ? {
              ...inspection,
              status,
              updated_at: new Date().toISOString(),
              ...additionalData
            }
          : inspection
      )
    )

    try {
      const result = await supabaseDatabase.updateInspectionStatus(
        inspectionId,
        status,
        additionalData
      )

      if (result.error) {
        await fetchInspections()
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to update inspection status')
      }

      return result.data
    } catch (error) {
      await fetchInspections()
      throw error
    }
  }, [fetchInspections])

  // Create new inspection
  const createInspection = useCallback(async (inspectionData: {
    assigned_to: string
    title: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    due_date?: string
    checklist_id: string
  }) => {
    if (!options.projectId) {
      throw new Error('Project ID is required to create inspection')
    }

    try {
      const result = await supabaseDatabase.createInspection({
        project_id: options.projectId,
        ...inspectionData
      })

      if (result.error) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to create inspection')
      }

      return result.data
    } catch (error) {
      throw error
    }
  }, [options.projectId])

  // Filter functions
  const getInspectionsByStatus = useCallback((status: Inspection['status']) => {
    return inspections.filter(inspection => inspection.status === status)
  }, [inspections])

  const getInspectionsForUser = useCallback((userId: string) => {
    return inspections.filter(inspection => inspection.assigned_to === userId)
  }, [inspections])

  const getOverdueInspections = useCallback(() => {
    const now = new Date()
    return inspections.filter(inspection => 
      inspection.due_date &&
      new Date(inspection.due_date) < now &&
      !['APPROVED', 'REJECTED'].includes(inspection.status)
    )
  }, [inspections])

  return {
    inspections,
    loading,
    error,
    isConnected,
    
    // Actions
    refresh,
    updateInspectionStatus,
    createInspection,
    
    // Filters
    getInspectionsByStatus,
    getInspectionsForUser,
    getOverdueInspections,
    
    // Statistics
    stats: {
      total: inspections.length,
      draft: inspections.filter(i => i.status === 'DRAFT').length,
      pending: inspections.filter(i => i.status === 'PENDING').length,
      inReview: inspections.filter(i => i.status === 'IN_REVIEW').length,
      approved: inspections.filter(i => i.status === 'APPROVED').length,
      rejected: inspections.filter(i => i.status === 'REJECTED').length,
      overdue: inspections.filter(i => 
        i.due_date &&
        new Date(i.due_date) < new Date() &&
        !['APPROVED', 'REJECTED'].includes(i.status)
      ).length,
    }
  }
}

function showStatusChangeNotification(inspection: Inspection) {
  const statusMessages = {
    DRAFT: 'Inspection saved as draft',
    PENDING: 'Inspection submitted for review',
    IN_REVIEW: 'Inspection is being reviewed',
    APPROVED: 'Inspection approved ✅',
    REJECTED: 'Inspection rejected - requires revision ❌',
  }

  const message = statusMessages[inspection.status] || `Inspection status updated to ${inspection.status}`
  
  console.log(`🔔 ${inspection.title}: ${message}`)
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inspection-status-changed', {
      detail: { inspection, message }
    }))
  }
}