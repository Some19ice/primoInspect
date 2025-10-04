import { supabase } from './client'
import { createServerClient } from '@supabase/ssr'
import { Database } from './types'

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
        persistSession: false,
      },
      cookies: {
        get: () => undefined,
        set: () => { },
        remove: () => { },
      },
    }
  )
}

type Tables = Database['public']['Tables']
type Profile = Tables['profiles']['Row']
type Project = Tables['projects']['Row']
type Checklist = Tables['checklists']['Row']

// Define missing types manually since they're not in the generated types
interface Inspection {
  id: string
  project_id: string
  checklist_id: string
  assigned_to: string
  title: string
  description?: string
  status: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  due_date?: string
  responses: any
  created_at: string
  updated_at: string
}

interface Evidence {
  id: string
  inspection_id: string
  uploaded_by: string
  filename: string
  url: string
  question_id?: string
  verified: boolean
  created_at: string
}



interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface Approval {
  id: string
  inspection_id: string
  approver_id: string
  decision: 'APPROVED' | 'REJECTED'
  notes: string
  created_at: string
}

// Database abstraction layer for Supabase
export class SupabaseDatabaseService {
  // Helper method to work around TypeScript issues with Supabase
  private get db() {
    return supabase as any
  }

  // ===== PROFILE QUERIES =====

