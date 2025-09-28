export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR'
          avatar: string | null
          is_active: boolean
          created_at: string
          last_login_at: string | null
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR'
          avatar?: string | null
          is_active?: boolean
          created_at?: string
          last_login_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR'
          avatar?: string | null
          is_active?: boolean
          created_at?: string
          last_login_at?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
          start_date: string
          end_date: string | null
          latitude: number | null
          longitude: number | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
          start_date: string
          end_date?: string | null
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
          start_date?: string
          end_date?: string | null
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          project_id: string
          checklist_id: string
          assigned_to: string
          title: string
          description: string | null
          status: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
          priority: 'LOW' | 'MEDIUM' | 'HIGH'
          due_date: string | null
          latitude: number | null
          longitude: number | null
          accuracy: number | null
          address: string | null
          responses: Json
          rejection_count: number
          created_at: string
          updated_at: string
          submitted_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          checklist_id: string
          assigned_to: string
          title: string
          description?: string | null
          status?: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH'
          due_date?: string | null
          latitude?: number | null
          longitude?: number | null
          accuracy?: number | null
          address?: string | null
          responses?: Json
          rejection_count?: number
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          checklist_id?: string
          assigned_to?: string
          title?: string
          description?: string | null
          status?: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH'
          due_date?: string | null
          latitude?: number | null
          longitude?: number | null
          accuracy?: number | null
          address?: string | null
          responses?: Json
          rejection_count?: number
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          completed_at?: string | null
        }
      }
      evidence: {
        Row: {
          id: string
          inspection_id: string
          uploaded_by: string
          filename: string
          original_name: string
          mime_type: string
          file_size: number
          url: string
          thumbnail_url: string | null
          latitude: number | null
          longitude: number | null
          accuracy: number | null
          timestamp: string
          verified: boolean
          annotations: Json | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          uploaded_by: string
          filename: string
          original_name: string
          mime_type: string
          file_size: number
          url: string
          thumbnail_url?: string | null
          latitude?: number | null
          longitude?: number | null
          accuracy?: number | null
          timestamp: string
          verified?: boolean
          annotations?: Json | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          uploaded_by?: string
          filename?: string
          original_name?: string
          mime_type?: string
          file_size?: number
          url?: string
          thumbnail_url?: string | null
          latitude?: number | null
          longitude?: number | null
          accuracy?: number | null
          timestamp?: string
          verified?: boolean
          annotations?: Json | null
          metadata?: Json | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'APPROVAL_REQUIRED' | 'ESCALATION' | 'REPORT_READY'
          title: string
          message: string
          related_entity_type: 'INSPECTION' | 'PROJECT' | 'APPROVAL' | 'REPORT'
          related_entity_id: string
          is_read: boolean
          priority: 'LOW' | 'MEDIUM' | 'HIGH'
          delivery_channel: 'IN_APP' | 'EMAIL' | 'PUSH'
          scheduled_for: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'APPROVAL_REQUIRED' | 'ESCALATION' | 'REPORT_READY'
          title: string
          message: string
          related_entity_type: 'INSPECTION' | 'PROJECT' | 'APPROVAL' | 'REPORT'
          related_entity_id: string
          is_read?: boolean
          priority?: 'LOW' | 'MEDIUM' | 'HIGH'
          delivery_channel?: 'IN_APP' | 'EMAIL' | 'PUSH'
          scheduled_for?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'APPROVAL_REQUIRED' | 'ESCALATION' | 'REPORT_READY'
          title?: string
          message?: string
          related_entity_type?: 'INSPECTION' | 'PROJECT' | 'APPROVAL' | 'REPORT'
          related_entity_id?: string
          is_read?: boolean
          priority?: 'LOW' | 'MEDIUM' | 'HIGH'
          delivery_channel?: 'IN_APP' | 'EMAIL' | 'PUSH'
          scheduled_for?: string | null
          delivered_at?: string | null
          created_at?: string
        }
      }
      // Enhanced Operational Workflow Tables (Session 2025-01-27)
      conflict_resolutions: {
        Row: {
          id: string
          inspection_id: string
          triggered_by_evidence_ids: string[]
          conflict_type: 'EVIDENCE_DISPUTE' | 'STATUS_CONFLICT' | 'LOCATION_MISMATCH'
          description: string
          status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED'
          assigned_manager_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          triggered_by_evidence_ids: string[]
          conflict_type: 'EVIDENCE_DISPUTE' | 'STATUS_CONFLICT' | 'LOCATION_MISMATCH'
          description: string
          status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED'
          assigned_manager_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          triggered_by_evidence_ids?: string[]
          conflict_type?: 'EVIDENCE_DISPUTE' | 'STATUS_CONFLICT' | 'LOCATION_MISMATCH'
          description?: string
          status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED'
          assigned_manager_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escalation_queue: {
        Row: {
          id: string
          inspection_id: string
          original_manager_id: string
          escalation_reason: string
          priority_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status: 'QUEUED' | 'NOTIFIED' | 'RESOLVED' | 'EXPIRED'
          manager_last_seen: string | null
          escalation_threshold_hours: number
          notification_count: number
          created_at: string
          expires_at: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          inspection_id: string
          original_manager_id: string
          escalation_reason: string
          priority_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status?: 'QUEUED' | 'NOTIFIED' | 'RESOLVED' | 'EXPIRED'
          manager_last_seen?: string | null
          escalation_threshold_hours?: number
          notification_count?: number
          created_at?: string
          expires_at?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          inspection_id?: string
          original_manager_id?: string
          escalation_reason?: string
          priority_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          status?: 'QUEUED' | 'NOTIFIED' | 'RESOLVED' | 'EXPIRED'
          manager_last_seen?: string | null
          escalation_threshold_hours?: number
          notification_count?: number
          created_at?: string
          expires_at?: string | null
          resolved_at?: string | null
        }
      }
      role_transitions: {
        Row: {
          id: string
          user_id: string
          from_role: string
          to_role: string
          effective_date: string
          transition_type: 'PROJECT_BOUNDARY' | 'IMMEDIATE' | 'SCHEDULED'
          affected_projects: string[] | null
          new_projects_only: boolean
          approved_by: string | null
          status: 'PENDING' | 'ACTIVE' | 'COMPLETED'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_role: string
          to_role: string
          effective_date?: string
          transition_type?: 'PROJECT_BOUNDARY' | 'IMMEDIATE' | 'SCHEDULED'
          affected_projects?: string[] | null
          new_projects_only?: boolean
          approved_by?: string | null
          status?: 'PENDING' | 'ACTIVE' | 'COMPLETED'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_role?: string
          to_role?: string
          effective_date?: string
          transition_type?: 'PROJECT_BOUNDARY' | 'IMMEDIATE' | 'SCHEDULED'
          affected_projects?: string[] | null
          new_projects_only?: boolean
          approved_by?: string | null
          status?: 'PENDING' | 'ACTIVE' | 'COMPLETED'
          created_at?: string
        }
      }
    }
  }
}
