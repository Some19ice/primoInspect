'use client'

import { supabase } from '@/lib/supabase/client'
import { supabaseDatabase } from '@/lib/supabase/database'

interface SyncItem {
  id: string
  type: 'inspection' | 'evidence' | 'approval'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
  error?: string
}

interface OfflineData {
  inspections: any[]
  projects: any[]
  checklists: any[]
  evidence: any[]
  lastSync: number
}

class OfflineSyncManager {
  private syncQueue: SyncItem[] = []
  private isOnline: boolean = true
  private syncInterval: NodeJS.Timeout | null = null
  private readonly STORAGE_KEYS = {
    SYNC_QUEUE: 'primoinspect_sync_queue',
    OFFLINE_DATA: 'primoinspect_offline_data',
    LAST_SYNC: 'primoinspect_last_sync'
  }

  constructor() {
    this.initializeSync()
  }

  /**
   * Initialize offline sync functionality
   */
  private initializeSync() {
    // Load persisted sync queue
    this.loadSyncQueue()
    
    // Monitor online/offline status
    this.setupNetworkListeners()
    
    // Start periodic sync
    this.startPeriodicSync()
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      
      window.addEventListener('online', () => {
        console.log('📡 Network connection restored')
        this.isOnline = true
        this.syncToServer()
      })
      
      window.addEventListener('offline', () => {
        console.log('📴 Network connection lost - switching to offline mode')
        this.isOnline = false
      })
    }
  }

  /**
   * Start periodic sync when online
   */
  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncToServer()
      }
    }, 30000) // Sync every 30 seconds
  }

  /**
   * Load sync queue from local storage
   */
  private loadSyncQueue() {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE)
      if (stored) {
        this.syncQueue = JSON.parse(stored)
        console.log(`📋 Loaded ${this.syncQueue.length} items from sync queue`)
      }
    } catch (error) {
      console.error('Error loading sync queue:', error)
      this.syncQueue = []
    }
  }

  /**
   * Persist sync queue to local storage
   */
  private persistSyncQueue() {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Error persisting sync queue:', error)
    }
  }

  /**
   * Add item to sync queue
   */
  addToSyncQueue(type: SyncItem['type'], action: SyncItem['action'], data: any): string {
    const syncItem: SyncItem = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    this.syncQueue.push(syncItem)
    this.persistSyncQueue()

    console.log(`📤 Added ${type} ${action} to sync queue`)

    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => this.syncToServer(), 1000)
    }

    return syncItem.id
  }

  /**
   * Sync queued items to server
   */
  async syncToServer(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return { success: 0, failed: 0 }
    }

    console.log(`🔄 Syncing ${this.syncQueue.length} items to server`)

    let successCount = 0
    let failedCount = 0
    const itemsToRemove: string[] = []

    // Process sync queue
    for (const item of this.syncQueue) {
      try {
        const success = await this.syncSingleItem(item)
        
        if (success) {
          successCount++
          itemsToRemove.push(item.id)
        } else {
          failedCount++
          item.retries++
          
          // Remove items that have failed too many times
          if (item.retries > 5) {
            console.error(`❌ Removing failed sync item after 5 retries:`, item)
            itemsToRemove.push(item.id)
          }
        }
      } catch (error) {
        failedCount++
        item.error = error instanceof Error ? error.message : 'Unknown error'
        item.retries++
        
        if (item.retries > 5) {
          itemsToRemove.push(item.id)
        }
      }
    }

    // Remove successfully synced and permanently failed items
    this.syncQueue = this.syncQueue.filter(item => !itemsToRemove.includes(item.id))
    this.persistSyncQueue()

    console.log(`✅ Sync completed: ${successCount} success, ${failedCount} failed`)
    
    return { success: successCount, failed: failedCount }
  }

  /**
   * Sync a single item to the server
   */
  private async syncSingleItem(item: SyncItem): Promise<boolean> {
    try {
      switch (item.type) {
        case 'inspection':
          return await this.syncInspection(item)
        case 'evidence':
          return await this.syncEvidence(item)
        case 'approval':
          return await this.syncApproval(item)
        default:
          console.error('Unknown sync item type:', item.type)
          return false
      }
    } catch (error) {
      console.error(`Error syncing ${item.type} ${item.action}:`, error)
      return false
    }
  }

  /**
   * Sync inspection data
   */
  private async syncInspection(item: SyncItem): Promise<boolean> {
    switch (item.action) {
      case 'create':
        const { data: inspection, error: createError } = await supabaseDatabase.createInspection(item.data)
        return !createError
        
      case 'update':
        const { data: updatedInspection, error: updateError } = await supabaseDatabase.updateInspection(item.id!, item.data)
        return !updateError
        
      case 'delete':
        const { data: deletedInspection, error: deleteError } = await supabaseDatabase.deleteInspection(item.id!)
        return !deleteError
        
      default:
        return false
    }
  }

  /**
   * Sync evidence data
   */
  private async syncEvidence(item: SyncItem): Promise<boolean> {
    switch (item.action) {
      case 'create':
        const { data: evidence, error: createError } = await supabaseDatabase.createEvidence(item.data)
        return !createError
        
      case 'update':
        const { data: updatedEvidence, error: updateError } = await supabaseDatabase.updateEvidence(item.id!, item.data)
        return !updateError
        
      case 'delete':
        const { data: deletedEvidence, error: deleteError } = await supabaseDatabase.deleteEvidence(item.id!)
        return !deleteError
        
      default:
        return false
    }
  }

  /**
   * Sync approval data
   */
  private async syncApproval(item: SyncItem): Promise<boolean> {
    switch (item.action) {
      case 'create':
        const { data: approval, error: createError } = await supabaseDatabase.createApproval(item.data)
        return !createError
        
      case 'update':
        const { data: updatedApproval, error: updateError } = await supabaseDatabase.updateApproval(item.id!, item.data)
        return !updateError
        
      default:
        return false
    }
  }

  /**
   * Download and cache data for offline use
   */
  async cacheDataForOffline(userId: string, userRole: string = 'INSPECTOR'): Promise<OfflineData> {
    if (!this.isOnline) {
      console.log('📴 Cannot cache data while offline')
      return this.getOfflineData()
    }

    try {
      console.log('📥 Caching data for offline use...')

      // Fetch essential data
      const [
        inspectionsResult,
        projectsResult,
        checklistsResult,
        evidenceResult
      ] = await Promise.allSettled([
        supabaseDatabase.getInspectionsForUser(userId, userRole),
        supabaseDatabase.getProjectsForUser(userId),
        supabaseDatabase.getChecklists(),
        supabaseDatabase.getEvidenceForUser(userId)
      ])

      const offlineData: OfflineData = {
        inspections: inspectionsResult.status === 'fulfilled' ? inspectionsResult.value.data || [] : [],
        projects: projectsResult.status === 'fulfilled' ? projectsResult.value.data || [] : [],
        checklists: checklistsResult.status === 'fulfilled' ? checklistsResult.value.data || [] : [],
        evidence: evidenceResult.status === 'fulfilled' ? evidenceResult.value.data || [] : [],
        lastSync: Date.now()
      }

      // Store in local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData))
        localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString())
      }

      console.log('✅ Data cached for offline use')
      return offlineData
    } catch (error) {
      console.error('Error caching offline data:', error)
      return this.getOfflineData()
    }
  }

  /**
   * Get cached offline data
   */
  getOfflineData(): OfflineData {
    const defaultData: OfflineData = {
      inspections: [],
      projects: [],
      checklists: [],
      evidence: [],
      lastSync: 0
    }

    if (typeof window === 'undefined') return defaultData

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.OFFLINE_DATA)
      return stored ? JSON.parse(stored) : defaultData
    } catch (error) {
      console.error('Error loading offline data:', error)
      return defaultData
    }
  }

  /**
   * Get sync queue status
   */
  getSyncStatus() {
    const pending = this.syncQueue.filter(item => item.retries === 0).length
    const retrying = this.syncQueue.filter(item => item.retries > 0).length
    const lastSync = typeof window !== 'undefined' 
      ? parseInt(localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC) || '0')
      : 0

    return {
      isOnline: this.isOnline,
      queueSize: this.syncQueue.length,
      pending,
      retrying,
      lastSync: lastSync ? new Date(lastSync) : null
    }
  }

  /**
   * Force sync now
   */
  async forcSync(): Promise<{ success: number; failed: number }> {
    console.log('🚀 Force sync requested')
    return await this.syncToServer()
  }

  /**
   * Clear sync queue (use with caution)
   */
  clearSyncQueue() {
    this.syncQueue = []
    this.persistSyncQueue()
    console.log('🗑️ Sync queue cleared')
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager()

// Export utilities for React components
export function useOfflineSync() {
  return {
    addToQueue: offlineSyncManager.addToSyncQueue.bind(offlineSyncManager),
    syncNow: offlineSyncManager.forcSync.bind(offlineSyncManager),
    getStatus: offlineSyncManager.getSyncStatus.bind(offlineSyncManager),
    cacheData: offlineSyncManager.cacheDataForOffline.bind(offlineSyncManager),
    getOfflineData: offlineSyncManager.getOfflineData.bind(offlineSyncManager),
    clearQueue: offlineSyncManager.clearSyncQueue.bind(offlineSyncManager)
  }
}

export default offlineSyncManager