-- Enhanced Operational Workflows (Session 2025-01-27)
-- Manager-mediated conflict resolution, escalation queues, and role transitions

-- ConflictResolution table for manager-mediated dispute handling
CREATE TABLE conflict_resolutions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
  triggered_by_evidence_ids UUID[] NOT NULL, -- Array of conflicting evidence IDs
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('EVIDENCE_DISPUTE', 'STATUS_CONFLICT', 'LOCATION_MISMATCH')),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED')),
  assigned_manager_id UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EscalationQueue table for delayed-approval management
CREATE TABLE escalation_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
  original_manager_id UUID REFERENCES profiles(id) NOT NULL,
  escalation_reason TEXT NOT NULL,
  priority_level TEXT DEFAULT 'MEDIUM' CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'NOTIFIED', 'RESOLVED', 'EXPIRED')),
  manager_last_seen TIMESTAMPTZ,
  escalation_threshold_hours INTEGER DEFAULT 4,
  notification_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- RoleTransition table for project-completion boundary changes
CREATE TABLE role_transitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_role TEXT NOT NULL,
  to_role TEXT NOT NULL,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  transition_type TEXT DEFAULT 'PROJECT_BOUNDARY' CHECK (transition_type IN ('PROJECT_BOUNDARY', 'IMMEDIATE', 'SCHEDULED')),
  affected_projects UUID[], -- Projects where old role remains until completion
  new_projects_only BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_conflict_resolutions_inspection_id ON conflict_resolutions(inspection_id);
CREATE INDEX idx_conflict_resolutions_status ON conflict_resolutions(status);
CREATE INDEX idx_conflict_resolutions_assigned_manager ON conflict_resolutions(assigned_manager_id);

CREATE INDEX idx_escalation_queue_inspection_id ON escalation_queue(inspection_id);
CREATE INDEX idx_escalation_queue_manager_id ON escalation_queue(original_manager_id);
CREATE INDEX idx_escalation_queue_status ON escalation_queue(status);
CREATE INDEX idx_escalation_queue_created_at ON escalation_queue(created_at);

CREATE INDEX idx_role_transitions_user_id ON role_transitions(user_id);
CREATE INDEX idx_role_transitions_status ON role_transitions(status);
CREATE INDEX idx_role_transitions_effective_date ON role_transitions(effective_date);

-- Row Level Security (RLS) policies for operational workflows

-- ConflictResolution RLS policies
ALTER TABLE conflict_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view conflicts in their projects" ON conflict_resolutions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE i.id = conflict_resolutions.inspection_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('PROJECT_MANAGER', 'EXECUTIVE')
    )
  );

CREATE POLICY "Managers can create conflict resolutions" ON conflict_resolutions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE i.id = conflict_resolutions.inspection_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'PROJECT_MANAGER'
    )
  );

CREATE POLICY "Assigned managers can update conflicts" ON conflict_resolutions
  FOR UPDATE USING (assigned_manager_id = auth.uid());

-- EscalationQueue RLS policies
ALTER TABLE escalation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view escalations for their inspections" ON escalation_queue
  FOR SELECT USING (
    original_manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM inspections i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE i.id = escalation_queue.inspection_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('PROJECT_MANAGER', 'EXECUTIVE')
    )
  );

CREATE POLICY "System can create escalations" ON escalation_queue
  FOR INSERT WITH CHECK (true); -- System-generated, controlled by application logic

-- RoleTransition RLS policies
ALTER TABLE role_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role transitions" ON role_transitions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Project managers can view role transitions" ON role_transitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('PROJECT_MANAGER', 'EXECUTIVE')
    )
  );

CREATE POLICY "Project managers can create role transitions" ON role_transitions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'PROJECT_MANAGER'
    )
  );