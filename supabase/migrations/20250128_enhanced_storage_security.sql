-- Enhanced Storage Security Policies for PrimoInspect
-- Addresses security concerns identified in RBAC review

-- ===== ENHANCED STORAGE SECURITY =====

-- Drop existing insecure storage policies
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can download accessible evidence" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own evidence" ON storage.objects;

-- Create more secure storage policies that validate against database records

-- Policy for uploading evidence files
CREATE POLICY "Secure evidence upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated' AND
    -- Validate file path format: evidence/{inspection_id}/{user_id}/{filename}
    (storage.foldername(name))[1] = 'evidence' AND
    (storage.foldername(name))[3] = auth.uid()::text AND
    -- Ensure user is assigned to the inspection
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = ((storage.foldername(name))[2])::uuid
      AND i.assigned_to = auth.uid()
      AND i.status IN ('DRAFT', 'PENDING')
    )
  );

-- Policy for downloading evidence files (requires database validation)
CREATE POLICY "Secure evidence download" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated' AND
    -- Check if evidence record exists and user has access
    EXISTS (
      SELECT 1 FROM evidence e
      JOIN inspections i ON i.id = e.inspection_id
      WHERE e.url = name
      AND (
        -- Inspector assigned to inspection
        i.assigned_to = auth.uid() OR
        -- Project manager with project access
        EXISTS (
          SELECT 1 FROM project_members pm
          JOIN profiles p ON p.id = pm.user_id
          WHERE pm.project_id = i.project_id
          AND pm.user_id = auth.uid()
          AND p.role = 'PROJECT_MANAGER'
        ) OR
        -- Executive access
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role = 'EXECUTIVE'
        )
      )
    )
  );

-- Policy for deleting evidence files
CREATE POLICY "Secure evidence deletion" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated' AND
    -- Check database record exists and user has permission
    EXISTS (
      SELECT 1 FROM evidence e
      JOIN inspections i ON i.id = e.inspection_id
      WHERE e.url = name
      AND i.status IN ('DRAFT', 'PENDING')
      AND (
        -- User uploaded the evidence
        e.uploaded_by = auth.uid() OR
        -- Project manager with project access
        EXISTS (
          SELECT 1 FROM project_members pm
          JOIN profiles p ON p.id = pm.user_id
          WHERE pm.project_id = i.project_id
          AND pm.user_id = auth.uid()
          AND p.role = 'PROJECT_MANAGER'
        )
      )
    )
  );

-- ===== ENHANCED AUDIT LOGGING =====

