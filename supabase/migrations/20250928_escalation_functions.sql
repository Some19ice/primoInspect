-- Escalation Queue Functions
-- T051: Add real-time escalation notification functions

-- Function to increment escalation notification count
CREATE OR REPLACE FUNCTION increment_escalation_notifications(escalation_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE escalation_queue 
  SET 
    notification_count = notification_count + 1,
    status = CASE 
      WHEN status = 'QUEUED' THEN 'NOTIFIED'::escalation_status
      ELSE status 
    END
  WHERE id = escalation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create escalation with notification
CREATE OR REPLACE FUNCTION create_escalation_with_notification(
  p_inspection_id uuid,
  p_original_manager_id uuid,
  p_escalation_reason text,
  p_priority_level escalation_priority DEFAULT 'MEDIUM'
) RETURNS uuid AS $$
DECLARE
  escalation_id uuid;
  inspection_title text;
  project_name text;
BEGIN
  -- Get inspection and project details
  SELECT i.title, p.name 
  INTO inspection_title, project_name
  FROM inspections i
  JOIN projects p ON i.project_id = p.id
  WHERE i.id = p_inspection_id;

  -- Create escalation record
  INSERT INTO escalation_queue (
    inspection_id,
    original_manager_id,
    escalation_reason,
    priority_level,
    status,
    escalation_threshold_hours,
    notification_count,
    expires_at
  ) VALUES (
    p_inspection_id,
    p_original_manager_id,
    p_escalation_reason,
    p_priority_level,
    'QUEUED',
    24, -- 24 hours default
    0,
    NOW() + INTERVAL '24 hours'
  ) RETURNING id INTO escalation_id;

  -- Create notification for managers
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    priority,
    delivery_channel
  )
  SELECT 
    pm.user_id,
    'ESCALATION',
    'Inspection Escalation: ' || COALESCE(inspection_title, 'Unknown'),
    'Inspection "' || COALESCE(inspection_title, 'Unknown') || '" in project "' || COALESCE(project_name, 'Unknown') || '" has been escalated due to: ' || p_escalation_reason,
    'INSPECTION',
    p_inspection_id::text,
    CASE p_priority_level
      WHEN 'URGENT' THEN 'HIGH'
      WHEN 'HIGH' THEN 'HIGH'
      ELSE 'MEDIUM'
    END,
    'IN_APP'
  FROM project_members pm
  JOIN inspections i ON i.project_id = pm.project_id
  WHERE i.id = p_inspection_id 
    AND pm.role = 'MANAGER'
    AND pm.user_id != p_original_manager_id; -- Don't notify the original manager

  RETURN escalation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resolve escalation
CREATE OR REPLACE FUNCTION resolve_escalation(escalation_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE escalation_queue 
  SET 
    status = 'RESOLVED',
    resolved_at = NOW()
  WHERE id = escalation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get escalation metrics for dashboard
CREATE OR REPLACE FUNCTION get_escalation_metrics(manager_id uuid)
RETURNS TABLE (
  total_escalations bigint,
  active_escalations bigint,
  urgent_escalations bigint,
  expired_escalations bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_escalations,
    COUNT(*) FILTER (WHERE eq.status IN ('QUEUED', 'NOTIFIED')) as active_escalations,
    COUNT(*) FILTER (WHERE eq.status IN ('QUEUED', 'NOTIFIED') AND eq.priority_level = 'URGENT') as urgent_escalations,
    COUNT(*) FILTER (WHERE eq.status = 'EXPIRED') as expired_escalations
  FROM escalation_queue eq
  JOIN inspections i ON eq.inspection_id = i.id
  JOIN project_members pm ON i.project_id = pm.project_id
  WHERE pm.user_id = manager_id AND pm.role = 'MANAGER';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_escalation_notifications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_escalation_with_notification(uuid, uuid, text, escalation_priority) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_escalation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_escalation_metrics(uuid) TO authenticated;