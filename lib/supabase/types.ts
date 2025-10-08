export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          approver_id: string
          attachments: Json | null
          created_at: string | null
          decision: string
          escalation_reason: string | null
          id: string
          inspection_id: string
          is_escalated: boolean | null
          notes: string
          previous_approval_id: string | null
          review_date: string | null
        }
        Insert: {
          approver_id: string
          attachments?: Json | null
          created_at?: string | null
          decision: string
          escalation_reason?: string | null
          id?: string
          inspection_id: string
          is_escalated?: boolean | null
          notes: string
          previous_approval_id?: string | null
          review_date?: string | null
        }
        Update: {
          approver_id?: string
          attachments?: Json | null
          created_at?: string | null
          decision?: string
          escalation_reason?: string | null
          id?: string
          inspection_id?: string
          is_escalated?: boolean | null
          notes?: string
          previous_approval_id?: string | null
          review_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_previous_approval_id_fkey"
            columns: ["previous_approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string
          questions: Json
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id: string
          questions?: Json
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string
          questions?: Json
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_resolutions: {
        Row: {
          assigned_manager_id: string | null
          conflict_type: string
          created_at: string | null
          description: string
          id: string
          inspection_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          triggered_by_evidence_ids: string[]
          updated_at: string | null
        }
        Insert: {
          assigned_manager_id?: string | null
          conflict_type: string
          created_at?: string | null
          description: string
          id?: string
          inspection_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          triggered_by_evidence_ids: string[]
          updated_at?: string | null
        }
        Update: {
          assigned_manager_id?: string | null
          conflict_type?: string
          created_at?: string | null
          description?: string
          id?: string
          inspection_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          triggered_by_evidence_ids?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conflict_resolutions_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_resolutions_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_queue: {
        Row: {
          created_at: string | null
          escalation_reason: string
          escalation_threshold_hours: number | null
          expires_at: string | null
          id: string
          inspection_id: string
          manager_last_seen: string | null
          notification_count: number | null
          original_manager_id: string
          priority_level: string | null
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          escalation_reason: string
          escalation_threshold_hours?: number | null
          expires_at?: string | null
          id?: string
          inspection_id: string
          manager_last_seen?: string | null
          notification_count?: number | null
          original_manager_id: string
          priority_level?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          escalation_reason?: string
          escalation_threshold_hours?: number | null
          expires_at?: string | null
          id?: string
          inspection_id?: string
          manager_last_seen?: string | null
          notification_count?: number | null
          original_manager_id?: string
          priority_level?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_queue_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_queue_original_manager_id_fkey"
            columns: ["original_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          accuracy: number | null
          annotations: Json | null
          created_at: string | null
          file_size: number
          filename: string
          id: string
          inspection_id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          mime_type: string
          original_name: string
          public_url: string | null
          question_id: string | null
          storage_path: string | null
          thumbnail_url: string | null
          timestamp: string
          uploaded_by: string
          url: string
          verified: boolean | null
        }
        Insert: {
          accuracy?: number | null
          annotations?: Json | null
          created_at?: string | null
          file_size: number
          filename: string
          id?: string
          inspection_id: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          mime_type: string
          original_name: string
          public_url?: string | null
          question_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          timestamp: string
          uploaded_by: string
          url: string
          verified?: boolean | null
        }
        Update: {
          accuracy?: number | null
          annotations?: Json | null
          created_at?: string | null
          file_size?: number
          filename?: string
          id?: string
          inspection_id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          mime_type?: string
          original_name?: string
          public_url?: string | null
          question_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          timestamp?: string
          uploaded_by?: string
          url?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          accuracy: number | null
          address: string | null
          assigned_to: string
          checklist_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          priority: string | null
          project_id: string
          rejection_count: number | null
          responses: Json | null
          status: string | null
          submitted_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          address?: string | null
          assigned_to: string
          checklist_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          priority?: string | null
          project_id: string
          rejection_count?: number | null
          responses?: Json | null
          status?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          address?: string | null
          assigned_to?: string
          checklist_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          priority?: string | null
          project_id?: string
          rejection_count?: number | null
          responses?: Json | null
          status?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_channel: string | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          related_entity_id: string
          related_entity_type: string
          scheduled_for: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          related_entity_id: string
          related_entity_type: string
          scheduled_for?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_channel?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          related_entity_id?: string
          related_entity_type?: string
          scheduled_for?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          expires_at: string | null
          filters: Json
          format: string
          generated_at: string | null
          generated_by: string
          id: string
          project_id: string
          status: string | null
          template_id: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          filters: Json
          format: string
          generated_at?: string | null
          generated_by: string
          id?: string
          project_id: string
          status?: string | null
          template_id?: string | null
          title: string
          type: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          filters?: Json
          format?: string
          generated_at?: string | null
          generated_by?: string
          id?: string
          project_id?: string
          status?: string | null
          template_id?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_transitions: {
        Row: {
          affected_projects: string[] | null
          approved_by: string | null
          created_at: string | null
          effective_date: string | null
          from_role: string
          id: string
          new_projects_only: boolean | null
          status: string | null
          to_role: string
          transition_type: string | null
          user_id: string
        }
        Insert: {
          affected_projects?: string[] | null
          approved_by?: string | null
          created_at?: string | null
          effective_date?: string | null
          from_role: string
          id?: string
          new_projects_only?: boolean | null
          status?: string | null
          to_role: string
          transition_type?: string | null
          user_id: string
        }
        Update: {
          affected_projects?: string[] | null
          approved_by?: string | null
          created_at?: string | null
          effective_date?: string | null
          from_role?: string
          id?: string
          new_projects_only?: boolean | null
          status?: string | null
          to_role?: string
          transition_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_transitions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_transitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
  }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
