'use client'

import { supabase } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeCallback<T = any> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  errors: any
}) => void

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()

  // T022 - Inspection status change subscriptions
  subscribeToInspectionChanges(
    inspectionId: string,
    callback: RealtimeCallback
  ): () => void {
    const channelName = `inspection:${inspectionId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspections',
          filter: `id=eq.${inspectionId}`
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  // T024 - Evidence upload real-time notifications
  subscribeToEvidenceChanges(
    inspectionId: string,
    callback: RealtimeCallback
  ): () => void {
    const channelName = `evidence:${inspectionId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence',
          filter: `inspection_id=eq.${inspectionId}`
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  // T025 - Approval workflow notifications
  subscribeToApprovalChanges(
    inspectionId: string,
    callback: RealtimeCallback
  ): () => void {
    const channelName = `approvals:${inspectionId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approvals',
          filter: `inspection_id=eq.${inspectionId}`
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  // T026 - Project-level subscriptions
  subscribeToProjectChanges(
    projectId: string,
    callback: RealtimeCallback
  ): () => void {
    const channelName = `project:${projectId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspections',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  // T023 - Notifications service
  subscribeToUserNotifications(
    userId: string,
    callback: RealtimeCallback
  ): () => void {
    const channelName = `notifications:${userId}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  // T027 - Offline/online state management
  subscribeToConnectionState(
    callback: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED') => void
  ): () => void {
    const channelName = 'connection_state'
    
    const channel = supabase
      .channel(channelName)
      .on('system', {}, (payload) => {
        callback(payload.status)
      })
      .subscribe()

    this.channels.set(channelName, channel)

    return () => this.unsubscribe(channelName)
  }

  private unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }
}

export const realtimeService = new RealtimeService()
