import { supabase } from './client'
import { createServerClient } from '@supabase/ssr'
import { Database } from './types'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import page from '@/app/page'
import { number } from 'zod'
import { number } from 'zod'
import page from '@/app/page'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { boolean } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { boolean } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { error } from 'console'
import { number } from 'zod'
import { number } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { any } from 'zod'
import { any } from 'zod'
import { boolean } from 'zod'
import { string } from 'zod'
import { any } from 'zod'
import { string } from 'zod'
import { number } from 'zod'
import { number } from 'zod'
import { number } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { number } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { any } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { number } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import page from '@/app/page'
import { number } from 'zod'
import { number } from 'zod'
import page from '@/app/page'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { boolean } from 'zod'
import { string } from 'zod'
import { any } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { number } from 'zod'
import { number } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { number } from 'zod'
import { number } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import { string } from 'zod'
import page from '@/app/page'
import page from '@/app/page'

// Create service role client for server-side operations (only call on server)
function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Service role client should only be used on server side')
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      cookies: {
        get: () => undefined,
        set: () => { },
        remove: () => { }
      }
    }
  )
}

type Tables = Database['public']['Tables']
type Profile = Tables['profiles']['Row']
type Project = Tables['projects']['Row']
type Inspection = Tables['inspections']['Row']
type Evidence = Tables['evidence']['Row']
type Notification = Tables['notifications']['Row']

// Database abstraction layer for Supabase
export class SupabaseDatabaseService {
  // Helper method to work around TypeScript issues with Supabase
  private get db() {
    return supabase as any
  }

  // ===== PROFILE QUERIES =====
  
