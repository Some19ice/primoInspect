-- Fix RLS policies for projects table
DROP POLICY IF EXISTS "Project managers can create projects" ON projects;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Project managers can update their projects" ON projects;

-- Simplified policies that work with auth metadata
CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view projects they created or are members of" ON projects
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update projects they manage" ON projects
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.role = 'PROJECT_MANAGER'
    )
  );