  async getProfile(
    userId: string
  ): Promise<{ data: Profile | null; error: any }> {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return { data: null, error }
    }
  }

  async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>
  ) {
    try {
      const { data, error } = await this.db
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  async searchUsers(query: string, excludeProjectId?: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      let searchQuery = supabaseService
        .from('profiles')
        .select('id, name, email, role')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20)

      // If excludeProjectId is provided, exclude users who are already members
      if (excludeProjectId) {
        const { data: projectMembers } = await supabaseService
          .from('project_members')
          .select('user_id')
          .eq('project_id', excludeProjectId)

        if (projectMembers && projectMembers.length > 0) {
          const excludeUserIds = projectMembers.map((pm: any) => pm.user_id)
          searchQuery = searchQuery.not('id', 'in', `(${excludeUserIds.join(',')})`)
        }
      }

      const { data, error } = await searchQuery

      return { data: data || [], error }
    } catch (error) {
      console.error('Error searching users:', error)
      return { data: [], error }
    }
  }

  // ===== PROJECT QUERIES =====

  async getProjectsForUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const offset = (page - 1) * limit

      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()

      // First get project IDs where user is a member
      const { data: memberProjects, error: memberError } = await supabaseService
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', userId)

      if (memberError) {
        return {
          data: [],
          error: memberError,
          pagination: { page, limit, total: 0, hasNext: false, hasPrev: false },
        }
      }

      if (!memberProjects || memberProjects.length === 0) {
        return {
          data: [],
          error: null,
          pagination: { page, limit, total: 0, hasNext: false, hasPrev: false },
        }
      }

      const projectIds = memberProjects.map((mp: any) => mp.project_id)

      // Get projects with members
      const {
        data: projects,
        error: projectsError,
        count,
      } = await supabaseService
        .from('projects')
          .select(
            `
          *,
          project_members!inner(
            id,
            role,
            created_at,
            profiles(
              id,
              name,
              email,
              role
            )
          )
        `,
            { count: 'exact' }
          )
          .in('id', projectIds)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

      if (projectsError) {
        return {
          data: [],
          error: projectsError,
          pagination: { page, limit, total: 0, hasNext: false, hasPrev: false },
        }
      }

      const total = count || 0
      const hasNext = offset + limit < total
      const hasPrev = page > 1

      return {
        data: projects || [],
        error: null,
        pagination: { page, limit, total, hasNext, hasPrev },
      }
    } catch (error) {
      console.error('Error fetching projects for user:', error)
      return {
        data: [],
        error,
        pagination: { page, limit, total: 0, hasNext: false, hasPrev: false },
      }
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
  }) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('projects')
        .insert(projectData as any)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating project:', error)
      return { data: null, error }
    }
  }

  async updateProject(
    projectId: string,
    updates: Partial<{
      name: string
      description: string
      start_date: string
      end_date: string
      latitude: number
      longitude: number
      address: string
      status: string
    }>
  ) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await (supabaseService as any)
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating project:', error)
      return { data: null, error }
    }
  }

  async deleteProject(projectId: string) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error deleting project:', error)
      return { data: null, error }
    }
  }

  async getProjectById(projectId: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('projects')
        .select(
          `
          *,
          project_members(
            id,
            role,
            created_at,
            profiles(
              id,
              name,
              email,
              role
            )
          )
        `
        )
        .eq('id', projectId)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error fetching project:', error)
      return { data: null, error }
    }
  }

  async updateProjectMemberRole(
    projectId: string,
    userId: string,
    role: string
  ) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await (supabaseService as any)
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating project member role:', error)
      return { data: null, error }
    }
  }

  async removeProjectMember(projectId: string, userId: string) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select()

      return { data, error }
    } catch (error) {
      console.error('Error removing project member:', error)
      return { data: null, error }
    }
  }

  async addProjectMember(
    projectId: string,
    userId: string,
    role: string
  ) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
        } as any)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error adding project member:', error)
      return { data: null, error }
    }
  }

  // ===== CHECKLIST QUERIES =====

  async createChecklist(checklistData: Tables['checklists']['Insert']) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('checklists')
        .insert(checklistData)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating checklist:', error)
      return { data: null, error }
    }
  }

  async getChecklistsForProject(projectId: string) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('checklists')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching checklists for project:', error)
      return { data: [], error }
    }
  }

  async getChecklistById(checklistId: string) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('checklists')
        .select('*')
        .eq('id', checklistId)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error fetching checklist:', error)
      return { data: null, error }
    }
  }

  async getChecklists() {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('checklists')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching checklists:', error)
      return { data: [], error }
    }
  }

  async updateChecklist(checklistId: string, updates: Tables['checklists']['Update']) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('checklists')
        .update(updates)
        .eq('id', checklistId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating checklist:', error)
      return { data: null, error }
    }
  }

  async deleteChecklist(checklistId: string) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('checklists')
        .delete()
        .eq('id', checklistId)

      return { data, error }
    } catch (error) {
      console.error('Error deleting checklist:', error)
      return { data: null, error }
    }
  }

  async getInspectionsByChecklistId(checklistId: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('inspections')
        .select('id, title, status')
        .eq('checklist_id', checklistId)

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching inspections by checklist:', error)
      return { data: [], error }
    }
  }

  // ===== NOTIFICATION QUERIES =====

  async createNotification(notificationData: {
    user_id: string
    type: string
    title: string
    message: string
    related_entity_type?: string
    related_entity_id?: string
    priority?: string
  }) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('notifications')
        .insert({
          ...notificationData,
          is_read: false,
          created_at: new Date().toISOString(),
        } as any)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { data: null, error }
    }
  }

  // ===== ESCALATION QUERIES =====

  async getEscalationQueueForManager(managerId: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('escalations' as any)
        .select(`
          *,
          inspections!inner(
            id,
            title,
            status,
            priority,
            due_date,
            created_at,
            profiles!inspections_assigned_to_fkey(
              id,
              name,
              email
            ),
            projects(
              id,
              name
            )
          ),
          profiles!escalations_original_manager_id_fkey(
            id,
            name,
            email
          )
        `)
        .or(`escalated_to.eq.${managerId},original_manager_id.eq.${managerId}`)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching escalation queue:', error)
      return { data: [], error }
    }
  }

  async createEscalation(escalationData: {
    inspection_id: string
    original_manager_id: string
    escalation_reason: string
    priority_level?: string
    escalated_to?: string
  }) {
    try {
      const supabaseService = createServiceRoleClient()

      // If no specific escalation target, find an executive
      let escalatedTo = escalationData.escalated_to
      if (!escalatedTo) {
        const { data: executives } = await supabaseService
          .from('profiles')
          .select('id')
          .eq('role', 'EXECUTIVE')
          .limit(1)

        if (executives && executives.length > 0) {
          escalatedTo = (executives as any)[0].id
        }
      }

      const { data, error } = await supabaseService
        .from('escalations' as any)
        .insert({
          ...escalationData,
          escalated_to: escalatedTo,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        } as any)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating escalation:', error)
      return { data: null, error }
    }
  }

  async updateEscalationStatus(escalationId: string, status: string, notes?: string) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await (supabaseService as any)
        .from('escalations')
        .update({
          status,
          resolution_notes: notes,
          resolved_at: status === 'RESOLVED' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', escalationId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating escalation status:', error)
      return { data: null, error }
    }
  }

  async getActiveEscalation(inspectionId: string) {
    try {
      const { data, error } = await supabase
        .from('escalations' as any)
        .select(`
          *,
          profiles!escalations_original_manager_id_fkey(
            id,
            name,
            email
          )
        `)
        .eq('inspection_id', inspectionId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error fetching active escalation:', error)
      return { data: null, error }
    }
  }

  // ===== INSPECTION QUERIES =====

  async getInspectionsForProjectByDateRange(
    projectId: string,
    dateRange: {
      startDate: Date
      endDate: Date
    }
  ) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('inspections')
        .select(
          `
          *,
          profiles!inspections_assigned_to_fkey(
            id,
            name,
            email
          ),
          checklists(
            id,
            name,
            version
          ),
          projects(
            id,
            name
          )
        `
        )
        .eq('project_id', projectId)
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString())
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching inspections by date range:', error)
      return { data: [], error }
    }
  }

  async getInspectionsForProject(
    projectId: string,
    filters: {
      status?: string[]
      assignedTo?: string
      priority?: string[]
      page?: number
      limit?: number
    } = {}
  ) {
    try {
      const { page = 1, limit = 20 } = filters
      const offset = (page - 1) * limit

      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      let query = supabaseService
        .from('inspections')
        .select(
          `
          *,
          profiles!inspections_assigned_to_fkey(
            id,
            name,
            email
          ),
          checklists(
            id,
            name,
            version
          ),
          projects(
            id,
            name
          )
        `,
          { count: 'exact' }
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo)
      }

      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
      }

      const { data, error, count } = await query.range(
        offset,
        offset + limit - 1
      )

      if (error) {
        console.error('Database error in getInspectionsForProject:', error)
        return {
          data: [],
          error,
          pagination: { page, limit, total: 0, hasNext: false, hasPrev: false },
        }
      }

      const total = count || 0
      const hasNext = offset + limit < total
      const hasPrev = page > 1

      return {
        data: data || [],
        error: null,
        pagination: { page, limit, total, hasNext, hasPrev },
      }
    } catch (error) {
      console.error('Error fetching inspections for project:', error)
      return {
        data: [],
        error,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
      }
    }
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
    try {
      const insertData = {
        ...inspectionData,
        status: 'DRAFT',
        responses: {},
        rejection_count: 0,
      }

      // Use service role client to bypass RLS policies
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('inspections')
        .insert(insertData as any)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating inspection:', error)
      return { data: null, error }
    }
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
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
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
      const { data, error } = await (supabaseService as any)
        .from('inspections')
        .update(updateData)
        .eq('id', inspectionId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating inspection status:', error)
      return { data: null, error }
    }
  }

  async updateInspection(
    inspectionId: string,
    updates: {
      title?: string
      description?: string
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      due_date?: string
      assigned_to?: string
      responses?: any
      rejection_count?: number
      status?: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
      submitted_at?: string
      completed_at?: string
    }
  ) {
    try {
      // Use service role client to bypass RLS policies
      const supabaseService = createServiceRoleClient()
      const { data, error } = await (supabaseService as any)
        .from('inspections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating inspection:', error)
      return { data: null, error }
    }
  }

  async getInspectionById(inspectionId: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('inspections')
        .select(
          `
          *,
          profiles!inspections_assigned_to_fkey(
            id,
            name,
            email
          ),
          checklists(
            id,
            name,
            version,
            questions
          ),
          projects(
            id,
            name
          ),
          evidence(
            id,
            filename,
            url,
            thumbnail_url,
            verified,
            latitude,
            longitude,
            timestamp
          )
        `
        )
        .eq('id', inspectionId)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error fetching inspection:', error)
      return { data: null, error }
    }
  }

  async getInspectionsForUser(userId: string, userRole: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      let query = supabaseService.from('inspections').select(`
        *,
        profiles!inspections_assigned_to_fkey(
          id,
          name,
          email
        ),
        checklists(
          id,
          name,
          version
        ),
        projects(
          id,
          name
        )
      `)

      // Filter based on role
      if (userRole === 'INSPECTOR') {
        // Inspectors only see inspections assigned to them
        query = query.eq('assigned_to', userId)
        console.log('[getInspectionsForUser] Filtering for INSPECTOR:', userId)
      } else if (userRole === 'PROJECT_MANAGER') {
        // Get inspections for projects they manage
        const { data: projectIds } = await supabaseService
          .from('project_members')
          .select('project_id')
          .eq('user_id', userId)
          .eq('role', 'PROJECT_MANAGER')

        if (projectIds && projectIds.length > 0) {
          const ids = projectIds.map((p: any) => p.project_id)
          query = query.in('project_id', ids)
          console.log('[getInspectionsForUser] Filtering for PROJECT_MANAGER, projects:', ids)
        } else {
          // No projects found for this manager, return empty
          console.log('[getInspectionsForUser] No projects found for PROJECT_MANAGER:', userId)
          return { data: [], error: null }
        }
      }
      // EXECUTIVE sees all inspections (no additional filter)
      else if (userRole === 'EXECUTIVE') {
        console.log('[getInspectionsForUser] EXECUTIVE - no filtering')
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      })

      console.log(`[getInspectionsForUser] Found ${data?.length || 0} inspections for role ${userRole}`)
      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching inspections for user:', error)
      return { data: [], error }
    }
  }

  async deleteInspection(inspectionId: string) {
    try {
      // Use service role client to bypass RLS policies
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('inspections')
        .delete()
        .eq('id', inspectionId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error deleting inspection:', error)
      return { data: null, error }
    }
  }

  // ===== EVIDENCE QUERIES =====

  async createEvidence(evidenceData: {
    inspection_id: string
    uploaded_by: string
    filename: string
    original_name: string
    mime_type: string
    file_size: number
    storage_path: string
    public_url: string
    question_id?: string // NEW: Link to specific checklist question
    latitude?: number
    longitude?: number
    accuracy?: number
    timestamp: string
    metadata?: any
  }) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('vidence' as any) // Note: typo in generated types, should be 'evidence'
        .insert({
          ...evidenceData,
          url: evidenceData.public_url, // Map for backward compatibility
          verified: false,
        } as any)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating evidence:', error)
      return { data: null, error }
    }
  }

  async getEvidenceForInspection(inspectionId: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('vidence' as any) // Note: typo in generated types, should be 'evidence'
        .select(
          `
          *,
          profiles!evidence_uploaded_by_fkey(
            id,
            name,
            email
          )
        `
        )
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching evidence for inspection:', error)
      return { data: [], error }
    }
  }

  async getEvidenceForUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('vidence' as any) // Note: typo in generated types, should be 'evidence'
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching evidence for user:', error)
      return { data: [], error }
    }
  }

  async getTotalEvidenceSizeForInspection(inspectionId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('vidence' as any) // Note: typo in generated types, should be 'evidence'
        .select('file_size')
        .eq('inspection_id', inspectionId)

      if (error || !data) return 0
      return (data as any[]).reduce((sum, row) => sum + (row.file_size || 0), 0)
    } catch (error) {
      console.error('Error calculating total evidence size:', error)
      return 0
    }
  }

  async updateEvidence(evidenceId: string, updates: any) {
    try {
      const { data, error } = await (supabase as any)
        .from('evidence')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', evidenceId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating evidence:', error)
      return { data: null, error }
    }
  }

  async deleteEvidence(evidenceId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('evidence')
        .delete()
        .eq('id', evidenceId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error deleting evidence:', error)
      return { data: null, error }
    }
  }

  async updateEvidenceVerification(
    evidenceId: string,
    verified: boolean,
    annotations?: any
  ) {
    try {
      const updateData: any = {
        verified,
        updated_at: new Date().toISOString(),
      }

      if (annotations) {
        updateData.annotations = annotations
      }

      const { data, error } = await (supabase as any)
        .from('evidence')
        .update(updateData)
        .eq('id', evidenceId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating evidence verification:', error)
      return { data: null, error }
    }
  }

  // ===== APPROVAL QUERIES =====

  async createApproval(approvalData: {
    inspection_id: string
    approver_id: string
    decision: 'APPROVED' | 'REJECTED'
    notes: string
    is_escalated?: boolean
    escalation_reason?: string
    previous_approval_id?: string
    attachments?: any
  }) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('approvals')
        .insert(approvalData as any)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating approval:', error)
      return { data: null, error }
    }
  }

  async updateApproval(approvalId: string, updates: any) {
    try {
      const supabaseService = createServiceRoleClient()
      const { data, error } = await (supabaseService as any)
        .from('approvals')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', approvalId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating approval:', error)
      return { data: null, error }
    }
  }

  async getApprovalsForInspection(inspectionId: string) {
    try {
      // Use service role client for server-side operations
      const supabaseService = createServiceRoleClient()
      const { data, error } = await supabaseService
        .from('approvals')
        .select(
          `
          *,
          profiles!approvals_approver_id_fkey(
            id,
            name,
            email
          )
        `
        )
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: false })

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching approvals for inspection:', error)
      return { data: [], error }
    }
  }


  async getNotificationsForUser(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data: data || [], error }
    } catch (error) {
      console.error('Error fetching notifications for user:', error)
      return { data: [], error }
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .update({
          is_read: true,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { data: null, error }
    }
  }

  // ===== DASHBOARD QUERIES =====

  async getDashboardStats(userId: string, userRole: string) {
    try {
      const stats = {
        totalProjects: 0,
        totalInspections: 0,
        pendingApprovals: 0,
        completedThisWeek: 0,
        overdueInspections: 0,
      }

      // Get project count for user
      if (userRole !== 'EXECUTIVE') {
        const { count: projectCount } = await supabase
          .from('project_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        stats.totalProjects = projectCount || 0
      } else {
        const { count: projectCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })

        stats.totalProjects = projectCount || 0
      }

      // Get inspection counts
      let inspectionQuery = supabase
        .from('inspections')
        .select('status, created_at, due_date')

      if (userRole === 'INSPECTOR') {
        inspectionQuery = inspectionQuery.eq('assigned_to', userId)
      } else if (userRole === 'PROJECT_MANAGER') {
        const { data: projectIds } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', userId)
          .eq('role', 'PROJECT_MANAGER')

        if (projectIds && projectIds.length > 0) {
          const ids = projectIds.map((p: any) => p.project_id)
          inspectionQuery = inspectionQuery.in('project_id', ids)
        }
      }

      const { data: inspections } = await inspectionQuery

      if (inspections) {
        stats.totalInspections = inspections.length
        stats.pendingApprovals = inspections.filter(
          (i: any) => i.status === 'IN_REVIEW'
        ).length

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        stats.completedThisWeek = inspections.filter(
          (i: any) =>
            i.status === 'APPROVED' && new Date(i.created_at) > weekAgo
        ).length

        const now = new Date()
        stats.overdueInspections = inspections.filter(
          (i: any) =>
            i.due_date &&
            new Date(i.due_date) < now &&
            !['APPROVED', 'REJECTED'].includes(i.status)
        ).length
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { data: null, error }
    }
  }

  // ===== VALIDATION HELPERS =====

  /**
   * Validate that all required evidence is provided for checklist questions
   */
  async validateInspectionCompleteness(inspectionId: string): Promise<{
    isComplete: boolean
    missingRequired: string[]
    missingEvidence: string[]
  }> {
    try {
      const { data: inspection } = await this.getInspectionById(inspectionId)
      if (!inspection) {
        return {
          isComplete: false,
          missingRequired: ['Inspection not found'],
          missingEvidence: [],
        }
      }

      const checklist = (inspection as any).checklists
      const responses = (inspection as any).responses || {}
      const evidence = (inspection as any).evidence || []

      const missingRequired: string[] = []
      const missingEvidence: string[] = []

      // Check each question
      if (checklist && checklist.questions) {
        for (const question of checklist.questions || []) {
          const response = responses[question.id]

          // Check required questions
          if (
            question.required &&
            (!response || response.value === undefined || response.value === '')
          ) {
            missingRequired.push(question.question)
          }

          // Check evidence requirements
          if (question.evidenceRequired) {
            const questionEvidence = evidence.filter(
              (e: any) => e.question_id === question.id
            )
            if (questionEvidence.length === 0) {
              missingEvidence.push(question.question)
            }
          }
        }
      }

      return {
        isComplete:
          missingRequired.length === 0 && missingEvidence.length === 0,
        missingRequired,
        missingEvidence,
      }
    } catch (error) {
      console.error('Error validating inspection completeness:', error)
      return {
        isComplete: false,
        missingRequired: ['Validation error'],
        missingEvidence: [],
      }
    }
  }

  // ===== REALTIME SUBSCRIPTIONS =====

  /**
   * Subscribe to escalation changes for an inspection
   * This is a wrapper around the realtime service for convenience
   */
  subscribeToInspectionEscalation(
    inspectionId: string,
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      new: any
      old: any
      errors: any
    }) => void
  ) {
    // Only works on client side
    if (typeof window === 'undefined') {
      throw new Error('Realtime subscriptions only work on client side')
    }

    // Import dynamically to avoid server-side issues
    const { realtimeService } = require('./realtime')
    return realtimeService.subscribeToInspectionEscalation(inspectionId, callback)
  }

  /**
   * Subscribe to escalation queue changes (all rows)
   */
  subscribeToEscalationQueue(
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      new: any
      old: any
      errors: any
    }) => void
  ) {
    if (typeof window === 'undefined') {
      throw new Error('Realtime subscriptions only work on client side')
    }

    const { realtimeService } = require('./realtime')
    return realtimeService.subscribeToEscalationQueue(callback)
  }
}

// Export singleton instance
export const supabaseDatabase = new SupabaseDatabaseService()
