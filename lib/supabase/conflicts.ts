import { supabase } from './client'
import { Database } from './types'
import { supabaseDatabase } from './database'

type ConflictResolution = Database['public']['Tables']['conflict_resolutions']['Row']
type Evidence = Database['public']['Tables']['evidence']['Row']

export class ConflictDetectionService {
  // Helper method to work around TypeScript issues
  private get db() {
    return supabase as any
  }

  /**
   * Detect conflicts when new evidence is submitted
   * Manager-mediated conflict resolution (Session 2025-01-27)
   */
  async detectConflict(inspectionId: string, newEvidence: Evidence): Promise<ConflictResolution | null> {
    try {
      // Get recent evidence submissions within 5-minute window
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const { data: recentEvidence, error } = await this.db
        .from('evidence')
        .select('*')
        .eq('inspection_id', inspectionId)
        .gte('created_at', fiveMinutesAgo)
        .neq('id', newEvidence.id)

      if (error) {
        console.error('Error fetching recent evidence:', error)
        return null
      }

      // Check for potential conflicts
      if (recentEvidence && recentEvidence.length > 0) {
        const conflictTypes = this.analyzeConflictType(newEvidence, recentEvidence)
        
        if (conflictTypes.length > 0) {
          return await this.createConflictResolution(
            inspectionId,
            [newEvidence.id, ...recentEvidence.map((e: any) => e.id)],
            conflictTypes[0] as 'EVIDENCE_DISPUTE' | 'STATUS_CONFLICT' | 'LOCATION_MISMATCH', // Use primary conflict type
            `Multiple evidence submissions detected within 5-minute window: ${conflictTypes.join(', ')}`
          )
        }
      }

      return null
    } catch (error) {
      console.error('Error in conflict detection:', error)
      return null
    }
  }

