'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabaseDatabase } from '@/lib/supabase/database'
import { realtimeService } from '@/lib/supabase/realtime'
import { Database } from '@/lib/supabase/types'

type Project = Database['public']['Tables']['projects']['Row']

interface UseRealtimeProjectsOptions {
  userId?: string
  autoRefresh?: boolean
  includeMembers?: boolean
}

interface ProjectWithMembers extends Project {
  project_members?: Array<{
    role: string
    profiles: {
      id: string
      name: string
      email: string
      role: string
    } | null
  }>
}

export function useRealtimeProjects(options: UseRealtimeProjectsOptions = {}) {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial projects data
  const fetchProjects = useCallback(async () => {
    if (!options.userId) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      const result = await supabaseDatabase.getProjectsForUser(options.userId)

      if (result.error) {
        setError(result.error.message)
      } else {
        setProjects(result.data as ProjectWithMembers[])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [options.userId])

  // Handle real-time project updates
  const handleProjectUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setProjects(current => {
      switch (eventType) {
        case 'INSERT':
          // Add new project if user has access (handled by RLS)
          if (!current.find(p => p.id === newRecord.id)) {
            return [...current, newRecord]
          }
          return current

        case 'UPDATE':
          // Update existing project
          return current.map(project =>
            project.id === newRecord.id
              ? { ...project, ...newRecord }
              : project
          )

        case 'DELETE':
          // Remove deleted project
          return current.filter(project => project.id !== oldRecord.id)

        default:
          return current
      }
    })

    // Show notification for significant project changes
    if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
      showProjectStatusNotification(newRecord)
    }
  }, [])

  // Handle project member changes
  const handleMemberUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setProjects(current => {
      return current.map(project => {
        if (project.id === (newRecord?.project_id || oldRecord?.project_id)) {
          // Refresh project members for this project
          // In a real implementation, you might fetch updated member data
          return { ...project, updated_at: new Date().toISOString() }
        }
        return project
      })
    })

    // Handle member additions/removals
    if (eventType === 'INSERT' && newRecord.user_id === options.userId) {
      // User was added to a new project - refetch all projects
      fetchProjects()
    } else if (eventType === 'DELETE' && oldRecord.user_id === options.userId) {
      // User was removed from a project
      setProjects(current => 
        current.filter(project => project.id !== oldRecord.project_id)
      )
    }
  }, [options.userId, fetchProjects])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!options.userId) return

    let unsubscribeConnection: (() => void) | undefined

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
      unsubscribeConnection?.()
    }
  }, [options.userId])

  // Fetch initial data
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Auto-refresh functionality
  useEffect(() => {
    if (!options.autoRefresh) return

    const interval = setInterval(() => {
      fetchProjects()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [options.autoRefresh, fetchProjects])

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true)
    fetchProjects()
  }, [fetchProjects])

  // Create new project with optimistic updates
  const createProject = useCallback(async (projectData: {
    name: string
    description?: string
    start_date: string
    end_date?: string
    latitude?: number
    longitude?: number
    address?: string
  }) => {
    if (!options.userId) {
      throw new Error('User ID is required to create project')
    }

    try {
      const result = await supabaseDatabase.createProject(projectData, options.userId)

      if (result.error) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to create project')
      }

      // The real-time subscription will handle adding the new project to the list
      return result.data
    } catch (error) {
      throw error
    }
  }, [options.userId])

  // Update project with optimistic updates
  const updateProject = useCallback(async (
    projectId: string,
    updates: Partial<any>
  ) => {
    try {
      // Optimistic update
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, ...updates, updated_at: new Date().toISOString() }
          : project
      ))

      const result = await supabaseDatabase.updateProject(projectId, updates)
      
      if (result.error) {
        // Revert optimistic update on error
        await fetchProjects()
        throw new Error('Failed to update project')
      }

      return result.data
    } catch (error) {
      // Revert optimistic update on error
      await fetchProjects()
      throw error
    }
  }, [fetchProjects])

  // Get projects by status
  const getProjectsByStatus = useCallback((status: Project['status']) => {
    return projects.filter(project => project.status === status)
  }, [projects])

  // Get projects where user is project manager
  const getManagedProjects = useCallback(() => {
    return projects.filter(project => 
      project.project_members?.some(member => 
        member.profiles?.id === options.userId && 
        member.role === 'PROJECT_MANAGER'
      )
    )
  }, [projects, options.userId])

  // Get projects with upcoming deadlines
  const getProjectsWithUpcomingDeadlines = useCallback((days: number = 7) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)

    return projects.filter(project => 
      project.end_date && 
      new Date(project.end_date) <= cutoffDate &&
      project.status === 'ACTIVE'
    )
  }, [projects])

  return {
    projects,
    loading,
    error,
    isConnected,

    // Actions
    refresh,
    createProject,
    updateProject,

    // Filters
    getProjectsByStatus,
    getManagedProjects,
    getProjectsWithUpcomingDeadlines,

    // Statistics
    stats: {
      total: projects.length,
      active: projects.filter(p => p.status === 'ACTIVE').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      onHold: projects.filter(p => p.status === 'ON_HOLD').length,
      cancelled: projects.filter(p => p.status === 'CANCELLED').length,
      managed: projects.filter(project => 
        project.project_members?.some(member => 
          member.profiles?.id === options.userId && 
          member.role === 'PROJECT_MANAGER'
        )
      ).length,
    }
  }
}

// Helper function to show project status change notifications
function showProjectStatusNotification(project: Project) {
  const statusMessages = {
    ACTIVE: 'Project is now active',
    COMPLETED: 'Project completed successfully ✅',
    ON_HOLD: 'Project put on hold ⏸️',
    CANCELLED: 'Project cancelled ❌',
  }

  const message = statusMessages[project.status] || `Project status updated to ${project.status}`
  
  console.log(`🔔 ${project.name}: ${message}`)
  
  // Dispatch custom event for toast notifications
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('project-status-changed', {
      detail: { project, message }
    }))
  }
}