-- Function to automatically log evidence access
CREATE OR REPLACE FUNCTION log_evidence_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log evidence file access to audit table
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    metadata
  ) VALUES (
    'EVIDENCE_FILE',
    COALESCE(NEW.id::text, OLD.id::text),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'FILE_UPLOADED'
      WHEN TG_OP = 'DELETE' THEN 'FILE_DELETED'
      ELSE 'FILE_ACCESSED'
    END,
    auth.uid(),
    jsonb_build_object(
      'filename', COALESCE(NEW.name, OLD.name),
      'bucket_id', COALESCE(NEW.bucket_id, OLD.bucket_id),
      'operation', TG_OP,
      'timestamp', NOW()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for storage object access logging
DROP TRIGGER IF EXISTS evidence_access_audit ON storage.objects;
CREATE TRIGGER evidence_access_audit
  AFTER INSERT OR DELETE ON storage.objects
  FOR EACH ROW
  WHEN (OLD.bucket_id = 'evidence-files' OR NEW.bucket_id = 'evidence-files')
  EXECUTE FUNCTION log_evidence_access();

-- ===== ENHANCED PROJECT ACCESS VALIDATION =====

-- Function to check comprehensive project access
CREATE OR REPLACE FUNCTION has_comprehensive_project_access(
  user_id_param UUID,
  project_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_member BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = user_id_param;
  
  -- Check project membership
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = project_id_param
    AND user_id = user_id_param
  ) INTO is_member;
  
  -- Executives have access to all projects
  IF user_role = 'EXECUTIVE' THEN
    RETURN TRUE;
  END IF;
  
  -- Others need explicit project membership
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== ROLE TRANSITION SECURITY =====

-- Function to validate role transitions
CREATE OR REPLACE FUNCTION validate_role_transition()
RETURNS TRIGGER AS $$
DECLARE
  old_role TEXT;
  new_role TEXT;
  transition_allowed BOOLEAN := FALSE;
BEGIN
  old_role := OLD.role;
  new_role := NEW.role;
  
  -- Same role, no validation needed
  IF old_role = new_role THEN
    RETURN NEW;
  END IF;
  
  -- Check transition permissions based on current user role
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND (
      -- Project managers can promote inspectors
      (p.role = 'PROJECT_MANAGER' AND old_role = 'INSPECTOR' AND new_role = 'PROJECT_MANAGER') OR
      -- Executives can make any role change
      p.role = 'EXECUTIVE' OR
      -- System/service role (for initial setup)
      auth.uid() = NEW.id
    )
  ) INTO transition_allowed;
  
  IF NOT transition_allowed THEN
    RAISE EXCEPTION 'Unauthorized role transition from % to %', old_role, new_role;
  END IF;
  
  -- Log role transition
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    metadata
  ) VALUES (
    'USER_ROLE',
    NEW.id::text,
    'ROLE_CHANGED',
    auth.uid(),
    jsonb_build_object(
      'from_role', old_role,
      'to_role', new_role,
      'target_user_id', NEW.id,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for role transition validation
DROP TRIGGER IF EXISTS validate_role_transition_trigger ON profiles;
CREATE TRIGGER validate_role_transition_trigger
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_role_transition();

-- ===== ENHANCED INSPECTION WORKFLOW SECURITY =====

-- Function to validate inspection status transitions
CREATE OR REPLACE FUNCTION validate_inspection_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  old_status TEXT;
  new_status TEXT;
  user_role TEXT;
  is_assigned BOOLEAN;
  is_project_manager BOOLEAN;
BEGIN
  old_status := OLD.status;
  new_status := NEW.status;
  
  -- Same status, no validation needed
  IF old_status = new_status THEN
    RETURN NEW;
  END IF;
  
  -- Get current user context
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user is assigned to inspection
  is_assigned := (OLD.assigned_to = auth.uid());
  
  -- Check if user is project manager for this project
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = NEW.project_id
    AND pm.user_id = auth.uid()
    AND user_role = 'PROJECT_MANAGER'
  ) INTO is_project_manager;
  
  -- Validate status transitions based on role and current status
  CASE 
    WHEN old_status = 'DRAFT' AND new_status = 'PENDING' THEN
      -- Only assigned inspector can submit
      IF NOT is_assigned OR user_role != 'INSPECTOR' THEN
        RAISE EXCEPTION 'Only assigned inspector can submit inspection';
      END IF;
      
    WHEN old_status = 'PENDING' AND new_status IN ('APPROVED', 'REJECTED') THEN
      -- Only project managers can approve/reject
      IF NOT is_project_manager THEN
        RAISE EXCEPTION 'Only project managers can approve or reject inspections';
      END IF;
      
    WHEN old_status = 'REJECTED' AND new_status = 'PENDING' THEN
      -- Only assigned inspector can resubmit
      IF NOT is_assigned OR user_role != 'INSPECTOR' THEN
        RAISE EXCEPTION 'Only assigned inspector can resubmit rejected inspection';
      END IF;
      
    WHEN old_status IN ('APPROVED', 'COMPLETED') THEN
      -- Completed inspections cannot be modified by inspectors
      IF user_role = 'INSPECTOR' THEN
        RAISE EXCEPTION 'Cannot modify completed inspections';
      END IF;
      
    ELSE
      -- Invalid transition
      RAISE EXCEPTION 'Invalid status transition from % to %', old_status, new_status;
  END CASE;
  
  -- Log status change
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    metadata
  ) VALUES (
    'INSPECTION',
    NEW.id::text,
    'STATUS_CHANGED',
    auth.uid(),
    jsonb_build_object(
      'from_status', old_status,
      'to_status', new_status,
      'user_role', user_role,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inspection status transition validation
DROP TRIGGER IF EXISTS validate_inspection_status_trigger ON inspections;
CREATE TRIGGER validate_inspection_status_trigger
  BEFORE UPDATE OF status ON inspections
  FOR EACH ROW
  EXECUTE FUNCTION validate_inspection_status_transition();

-- ===== INDEXES FOR PERFORMANCE =====

-- Add indexes for frequently queried permission-related columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_members_user_project 
  ON project_members(user_id, project_id);
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_active 
  ON profiles(role, is_active);
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inspections_assigned_status 
  ON inspections(assigned_to, status);
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_inspection_uploader 
  ON evidence(inspection_id, uploaded_by);
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_user 
  ON audit_logs(entity_type, user_id, created_at);

-- Add partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_profiles 
  ON profiles(id) WHERE is_active = true;
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_inspections 
  ON inspections(assigned_to, due_date) WHERE status IN ('DRAFT', 'PENDING');

-- ===== COMMENTS FOR DOCUMENTATION =====

COMMENT ON POLICY "Secure evidence upload" ON storage.objects IS 
'Validates evidence uploads against inspection assignment and status';

COMMENT ON POLICY "Secure evidence download" ON storage.objects IS 
'Enforces role-based access control for evidence file downloads using database validation';

COMMENT ON POLICY "Secure evidence deletion" ON storage.objects IS 
'Allows evidence deletion only by uploader or project managers for draft/pending inspections';

COMMENT ON FUNCTION has_comprehensive_project_access(UUID, UUID) IS 
'Validates project access considering role hierarchies and explicit membership';

COMMENT ON FUNCTION validate_role_transition() IS 
'Enforces role transition rules and logs all role changes for audit trail';

COMMENT ON FUNCTION validate_inspection_status_transition() IS 
'Validates inspection workflow state transitions based on user role and business rules';