  /**
   * Analyze the type of conflict between evidence submissions
   */
  private analyzeConflictType(newEvidence: Evidence, existingEvidence: Evidence[]): string[] {
    const conflicts: string[] = []

    for (const existing of existingEvidence) {
      // Evidence dispute: Different mime types for same inspection
      if (existing.mime_type !== newEvidence.mime_type) {
        conflicts.push('EVIDENCE_DISPUTE')
      }

      // Location mismatch: Significant difference in coordinates
      if (existing.latitude && existing.longitude && 
          newEvidence.latitude && newEvidence.longitude) {
        const distance = this.calculateDistance(
          existing.latitude, existing.longitude,
          newEvidence.latitude, newEvidence.longitude
        )
        
        // If evidence locations are more than 100 meters apart
        if (distance > 0.1) { // 0.1 km = 100 meters
          conflicts.push('LOCATION_MISMATCH')
        }
      }
    }

    // Default to evidence dispute if no specific conflict detected
    if (conflicts.length === 0) {
      conflicts.push('EVIDENCE_DISPUTE')
    }

    return [...new Set(conflicts)] // Remove duplicates
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  /**
   * Create a conflict resolution record
   */
  async createConflictResolution(
    inspectionId: string,
    evidenceIds: string[],
    conflictType: 'EVIDENCE_DISPUTE' | 'STATUS_CONFLICT' | 'LOCATION_MISMATCH',
    description: string
  ): Promise<ConflictResolution | null> {
    try {
      // Find project manager for this inspection
      const { data: inspection } = await this.db
        .from('inspections')
        .select(`
          *,
          projects!inner(
            id,
            project_members!inner(
              user_id,
              role,
              profiles!inner(id, name, email)
            )
          )
        `)
        .eq('id', inspectionId)
        .single()

      if (!inspection) {
        console.error('Inspection not found for conflict resolution')
        return null
      }

      // Find project manager
      const projectManagers = (inspection as any).projects.project_members
        .filter((pm: any) => pm.role === 'PROJECT_MANAGER')
      
      const assignedManagerId = projectManagers.length > 0 ? projectManagers[0].user_id : null

      // Create conflict resolution record
      const { data: conflict, error } = await this.db
        .from('conflict_resolutions')
        .insert({
          inspection_id: inspectionId,
          triggered_by_evidence_ids: evidenceIds,
          conflict_type: conflictType,
          description,
          status: 'PENDING',
          assigned_manager_id: assignedManagerId
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conflict resolution:', error)
        return null
      }

      // Trigger real-time notification to project managers
      if (assignedManagerId) {
        await this.notifyManagerOfConflict(assignedManagerId, conflict, inspectionId)
      }

      return conflict
    } catch (error) {
      console.error('Error creating conflict resolution:', error)
      return null
    }
  }

  /**
   * Notify project manager of conflict with real-time notification
   */
  private async notifyManagerOfConflict(
    managerId: string, 
    conflict: ConflictResolution, 
    inspectionId: string
  ) {
    try {
      await supabaseDatabase.createNotification({
        user_id: managerId,
        type: 'ESCALATION',
        title: 'Evidence Conflict Detected',
        message: `Conflicting evidence submissions require your attention for inspection ${inspectionId}`,
        related_entity_type: 'INSPECTION',
        related_entity_id: inspectionId,
        priority: 'HIGH'
      })

      console.log(`✅ Conflict notification sent to manager ${managerId}`)
    } catch (error) {
      console.error('Error sending conflict notification:', error)
    }
  }

  /**
   * Resolve a conflict with manager decision
   */
  async resolveConflict(
    conflictId: string,
    managerId: string,
    resolution: 'APPROVED' | 'REJECTED',
    notes: string,
    keepEvidenceIds: string[]
  ): Promise<boolean> {
    try {
      // Update conflict resolution status
      const { error: updateError } = await this.db
        .from('conflict_resolutions')
        .update({
          status: 'RESOLVED',
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conflictId)
        .eq('assigned_manager_id', managerId) // Ensure only assigned manager can resolve

      if (updateError) {
        console.error('Error updating conflict resolution:', updateError)
        return false
      }

      // If rejected, we could mark disputed evidence as rejected
      // For now, we'll just log the resolution
      console.log(`✅ Conflict ${conflictId} resolved by manager ${managerId}: ${resolution}`)
      console.log(`Kept evidence IDs: ${keepEvidenceIds.join(', ')}`)

      return true
    } catch (error) {
      console.error('Error resolving conflict:', error)
      return false
    }
  }

  /**
   * Get conflicts for a project manager
   */
  async getManagerConflicts(managerId: string, status?: string): Promise<ConflictResolution[]> {
    try {
      let query = this.db
        .from('conflict_resolutions')
        .select(`
          *,
          inspections!inner(
            id,
            title,
            projects!inner(id, name)
          )
        `)
        .eq('assigned_manager_id', managerId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching manager conflicts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getManagerConflicts:', error)
      return []
    }
  }

  /**
   * Get conflict details with related evidence
   */
  async getConflictDetails(conflictId: string): Promise<any> {
    try {
      const { data: conflict, error } = await this.db
        .from('conflict_resolutions')
        .select(`
          *,
          inspections!inner(
            id,
            title,
            projects!inner(id, name)
          )
        `)
        .eq('id', conflictId)
        .single()

      if (error || !conflict) {
        console.error('Error fetching conflict details:', error)
        return null
      }

      // Get related evidence
      const { data: evidence, error: evidenceError } = await this.db
        .from('evidence')
        .select('*')
        .in('id', conflict.triggered_by_evidence_ids)

      if (evidenceError) {
        console.error('Error fetching conflict evidence:', evidenceError)
      }

      return {
        ...conflict,
        evidence: evidence || []
      }
    } catch (error) {
      console.error('Error in getConflictDetails:', error)
      return null
    }
  }
}

export const conflictDetectionService = new ConflictDetectionService()