  async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  }

  async updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'created_at'>>) {
    const { data, error } = await this.db
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  }

  // ===== PROJECT QUERIES =====

  async getProjectsForUser(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit

    // First get project IDs where user is a member
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select('project_id, role')
      .eq('user_id', userId)

    if (memberError) {
      return {
        data: [],
        error: memberError,
        pagination: { page, limit, total: 0, hasNext: false, hasPrev: false }
      }
    }

    if (!memberProjects || memberProjects.length === 0) {
      return {
        data: [],
        error: null,
        pagination: { page, limit, total: 0, hasNext: false, hasPrev: false }
      }
    }

    const projectIds = memberProjects.map(mp => mp.project_id)

    // Get projects with count
    const { data: projects, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .in('id', projectIds)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Add member role to each project
    const projectsWithRoles = projects?.map(project => ({
      ...project,
      memberRole: memberProjects.find(mp => mp.project_id === project.id)?.role
    })) || []

    return {
      data: projectsWithRoles,
      error,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    }
  }

  async getProjectById(projectId: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()

      // Get project details
      const { data: project, error: projectError } = await supabaseService
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError || !project) {
        return { data: null, error: projectError }
      }

      // Get project members separately
      const { data: members, error: membersError } = await supabaseService
        .from('project_members')
        .select(`
          role,
          profiles(id, name, email, role)
        `)
        .eq('project_id', projectId)

      if (membersError) {
        return { data: project, error: null } // Return project without members if members query fails
      }

      return {
        data: {
          ...project,
          project_members: members || []
        },
        error: null
      }
    } catch (error) {
      console.error('Error in getProjectById:', error)
      return { data: null, error }
    }
  }

  async createProject(projectData: {
    name: string
    description?: string
    start_date: string
    end_date?: string
    latitude?: number
    longitude?: number
    address?: string
  }, creatorId: string) {
    try {
      // Create the project using service role client to bypass RLS
      const supabaseService = createServiceRoleClient()
      const { data: project, error: projectError } = await supabaseService
        .from('projects')
        .insert(projectData as any)
        .select()
        .single()

      if (projectError) {
        return { data: null, error: projectError }
      }

      // Add creator as project manager using service role client
      const { error: memberError } = await supabaseService
        .from('project_members')
        .insert({
          project_id: (project as any).id,
          user_id: creatorId,
          role: 'PROJECT_MANAGER'
        } as any)

      if (memberError) {
        // Rollback project creation if member addition fails
        await supabaseService.from('projects').delete().eq('id', (project as any).id)
        return { data: null, error: memberError }
      }

      return { data: project, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateProject(projectId: string, updates: {
    name?: string
    description?: string
    start_date?: string
    end_date?: string
    latitude?: number
    longitude?: number
    address?: string
    status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  }) {
    const { data, error } = await this.db
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    return { data, error }
  }

  async deleteProject(projectId: string) {
    // First check if project has any inspections
    const { data: inspections, error: inspectionError } = await supabase
      .from('inspections')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)

    if (inspectionError) {
      return { data: null, error: inspectionError }
    }

    if (inspections && inspections.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete project with existing inspections' }
      }
    }

    // Delete project members first (due to foreign key constraints)
    const { error: membersError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)

    if (membersError) {
      return { data: null, error: membersError }
    }

    // Delete the project
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .select()
      .single()

    return { data, error }
  }

  // ===== CHECKLIST QUERIES =====

  async createChecklist(checklistData: {
    project_id: string
    name: string
    description?: string
    version: string
    questions: any[]
    created_by: string
    is_active: boolean
  }) {
    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('checklists')
      .insert(checklistData as any)
      .select()
      .single()

    return { data, error }
  }

  async getChecklistsForProject(projectId: string) {
    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('checklists')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return { data: data || [], error }
  }

  async getChecklistById(checklistId: string) {
    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('checklists')
      .select('*')
      .eq('id', checklistId)
      .single()

    return { data, error }
  }

  // ===== INSPECTION QUERIES =====

  async getInspectionsForProject(
    projectId: string,
    filters: {
      status?: string[]
      assignedTo?: string
      userRole?: string
      userId?: string
    } = {},
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit

    // Use service role client to ensure we can read inspections
    const supabaseService = createServiceRoleClient()
    let query = supabaseService
      .from('inspections')
      .select(`
        *,
        profiles!inspections_assigned_to_fkey(id, name, email),
        projects!inner(id, name)
      `, { count: 'exact' })
      .eq('project_id', projectId)

    // Apply role-based filtering
    if (filters.userRole === 'INSPECTOR' && filters.userId) {
      query = query.eq('assigned_to', filters.userId)
    }
    // Project managers can see all inspections in their projects - no additional filtering needed

    // Apply other filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo)
    }

    const { data, error, count } = await query
      .order('status', { ascending: true }) // Pending first
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error in getInspectionsForProject:', error)
    }

    return {
      data: data || [],
      error,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    }
  }

  async getInspectionById(inspectionId: string) {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        profiles!inspections_assigned_to_fkey(id, name, email),
        projects(id, name),
        evidence(
          *,
          profiles!evidence_uploaded_by_fkey(id, name, email)
        ),
        approvals(
          *,
          profiles!approvals_approver_id_fkey(id, name, email)
        )
      `)
      .eq('id', inspectionId)
      .single()

    return { data, error }
  }

  async createInspection(inspectionData: {
    project_id: string
    checklist_id: string
    assigned_to: string
    title: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    due_date?: string
  }) {
    const insertData = {
      ...inspectionData,
      status: 'DRAFT',
      responses: {},
      rejection_count: 0
    }

    // Use service role client to bypass RLS policies
    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('inspections')
      .insert(insertData as any)
      .select()
      .single()

    return { data, error }
  }

  async updateInspectionStatus(
    inspectionId: string,
    status: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED',
    additionalData: {
      submitted_at?: string
      completed_at?: string
      rejection_count?: number
    } = {}
  ) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    }

    // Set appropriate timestamps based on status
    if (status === 'PENDING' && !additionalData.submitted_at) {
      updateData.submitted_at = new Date().toISOString()
    }
    
    if (status === 'APPROVED' && !additionalData.completed_at) {
      updateData.completed_at = new Date().toISOString()
    }

    // Use service role client to bypass RLS policies
    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('inspections')
      .update(updateData)
      .eq('id', inspectionId)
      .select()
      .single()

    return { data, error }
  }

  async updateInspection(inspectionId: string, updates: {
    title?: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    due_date?: string
    assigned_to?: string
    responses?: any
  }) {
    // Use service role client to bypass RLS policies
    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('inspections')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectionId)
      .select()
      .single()

    return { data, error }
  }

  async deleteInspection(inspectionId: string) {
    // First delete related evidence
    const { error: evidenceError } = await supabase
      .from('evidence')
      .delete()
      .eq('inspection_id', inspectionId)

    if (evidenceError) {
      return { data: null, error: evidenceError }
    }

    // Delete related approvals
    const { error: approvalsError } = await supabase
      .from('approvals')
      .delete()
      .eq('inspection_id', inspectionId)

    if (approvalsError) {
      return { data: null, error: approvalsError }
    }

    // Delete related escalations
    const { error: escalationsError } = await supabase
      .from('escalation_queue')
      .delete()
      .eq('inspection_id', inspectionId)

    if (escalationsError) {
      return { data: null, error: escalationsError }
    }

    // Finally delete the inspection
    const { data, error } = await supabase
      .from('inspections')
      .delete()
      .eq('id', inspectionId)
      .select()
      .single()

    return { data, error }
  }

  // ===== EVIDENCE QUERIES =====

  async getEvidenceForInspection(inspectionId: string) {
    const { data, error } = await supabase
      .from('evidence')
      .select(`
        *,
        profiles!evidence_uploaded_by_fkey(id, name, email)
      `)
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false })

    return { data: data || [], error }
  }

  async createEvidence(evidenceData: {
    inspection_id: string
    uploaded_by: string
    filename: string
    original_name: string
    mime_type: string
    file_size: number
    storage_path: string
    public_url?: string
    latitude?: number
    longitude?: number
    accuracy?: number
    timestamp: string
    metadata?: any
  }) {
    const { data, error } = await supabase
      .from('evidence')
      .insert({
        ...evidenceData,
        verified: false,
        annotations: null
      } as any)
      .select()
      .single()

    return { data, error }
  }

  async updateEvidence(evidenceId: string, updates: {
    verified?: boolean
    annotations?: any
    metadata?: any
  }) {
    const { data, error } = await this.db
      .from('evidence')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', evidenceId)
      .select()
      .single()

    return { data, error }
  }

  async deleteEvidence(evidenceId: string) {
    const { data, error } = await this.db
      .from('evidence')
      .delete()
      .eq('id', evidenceId)
      .select()
      .single()

    return { data, error }
  }

  async getTotalEvidenceSizeForInspection(inspectionId: string): Promise<number> {
    const { data, error } = await supabase
      .from('evidence')
      .select('file_size')
      .eq('inspection_id', inspectionId)

    if (error || !data) return 0

    return data.reduce((total: number, evidence: { file_size: number }) => total + evidence.file_size, 0)
  }

  // ===== APPROVAL QUERIES =====

  async createApproval(approvalData: {
    inspection_id: string
    approver_id: string
    decision: 'APPROVED' | 'REJECTED'
    notes: string
    is_escalated?: boolean
    escalation_reason?: string
  }) {
    const { data, error } = await supabase
      .from('approvals')
      .insert({
        ...approvalData,
        review_date: new Date().toISOString(),
        is_escalated: approvalData.is_escalated || false
      } as any)
      .select()
      .single()

    return { data, error }
  }

  async updateApproval(approvalId: string, updates: {
    decision?: 'APPROVED' | 'REJECTED'
    notes?: string
    is_escalated?: boolean
    escalation_reason?: string
  }) {
    const { data, error } = await this.db
      .from('approvals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .single()

    return { data, error }
  }

  async getApprovalsForInspection(inspectionId: string) {
    const { data, error } = await supabase
      .from('approvals')
      .select(`
        *,
        profiles!approvals_approver_id_fkey(id, name, email)
      `)
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false })

    return { data: data || [], error }
  }

  // ===== NOTIFICATION QUERIES =====

  async createNotification(notificationData: {
    user_id: string
    type: 'ASSIGNMENT' | 'STATUS_CHANGE' | 'APPROVAL_REQUIRED' | 'ESCALATION' | 'REPORT_READY'
    title: string
    message: string
    related_entity_type: 'INSPECTION' | 'PROJECT' | 'APPROVAL' | 'REPORT'
    related_entity_id: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          related_entity_type: notificationData.related_entity_type,
          related_entity_id: notificationData.related_entity_id,
          priority: notificationData.priority || 'MEDIUM',
          is_read: false
        } as any)
        .select()
        .single()

      return { data, error }
    } catch (err) {
      return { data: null, error: 'Failed to create notification' }
    }
  }

  async getNotificationsForUser(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    return {
      data: data || [],
      error,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    }
  }

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await this.db
      .from('notifications')
      .update({
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single()

    return { data, error }
  }

  // ===== DASHBOARD QUERIES =====

  async getInspectionsForProjectByDateRange(
    projectId: string, 
    options?: { startDate?: Date; endDate?: Date }
  ) {
    let query = supabase
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString())
    }
    
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString())
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    return { data, error }
  }

  async getDashboardKPIs(userId: string, userRole: string) {
    try {
      // Get total inspections for user based on role
      let inspectionsQuery = supabase.from('inspections').select('*', { count: 'exact' })
      
      if (userRole === 'INSPECTOR') {
        inspectionsQuery = inspectionsQuery.eq('assigned_to', userId)
      } else if (userRole === 'PROJECT_MANAGER') {
        // First get project IDs where user is a manager
        const { data: managerProjects } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', userId)
          .eq('role', 'PROJECT_MANAGER')

        if (managerProjects && managerProjects.length > 0) {
          const projectIds = managerProjects.map(mp => mp.project_id)
          inspectionsQuery = supabase
            .from('inspections')
            .select('*', { count: 'exact' })
            .in('project_id', projectIds)
        }
      }

      const { count: totalInspections } = await inspectionsQuery

      // Get pending approvals
      const { count: pendingApprovals } = await supabase
        .from('inspections')
        .select('*', { count: 'exact' })
        .eq('status', 'IN_REVIEW')

      // Get completed this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      let completedQuery = supabase
        .from('inspections')
        .select('*', { count: 'exact' })
        .eq('status', 'APPROVED')
        .gte('completed_at', weekAgo.toISOString())

      if (userRole === 'INSPECTOR') {
        completedQuery = completedQuery.eq('assigned_to', userId)
      }

      const { count: completedThisWeek } = await completedQuery

      // Get overdue inspections
      const now = new Date().toISOString()
      let overdueQuery = supabase
        .from('inspections')
        .select('*', { count: 'exact' })
        .in('status', ['DRAFT', 'PENDING'])
        .lt('due_date', now)

      if (userRole === 'INSPECTOR') {
        overdueQuery = overdueQuery.eq('assigned_to', userId)
      }

      const { count: overdueInspections } = await overdueQuery

      return {
        totalInspections: totalInspections || 0,
        pendingApprovals: pendingApprovals || 0,
        completedThisWeek: completedThisWeek || 0,
        overdueInspections: overdueInspections || 0,
      }
    } catch (error) {
      console.error('Error calculating KPIs:', error)
      return {
        totalInspections: 0,
        pendingApprovals: 0,
        completedThisWeek: 0,
        overdueInspections: 0,
      }
    }
  }

  // ===== PROJECT MEMBER MANAGEMENT =====

  async addProjectMember(projectId: string, userId: string, role: 'PROJECT_MANAGER' | 'INSPECTOR' = 'INSPECTOR') {
    try {
      const supabaseService = createServiceRoleClient()

      // Check if user is already a member
      const { data: existingMember } = await supabaseService
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        return { data: null, error: { message: 'User is already a member of this project' } }
      }

      // Add the member
      const { data, error } = await supabaseService
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role
        } as any)
        .select(`
          role,
          profiles(id, name, email, role)
        `)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async removeProjectMember(projectId: string, userId: string) {
    try {
      const supabaseService = createServiceRoleClient()

      // Don't allow removing the last project manager
      const { data: managers } = await supabaseService
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('role', 'PROJECT_MANAGER')

      if (managers && managers.length === 1 && managers[0].user_id === userId) {
        return { data: null, error: { message: 'Cannot remove the last project manager' } }
      }

      const { data, error } = await supabaseService
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateProjectMemberRole(projectId: string, userId: string, role: 'PROJECT_MANAGER' | 'INSPECTOR') {
    try {
      const supabaseService = createServiceRoleClient()

      const { data, error } = await supabaseService
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select(`
          role,
          profiles(id, name, email, role)
        `)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async searchUsers(query: string, excludeProjectId?: string) {
    try {
      const supabaseService = createServiceRoleClient()

      let searchQuery = supabaseService
        .from('profiles')
        .select('id, name, email, role')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

      const { data: users, error } = await searchQuery

      if (error) return { data: [], error }

      // If excludeProjectId is provided, filter out users who are already members
      if (excludeProjectId && users) {
        const { data: existingMembers } = await supabaseService
          .from('project_members')
          .select('user_id')
          .eq('project_id', excludeProjectId)

        const existingUserIds = existingMembers?.map(m => m.user_id) || []
        const filteredUsers = users.filter(user => !existingUserIds.includes(user.id))

        return { data: filteredUsers, error: null }
      }

      return { data: users || [], error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  // ===== REAL-TIME HELPERS =====

  // Subscribe to project updates
  subscribeToProject(projectId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`project:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      }, callback)
      .subscribe()
  }

  // Subscribe to inspection updates
  subscribeToInspections(projectId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`inspections:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inspections',
        filter: `project_id=eq.${projectId}`
      }, callback)
      .subscribe()
  }

  // Subscribe to user notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe()
  }

  // Subscribe to evidence uploads for an inspection
  subscribeToEvidence(inspectionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`evidence:${inspectionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'evidence',
        filter: `inspection_id=eq.${inspectionId}`
      }, callback)
      .subscribe()
  }

  // ===== OFFLINE SYNC HELPERS =====

  async getInspectionsForUser(userId: string, userRole: string) {
    let query = supabase.from('inspections').select(`
      *,
      profiles!inspections_assigned_to_fkey(id, name, email),
      projects(id, name)
    `)

    if (userRole === 'INSPECTOR') {
      query = query.eq('assigned_to', userId)
    } else if (userRole === 'PROJECT_MANAGER') {
      // First get project IDs where user is a manager
      const { data: managerProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId)
        .eq('role', 'PROJECT_MANAGER')

      if (managerProjects && managerProjects.length > 0) {
        const projectIds = managerProjects.map(mp => mp.project_id)
        query = supabase
          .from('inspections')
          .select(`
            *,
            profiles!inspections_assigned_to_fkey(id, name, email),
            projects(id, name)
          `)
          .in('project_id', projectIds)
      } else {
        // No projects found, return empty result
        return { data: [], error: null }
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    return { data: data || [], error }
  }

  async getChecklists() {
    const supabaseService = createServiceRoleClient()
    const { data, error } = await supabaseService
      .from('checklists')
      .select('*')
      .order('name', { ascending: true })

    return { data: data || [], error }
  }

  async getEvidenceForUser(userId: string) {
    const { data, error } = await supabase
      .from('evidence')
      .select(`
        *,
        inspections!inner(assigned_to)
      `)
      .eq('inspections.assigned_to', userId)
      .order('created_at', { ascending: false })

    return { data: data || [], error }
  }

  // ===== ESCALATION QUEUE MANAGEMENT =====

  // Get active escalation for inspection
  async getActiveEscalation(inspectionId: string) {
    const { data, error } = await supabase
      .from('escalation_queue')
      .select('*')
      .eq('inspection_id', inspectionId)
      .in('status', ['QUEUED', 'NOTIFIED'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return { data, error }
  }

  // Create escalation entry
  async createEscalation(escalationData: {
    inspection_id: string
    original_manager_id: string
    escalation_reason: string
    priority_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }) {
    const { data, error } = await this.db
      .from('escalation_queue')
      .insert({
        ...escalationData,
        status: 'QUEUED',
        priority_level: escalationData.priority_level || 'MEDIUM',
        notification_count: 0
      })
      .select()
      .single()

    return { data, error }
  }

  // Update escalation status
  async updateEscalationStatus(escalationId: string, status: 'QUEUED' | 'NOTIFIED' | 'RESOLVED' | 'EXPIRED') {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'RESOLVED') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await this.db
      .from('escalation_queue')
      .update(updateData)
      .eq('id', escalationId)
      .select()
      .single()

    return { data, error }
  }

  // Increment escalation notification count
  async incrementEscalationNotifications(escalationId: string) {
    const { data, error } = await (supabase as any).rpc('increment_escalation_notifications', {
      escalation_id: escalationId
    })

    return { data, error }
  }

  // Get escalation queue for manager
  async getEscalationQueueForManager(managerId: string) {
    // First get project IDs where user is a manager
    const { data: managerProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', managerId)
      .eq('role', 'PROJECT_MANAGER')

    if (!managerProjects || managerProjects.length === 0) {
      return { data: [], error: null }
    }

    const projectIds = managerProjects.map(mp => mp.project_id)

    const { data, error } = await supabase
      .from('escalation_queue')
      .select(`
        *,
        inspections!inner (
          id,
          title,
          status,
          assigned_to,
          project_id,
          projects (id, name)
        )
      `)
      .in('inspections.project_id', projectIds)
      .in('status', ['QUEUED', 'NOTIFIED'])
      .order('priority_level', { ascending: false })
      .order('created_at', { ascending: true })

    return { data, error }
  }

  // Subscribe to escalation queue changes
  subscribeToEscalationQueue(callback: (payload: any) => void) {
    return supabase
      .channel('escalation_queue_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'escalation_queue'
      }, callback)
      .subscribe()
  }

  // Subscribe to escalation queue for a specific inspection
  subscribeToInspectionEscalation(inspectionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`escalation:${inspectionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'escalation_queue',
        filter: `inspection_id=eq.${inspectionId}`
      }, callback)
      .subscribe()
  }
}

export const supabaseDatabase = new SupabaseDatabaseService()