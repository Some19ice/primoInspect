-- Row Level Security Policies for PrimoInspect
-- Implements role-based access control at the database level

-- ===== PROFILES POLICIES =====

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- System can insert profiles during user creation
CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===== PROJECTS POLICIES =====

-- Users can view projects they are members of
CREATE POLICY "Users can view their projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
    )
  );

-- Project managers can create projects
CREATE POLICY "Project managers can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

-- Project managers can update their projects
CREATE POLICY "Project managers can update their projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

-- ===== PROJECT_MEMBERS POLICIES =====

-- Users can view project members for projects they belong to
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Project managers can manage project members
CREATE POLICY "Project managers can manage members" ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

CREATE POLICY "Project managers can update member roles" ON project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

CREATE POLICY "Project managers can remove members" ON project_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

-- ===== CHECKLISTS POLICIES =====

-- Users can view checklists for projects they belong to
CREATE POLICY "Users can view project checklists" ON checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = checklists.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Project managers can create and manage checklists
CREATE POLICY "Project managers can create checklists" ON checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = checklists.project_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

CREATE POLICY "Project managers can update checklists" ON checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = checklists.project_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

-- ===== INSPECTIONS POLICIES =====

-- Multi-role inspection access policy
CREATE POLICY "Role-based inspection access" ON inspections
  FOR SELECT USING (
    -- Inspectors can view their assigned inspections
    (assigned_to = auth.uid()) OR
    -- Project managers can view inspections in their projects
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = inspections.project_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    ) OR
    -- Executives can view all inspections
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'EXECUTIVE'
    )
  );

-- Project managers can create inspections
CREATE POLICY "Project managers can create inspections" ON inspections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = inspections.project_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );

-- Inspectors can update their own inspections (draft/pending only)
-- Project managers can update any inspection in their projects
CREATE POLICY "Inspection update permissions" ON inspections
  FOR UPDATE USING (
    (
      -- Inspectors can update their own draft/pending inspections
      assigned_to = auth.uid() AND
      status IN ('DRAFT', 'PENDING') AND
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'INSPECTOR'
      )
    ) OR
    (
      -- Project managers can update inspections in their projects
      EXISTS (
        SELECT 1 FROM project_members pm
        JOIN profiles p ON p.id = pm.user_id
        WHERE pm.project_id = inspections.project_id
        AND pm.user_id = auth.uid()
        AND p.role = 'PROJECT_MANAGER'
      )
    )
  );

-- ===== EVIDENCE POLICIES =====

-- Evidence access based on inspection access
CREATE POLICY "Evidence access based on inspection access" ON evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = evidence.inspection_id
      AND (
        -- Inspectors can view evidence for their inspections
        (i.assigned_to = auth.uid()) OR
        -- Project managers can view evidence in their projects
        EXISTS (
          SELECT 1 FROM project_members pm
          JOIN profiles p ON p.id = pm.user_id
          WHERE pm.project_id = i.project_id
          AND pm.user_id = auth.uid()
          AND p.role = 'PROJECT_MANAGER'
        ) OR
        -- Executives can view all evidence
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role = 'EXECUTIVE'
        )
      )
    )
  );

-- Only inspectors can upload evidence to their assigned inspections
CREATE POLICY "Inspectors can upload evidence" ON evidence
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections i
      JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = evidence.inspection_id
      AND i.assigned_to = auth.uid()
      AND p.role = 'INSPECTOR'
      AND evidence.uploaded_by = auth.uid()
    )
  );

-- ===== APPROVALS POLICIES =====

-- Approvals visible to inspection stakeholders
CREATE POLICY "Approval access based on inspection access" ON approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = approvals.inspection_id
      AND (
        -- Inspectors can view approvals for their inspections
        (i.assigned_to = auth.uid()) OR
        -- Project managers can view approvals in their projects
        EXISTS (
          SELECT 1 FROM project_members pm
          JOIN profiles p ON p.id = pm.user_id
          WHERE pm.project_id = i.project_id
          AND pm.user_id = auth.uid()
          AND p.role = 'PROJECT_MANAGER'
        ) OR
        -- Executives can view all approvals
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role = 'EXECUTIVE'
        )
      )
    )
  );

-- Only project managers can create approvals
CREATE POLICY "Project managers can create approvals" ON approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections i
      JOIN project_members pm ON pm.project_id = i.project_id
      JOIN profiles p ON p.id = pm.user_id
      WHERE i.id = approvals.inspection_id
      AND pm.user_id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
      AND approvals.approver_id = auth.uid()
    )
  );

-- ===== NOTIFICATIONS POLICIES =====

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- System can create notifications for any user
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ===== REPORTS POLICIES =====

-- Report access based on project access
CREATE POLICY "Report access based on project access" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = reports.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Project managers and executives can generate reports
CREATE POLICY "Managers and executives can create reports" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('PROJECT_MANAGER', 'EXECUTIVE')
    ) AND
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = reports.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- ===== AUDIT_LOGS POLICIES =====

-- Audit logs are read-only for users, system inserts only
CREATE POLICY "Users can view relevant audit logs" ON audit_logs
  FOR SELECT USING (
    -- Users can view audit logs for entities they have access to
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        -- Project managers and executives can view all logs
        p.role IN ('PROJECT_MANAGER', 'EXECUTIVE') OR
        -- Inspectors can view logs related to their inspections
        (
          p.role = 'INSPECTOR' AND
          audit_logs.entity_type = 'INSPECTION' AND
          EXISTS (
            SELECT 1 FROM inspections i
            WHERE i.id = audit_logs.entity_id::uuid
            AND i.assigned_to = auth.uid()
          )
        )
      )
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ===== STORAGE POLICIES =====

-- Create storage policies for evidence files bucket
-- Note: These are Supabase Storage policies, not RLS policies

-- Evidence upload policy - only authenticated users can upload
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence-files', 'evidence-files', false);

-- Allow authenticated users to upload evidence files
CREATE POLICY "Authenticated users can upload evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated' AND
    -- File path should match pattern: evidence/{inspection_id}/{user_id}/{filename}
    (storage.foldername(name))[1] = 'evidence'
  );

-- Allow users to download evidence they have access to
CREATE POLICY "Users can download accessible evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated'
    -- Additional access control would be handled in application layer
    -- based on inspection access permissions
  );

-- Allow users to delete their own uploaded evidence
CREATE POLICY "Users can delete own evidence" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated' AND
    -- Check if user uploaded the file (stored in file path)
    (storage.foldername(name))[3] = auth.uid()::text
  );

-- ===== HELPER FUNCTIONS =====

-- Function to check if user is project manager for a project
CREATE OR REPLACE FUNCTION is_project_manager(project_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.user_id
    WHERE pm.project_id = project_id_param
    AND pm.user_id = auth.uid()
    AND p.role = 'PROJECT_MANAGER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to inspection
CREATE OR REPLACE FUNCTION has_inspection_access(inspection_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM inspections i
    LEFT JOIN project_members pm ON pm.project_id = i.project_id
    LEFT JOIN profiles p ON p.id = auth.uid()
    WHERE i.id = inspection_id_param
    AND (
      -- Inspector assigned to inspection
      i.assigned_to = auth.uid() OR
      -- Project manager in project
      (pm.user_id = auth.uid() AND p.role = 'PROJECT_MANAGER') OR
      -- Executive
      p.role = 'EXECUTIVE'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;