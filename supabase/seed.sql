-- PrimoInspect Demo Data Seed
-- This file populates the database with realistic renewable energy project data
-- for testing and demonstration purposes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data (be careful in production!)
TRUNCATE TABLE audit_logs, reports, notifications, approvals, evidence, inspections, checklists, project_members, projects, profiles CASCADE;

-- =======================
-- DEMO USER PROFILES
-- =======================
-- Note: These profiles will be linked to Supabase Auth users
-- In production, profiles are created automatically via trigger

-- Executive Users
INSERT INTO profiles (id, email, name, role, is_active, created_at, last_login_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'sarah.chen@primoinspect.com', 'Sarah Chen', 'EXECUTIVE', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 'michael.rodriguez@primoinspect.com', 'Michael Rodriguez', 'EXECUTIVE', true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 day');

-- Project Managers
INSERT INTO profiles (id, email, name, role, is_active, created_at, last_login_at) VALUES
  ('33333333-3333-3333-3333-333333333333', 'jennifer.park@primoinspect.com', 'Jennifer Park', 'PROJECT_MANAGER', true, NOW() - INTERVAL '28 days', NOW() - INTERVAL '30 minutes'),
  ('44444444-4444-4444-4444-444444444444', 'david.thompson@primoinspect.com', 'David Thompson', 'PROJECT_MANAGER', true, NOW() - INTERVAL '22 days', NOW() - INTERVAL '1 hour'),
  ('55555555-5555-5555-5555-555555555555', 'lisa.wang@primoinspect.com', 'Lisa Wang', 'PROJECT_MANAGER', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '4 hours');

-- Inspectors
INSERT INTO profiles (id, email, name, role, is_active, created_at, last_login_at) VALUES
  ('66666666-6666-6666-6666-666666666666', 'james.martinez@primoinspect.com', 'James Martinez', 'INSPECTOR', true, NOW() - INTERVAL '26 days', NOW() - INTERVAL '15 minutes'),
  ('77777777-7777-7777-7777-777777777777', 'emma.johnson@primoinspect.com', 'Emma Johnson', 'INSPECTOR', true, NOW() - INTERVAL '24 days', NOW() - INTERVAL '45 minutes'),
  ('88888888-8888-8888-8888-888888888888', 'carlos.garcia@primoinspect.com', 'Carlos Garcia', 'INSPECTOR', true, NOW() - INTERVAL '21 days', NOW() - INTERVAL '2 hours'),
  ('99999999-9999-9999-9999-999999999999', 'michelle.lee@primoinspect.com', 'Michelle Lee', 'INSPECTOR', true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '1 hour'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'robert.brown@primoinspect.com', 'Robert Brown', 'INSPECTOR', true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '20 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sophia.davis@primoinspect.com', 'Sophia Davis', 'INSPECTOR', true, NOW() - INTERVAL '17 days', NOW() - INTERVAL '3 hours');

-- =======================
-- RENEWABLE ENERGY PROJECTS
-- =======================

INSERT INTO projects (id, name, description, status, start_date, end_date, latitude, longitude, address, created_at) VALUES
  -- Active Solar Projects
  ('proj-1111-1111-1111-111111111111', 'Desert Sun Solar Farm', 'Large-scale photovoltaic installation in Arizona desert with 500MW capacity. Features advanced tracking systems and energy storage integration.', 'ACTIVE', NOW() - INTERVAL '6 months', NOW() + INTERVAL '3 months', 33.4484, -112.0740, 'Phoenix, AZ 85001', NOW() - INTERVAL '6 months'),
  
  ('proj-2222-2222-2222-222222222222', 'Coastal Wind Project Alpha', 'Offshore wind farm with 50 turbines generating 300MW. Located 15 miles off the coast with submarine cable connection.', 'ACTIVE', NOW() - INTERVAL '8 months', NOW() + INTERVAL '6 months', 40.7128, -74.0060, 'New York, NY 10001', NOW() - INTERVAL '8 months'),
  
  ('proj-3333-3333-3333-333333333333', 'Green Valley Solar Installation', 'Community solar project serving 1,200 households with battery storage system for grid stability.', 'ACTIVE', NOW() - INTERVAL '4 months', NOW() + INTERVAL '2 months', 37.7749, -122.4194, 'San Francisco, CA 94101', NOW() - INTERVAL '4 months'),
  
  -- Recently Completed Projects
  ('proj-4444-4444-4444-444444444444', 'Mountain Ridge Wind Farm', 'Completed wind installation with 25 turbines in mountainous terrain. All inspections passed final certification.', 'COMPLETED', NOW() - INTERVAL '12 months', NOW() - INTERVAL '1 month', 39.7392, -104.9903, 'Denver, CO 80201', NOW() - INTERVAL '12 months'),
  
  -- Projects on Hold
  ('proj-5555-5555-5555-555555555555', 'Prairie Wind Development', 'Wind project temporarily on hold due to permit delays. Environmental impact assessments in progress.', 'ON_HOLD', NOW() - INTERVAL '3 months', NULL, 41.8781, -87.6298, 'Chicago, IL 60601', NOW() - INTERVAL '3 months'),
  
  -- New Projects
  ('proj-6666-6666-6666-666666666666', 'Solar Rooftop Initiative', 'Distributed solar installation across 200 commercial buildings in the metro area.', 'ACTIVE', NOW() - INTERVAL '1 month', NOW() + INTERVAL '8 months', 29.7604, -95.3698, 'Houston, TX 77001', NOW() - INTERVAL '1 month');

-- =======================
-- PROJECT TEAM ASSIGNMENTS
-- =======================

-- Desert Sun Solar Farm Team
INSERT INTO project_members (project_id, user_id, role, created_at) VALUES
  ('proj-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'EXECUTIVE', NOW() - INTERVAL '6 months'),
  ('proj-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'PROJECT_MANAGER', NOW() - INTERVAL '6 months'),
  ('proj-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'INSPECTOR', NOW() - INTERVAL '6 months'),
  ('proj-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'INSPECTOR', NOW() - INTERVAL '5 months'),
  ('proj-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'INSPECTOR', NOW() - INTERVAL '4 months');

-- Coastal Wind Project Alpha Team
INSERT INTO project_members (project_id, user_id, role, created_at) VALUES
  ('proj-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'EXECUTIVE', NOW() - INTERVAL '8 months'),
  ('proj-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'PROJECT_MANAGER', NOW() - INTERVAL '8 months'),
  ('proj-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'INSPECTOR', NOW() - INTERVAL '7 months'),
  ('proj-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'INSPECTOR', NOW() - INTERVAL '6 months');

-- Green Valley Solar Installation Team
INSERT INTO project_members (project_id, user_id, role, created_at) VALUES
  ('proj-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'EXECUTIVE', NOW() - INTERVAL '4 months'),
  ('proj-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'PROJECT_MANAGER', NOW() - INTERVAL '4 months'),
  ('proj-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'INSPECTOR', NOW() - INTERVAL '4 months'),
  ('proj-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'INSPECTOR', NOW() - INTERVAL '3 months');

-- Mountain Ridge Wind Farm Team (Completed)
INSERT INTO project_members (project_id, user_id, role, created_at) VALUES
  ('proj-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'EXECUTIVE', NOW() - INTERVAL '12 months'),
  ('proj-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'PROJECT_MANAGER', NOW() - INTERVAL '12 months'),
  ('proj-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'INSPECTOR', NOW() - INTERVAL '12 months');

-- Solar Rooftop Initiative Team
INSERT INTO project_members (project_id, user_id, role, created_at) VALUES
  ('proj-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'EXECUTIVE', NOW() - INTERVAL '1 month'),
  ('proj-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'PROJECT_MANAGER', NOW() - INTERVAL '1 month'),
  ('proj-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'INSPECTOR', NOW() - INTERVAL '1 month'),
  ('proj-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999', 'INSPECTOR', NOW() - INTERVAL '3 weeks');

-- =======================
-- INSPECTION CHECKLISTS
-- =======================

-- Solar Panel Installation Checklist
INSERT INTO checklists (id, project_id, name, description, version, is_active, questions, created_by, created_at) VALUES
  ('check-1111-1111-1111-111111111111', 'proj-1111-1111-1111-111111111111', 'Solar Panel Safety & Installation Check', 'Comprehensive checklist for solar panel installation verification and safety compliance', '2.1', true, 
  '[
    {
      "id": "sp-001",
      "question": "Are all solar panels properly secured to mounting structures?",
      "type": "boolean",
      "required": true,
      "category": "Installation"
    },
    {
      "id": "sp-002", 
      "question": "Verify DC voltage readings are within acceptable range (specify values)",
      "type": "number",
      "required": true,
      "category": "Electrical",
      "min": 300,
      "max": 600
    },
    {
      "id": "sp-003",
      "question": "Are all electrical connections weatherproofed and secure?",
      "type": "boolean",
      "required": true,
      "category": "Electrical"
    },
    {
      "id": "sp-004",
      "question": "Document any visible damage or defects",
      "type": "text",
      "required": false,
      "category": "Quality"
    },
    {
      "id": "sp-005",
      "question": "Overall installation quality rating",
      "type": "rating",
      "required": true,
      "category": "Quality",
      "scale": 5
    }
  ]', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '6 months');

-- Wind Turbine Inspection Checklist
INSERT INTO checklists (id, project_id, name, description, version, is_active, questions, created_by, created_at) VALUES
  ('check-2222-2222-2222-222222222222', 'proj-2222-2222-2222-222222222222', 'Wind Turbine Operational Safety Check', 'Critical safety and operational verification for wind turbine installations', '1.8', true,
  '[
    {
      "id": "wt-001",
      "question": "Tower foundation shows no signs of settling or damage?",
      "type": "boolean",
      "required": true,
      "category": "Structural"
    },
    {
      "id": "wt-002",
      "question": "Blade clearance measurements (minimum distance to ground)",
      "type": "number",
      "required": true,
      "category": "Safety",
      "min": 30
    },
    {
      "id": "wt-003",
      "question": "Are safety systems (emergency brake, yaw control) functional?",
      "type": "boolean",
      "required": true,
      "category": "Safety"
    },
    {
      "id": "wt-004",
      "question": "Record wind speed during inspection",
      "type": "number",
      "required": true,
      "category": "Environmental"
    },
    {
      "id": "wt-005",
      "question": "Nacelle access systems secure and operational?",
      "type": "boolean",
      "required": true,
      "category": "Safety"
    }
  ]', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '8 months');

-- Battery Storage System Checklist
INSERT INTO checklists (id, project_id, name, description, version, is_active, questions, created_by, created_at) VALUES
  ('check-3333-3333-3333-333333333333', 'proj-3333-3333-3333-333333333333', 'Battery Storage System Inspection', 'Safety and performance verification for energy storage systems', '1.3', true,
  '[
    {
      "id": "bs-001",
      "question": "Battery enclosure temperature within operating range?",
      "type": "number",
      "required": true,
      "category": "Environmental",
      "min": 10,
      "max": 35
    },
    {
      "id": "bs-002",
      "question": "Fire suppression system operational and accessible?",
      "type": "boolean",
      "required": true,
      "category": "Safety"
    },
    {
      "id": "bs-003",
      "question": "State of charge percentage at time of inspection",
      "type": "number",
      "required": true,
      "category": "Performance",
      "min": 0,
      "max": 100
    },
    {
      "id": "bs-004",
      "question": "Verify all safety interlocks are functioning",
      "type": "boolean",
      "required": true,
      "category": "Safety"
    }
  ]', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '4 months');

-- =======================
-- INSPECTION RECORDS
-- =======================

-- Desert Sun Solar Farm Inspections
INSERT INTO inspections (id, project_id, checklist_id, assigned_to, title, description, status, priority, due_date, latitude, longitude, accuracy, address, responses, rejection_count, created_at, updated_at, submitted_at, completed_at) VALUES
  -- Completed inspections
  ('insp-1001', 'proj-1111-1111-1111-111111111111', 'check-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'Array Section A1-A5 Installation Check', 'Initial installation verification for solar array sections A1 through A5', 'APPROVED', 'HIGH', NOW() - INTERVAL '3 days', 33.4484, -112.0740, 5.2, 'Phoenix, AZ - Array Section A', '{"sp-001": true, "sp-002": 485, "sp-003": true, "sp-004": "Minor scuff on panel A3-12, does not affect functionality", "sp-005": 4}', 0, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  
  ('insp-1002', 'proj-1111-1111-1111-111111111111', 'check-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Array Section B1-B8 Installation Check', 'Secondary array installation verification', 'APPROVED', 'MEDIUM', NOW() - INTERVAL '1 day', 33.4494, -112.0750, 4.8, 'Phoenix, AZ - Array Section B', '{"sp-001": true, "sp-002": 492, "sp-003": true, "sp-004": "", "sp-005": 5}', 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours'),
  
  -- Pending approvals
  ('insp-1003', 'proj-1111-1111-1111-111111111111', 'check-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'Inverter Station 1 Commissioning', 'Pre-commissioning inspection of primary inverter station', 'IN_REVIEW', 'HIGH', NOW() + INTERVAL '2 days', 33.4474, -112.0730, 6.1, 'Phoenix, AZ - Inverter Station 1', '{"sp-001": true, "sp-002": 478, "sp-003": true, "sp-004": "All systems nominal", "sp-005": 5}', 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NULL),
  
  -- Current assignments
  ('insp-1004', 'proj-1111-1111-1111-111111111111', 'check-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'Array Section C1-C6 Final Check', 'Final verification before grid connection', 'ASSIGNED', 'HIGH', NOW() + INTERVAL '1 day', 33.4464, -112.0720, NULL, 'Phoenix, AZ - Array Section C', '{}', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL, NULL);

-- Coastal Wind Project Inspections
INSERT INTO inspections (id, project_id, checklist_id, assigned_to, title, description, status, priority, due_date, latitude, longitude, accuracy, address, responses, rejection_count, created_at, updated_at, submitted_at, completed_at) VALUES
  ('insp-2001', 'proj-2222-2222-2222-222222222222', 'check-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'Turbine WT-001 Commissioning Check', 'Pre-operational safety verification for first turbine', 'APPROVED', 'HIGH', NOW() - INTERVAL '7 days', 40.7128, -74.0060, 8.3, 'Offshore Platform Alpha - Turbine 1', '{"wt-001": true, "wt-002": 45, "wt-003": true, "wt-004": 12, "wt-005": true}', 0, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days'),
  
  ('insp-2002', 'proj-2222-2222-2222-222222222222', 'check-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Turbine WT-005 Safety Inspection', 'Routine safety inspection after 1000 operating hours', 'REJECTED', 'MEDIUM', NOW() - INTERVAL '2 days', 40.7138, -74.0070, 7.9, 'Offshore Platform Alpha - Turbine 5', '{"wt-001": true, "wt-002": 42, "wt-003": false, "wt-004": 15, "wt-005": true}', 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NULL),
  
  ('insp-2003', 'proj-2222-2222-2222-222222222222', 'check-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'Cable Installation Verification', 'Submarine cable routing and connection verification', 'IN_REVIEW', 'HIGH', NOW() + INTERVAL '3 days', 40.7148, -74.0080, 9.1, 'Offshore Platform Beta - Cable Junction', '{"wt-001": true, "wt-002": 50, "wt-003": true, "wt-004": 18, "wt-005": true}', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NULL);

-- Green Valley Solar Inspections
INSERT INTO inspections (id, project_id, checklist_id, assigned_to, title, description, status, priority, due_date, latitude, longitude, accuracy, address, responses, rejection_count, created_at, updated_at, submitted_at, completed_at) VALUES
  ('insp-3001', 'proj-3333-3333-3333-333333333333', 'check-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Battery Bank 1 Installation Check', 'Initial installation verification of primary battery bank', 'APPROVED', 'HIGH', NOW() - INTERVAL '5 days', 37.7749, -122.4194, 4.2, 'San Francisco, CA - Battery Facility', '{"bs-001": 22, "bs-002": true, "bs-003": 85, "bs-004": true}', 0, NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
  
  ('insp-3002', 'proj-3333-3333-3333-333333333333', 'check-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Rooftop Array Community Center', 'Solar installation on community center rooftop', 'ASSIGNED', 'MEDIUM', NOW() + INTERVAL '2 days', 37.7759, -122.4204, NULL, 'San Francisco, CA - Community Center', '{}', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL, NULL);

-- =======================
-- EVIDENCE RECORDS
-- =======================

INSERT INTO evidence (id, inspection_id, uploaded_by, filename, original_name, mime_type, file_size, url, thumbnail_url, latitude, longitude, accuracy, timestamp, verified, annotations, metadata, created_at) VALUES
  -- Evidence for completed inspection
  ('evid-1001-001', 'insp-1001', '66666666-6666-6666-6666-666666666666', 'array_a1_installation_001.jpg', 'Solar Array A1 Wide Shot.jpg', 'image/jpeg', 2048576, 'https://demo-storage.supabase.co/evidence/array_a1_installation_001.jpg', 'https://demo-storage.supabase.co/evidence/thumbs/array_a1_installation_001_thumb.jpg', 33.4484, -112.0740, 5.2, NOW() - INTERVAL '2 days', true, '[]', '{"camera": "iPhone 14 Pro", "weather": "Clear", "temperature": "75F"}', NOW() - INTERVAL '2 days'),
  
  ('evid-1001-002', 'insp-1001', '66666666-6666-6666-6666-666666666666', 'panel_damage_a3_12.jpg', 'Panel A3-12 Minor Scuff.jpg', 'image/jpeg', 1536789, 'https://demo-storage.supabase.co/evidence/panel_damage_a3_12.jpg', 'https://demo-storage.supabase.co/evidence/thumbs/panel_damage_a3_12_thumb.jpg', 33.4485, -112.0741, 4.8, NOW() - INTERVAL '2 days', true, '[{"x": 150, "y": 200, "width": 50, "height": 30, "text": "Minor scuff - cosmetic only"}]', '{"severity": "minor", "affects_performance": false}', NOW() - INTERVAL '2 days'),
  
  -- Evidence for wind turbine inspection
  ('evid-2001-001', 'insp-2001', '99999999-9999-9999-9999-999999999999', 'turbine_wt001_foundation.jpg', 'WT-001 Foundation Check.jpg', 'image/jpeg', 3072445, 'https://demo-storage.supabase.co/evidence/turbine_wt001_foundation.jpg', 'https://demo-storage.supabase.co/evidence/thumbs/turbine_wt001_foundation_thumb.jpg', 40.7128, -74.0060, 8.3, NOW() - INTERVAL '7 days', true, '[]', '{"wind_speed": "12 mph", "visibility": "excellent"}', NOW() - INTERVAL '7 days'),
  
  -- Evidence for battery inspection
  ('evid-3001-001', 'insp-3001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'battery_temp_reading.jpg', 'Battery Temperature Display.jpg', 'image/jpeg', 1024768, 'https://demo-storage.supabase.co/evidence/battery_temp_reading.jpg', 'https://demo-storage.supabase.co/evidence/thumbs/battery_temp_reading_thumb.jpg', 37.7749, -122.4194, 4.2, NOW() - INTERVAL '5 days', true, '[{"x": 100, "y": 150, "width": 80, "height": 40, "text": "Temperature: 22°C"}]', '{"temperature": 22, "humidity": 45}', NOW() - INTERVAL '5 days');

-- =======================
-- APPROVAL RECORDS
-- =======================

INSERT INTO approvals (id, inspection_id, approver_id, decision, notes, review_date, is_escalated, escalation_reason, previous_approval_id, attachments, created_at) VALUES
  -- Approved inspections
  ('appr-1001', 'insp-1001', '33333333-3333-3333-3333-333333333333', 'APPROVED', 'Installation meets all safety and quality standards. Minor cosmetic damage noted on panel A3-12 does not affect performance or safety.', NOW() - INTERVAL '1 day', false, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
  
  ('appr-1002', 'insp-1002', '33333333-3333-3333-3333-333333333333', 'APPROVED', 'Excellent installation quality. All electrical connections secure and voltage readings within specification.', NOW() - INTERVAL '6 hours', false, NULL, NULL, NULL, NOW() - INTERVAL '6 hours'),
  
  ('appr-2001', 'insp-2001', '44444444-4444-4444-4444-444444444444', 'APPROVED', 'Turbine WT-001 passes all safety checks and is ready for operational deployment. Foundation integrity confirmed.', NOW() - INTERVAL '5 days', false, NULL, NULL, NULL, NOW() - INTERVAL '5 days'),
  
  ('appr-3001', 'insp-3001', '55555555-5555-5555-5555-555555555555', 'APPROVED', 'Battery bank installation complete and all safety systems operational. Temperature monitoring within acceptable range.', NOW() - INTERVAL '3 days', false, NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
  
  -- Rejected inspection
  ('appr-2002', 'insp-2002', '44444444-4444-4444-4444-444444444444', 'REJECTED', 'Emergency brake system test failed - brake response time exceeds safety specifications. Requires immediate attention before re-inspection.', NOW() - INTERVAL '1 day', false, NULL, NULL, '{"required_actions": ["Replace brake actuator", "Test brake system response time", "Document all repairs"]}', NOW() - INTERVAL '1 day');

-- =======================
-- NOTIFICATIONS
-- =======================

INSERT INTO notifications (id, user_id, type, title, message, related_entity_type, related_entity_id, is_read, priority, delivery_channel, scheduled_for, delivered_at, created_at) VALUES
  -- Recent notifications for project managers
  ('notif-001', '33333333-3333-3333-3333-333333333333', 'APPROVAL_REQUIRED', 'New Inspection Awaiting Approval', 'Inverter Station 1 Commissioning inspection has been submitted and requires your approval.', 'INSPECTION', 'insp-1003', false, 'HIGH', 'IN_APP', NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
  
  ('notif-002', '44444444-4444-4444-4444-444444444444', 'APPROVAL_REQUIRED', 'Cable Installation Verification Ready', 'Submarine cable installation inspection is ready for your review and approval.', 'INSPECTION', 'insp-2003', false, 'HIGH', 'IN_APP', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  
  -- Inspector notifications
  ('notif-003', '66666666-6666-6666-6666-666666666666', 'ASSIGNMENT', 'New Inspection Assignment', 'You have been assigned to inspect Array Section C1-C6. Due date: tomorrow.', 'INSPECTION', 'insp-1004', false, 'HIGH', 'IN_APP', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('notif-004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'STATUS_CHANGE', 'Inspection Rejected - Action Required', 'Your Turbine WT-005 inspection has been rejected. Please review feedback and resubmit.', 'INSPECTION', 'insp-2002', true, 'HIGH', 'IN_APP', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  -- Executive notifications
  ('notif-005', '11111111-1111-1111-1111-111111111111', 'STATUS_CHANGE', 'Project Milestone Reached', 'Desert Sun Solar Farm has completed Phase 2 installation inspections.', 'PROJECT', 'proj-1111-1111-1111-111111111111', true, 'MEDIUM', 'IN_APP', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  
  -- Escalation notification
  ('notif-006', '44444444-4444-4444-4444-444444444444', 'ESCALATION', 'Inspection Requires Escalation', 'Turbine WT-005 inspection has been rejected twice and requires management review.', 'INSPECTION', 'insp-2002', false, 'HIGH', 'IN_APP', NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

-- =======================
-- REPORTS
-- =======================

INSERT INTO reports (id, project_id, template_id, title, type, status, format, url, filters, generated_by, generated_at, expires_at, created_at) VALUES
  ('report-001', 'proj-1111-1111-1111-111111111111', 'solar-compliance-v2', 'Desert Sun Solar Farm - Monthly Compliance Report', 'COMPLIANCE', 'READY', 'PDF', 'https://demo-storage.supabase.co/reports/desert_sun_compliance_jan2025.pdf', '{"date_range": {"start": "2024-12-01", "end": "2024-12-31"}, "inspection_types": ["safety", "installation"], "include_evidence": true}', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', NOW() - INTERVAL '2 days'),
  
  ('report-002', 'proj-2222-2222-2222-222222222222', 'wind-progress-v1', 'Coastal Wind Project - Progress Summary', 'PROGRESS', 'READY', 'PDF', 'https://demo-storage.supabase.co/reports/coastal_wind_progress_jan2025.pdf', '{"date_range": {"start": "2024-11-01", "end": "2024-12-31"}, "include_kpis": true, "include_photos": true}', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day', NOW() + INTERVAL '28 days', NOW() - INTERVAL '1 day'),
  
  ('report-003', 'proj-4444-4444-4444-444444444444', 'final-certification-v1', 'Mountain Ridge Wind Farm - Final Certification Report', 'COMPLIANCE', 'READY', 'PDF', 'https://demo-storage.supabase.co/reports/mountain_ridge_final_cert.pdf', '{"certification_level": "final", "include_all_inspections": true, "regulatory_compliance": true}', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 month', NOW() + INTERVAL '5 years', NOW() - INTERVAL '1 month');

-- =======================
-- AUDIT LOGS
-- =======================

INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, metadata, created_at) VALUES
  ('audit-001', 'INSPECTION', 'insp-1001', 'CREATED', '33333333-3333-3333-3333-333333333333', '{"assigned_to": "James Martinez", "priority": "HIGH", "due_date": "2025-01-24"}', NOW() - INTERVAL '5 days'),
  ('audit-002', 'INSPECTION', 'insp-1001', 'SUBMITTED', '66666666-6666-6666-6666-666666666666', '{"responses_count": 5, "evidence_count": 2}', NOW() - INTERVAL '2 days'),
  ('audit-003', 'INSPECTION', 'insp-1001', 'APPROVED', '33333333-3333-3333-3333-333333333333', '{"approval_notes": "Installation meets standards", "review_duration_minutes": 15}', NOW() - INTERVAL '1 day'),
  ('audit-004', 'INSPECTION', 'insp-2002', 'REJECTED', '44444444-4444-4444-4444-444444444444', '{"rejection_reason": "Safety system failure", "rejection_count": 1}', NOW() - INTERVAL '1 day'),
  ('audit-005', 'EVIDENCE', 'evid-1001-001', 'UPLOADED', '66666666-6666-6666-6666-666666666666', '{"file_size": 2048576, "mime_type": "image/jpeg", "has_location": true}', NOW() - INTERVAL '2 days'),
  ('audit-006', 'PROJECT', 'proj-4444-4444-4444-444444444444', 'STATUS_CHANGED', '44444444-4444-4444-4444-444444444444', '{"old_status": "ACTIVE", "new_status": "COMPLETED", "completion_date": "2024-12-01"}', NOW() - INTERVAL '1 month'),
  ('audit-007', 'REPORT', 'report-001', 'GENERATED', '33333333-3333-3333-3333-333333333333', '{"report_type": "COMPLIANCE", "format": "PDF", "page_count": 24}', NOW() - INTERVAL '2 days');

-- =======================
-- UPDATE STATISTICS
-- =======================

-- Update project statistics based on inspection data
UPDATE projects SET 
  updated_at = NOW() - INTERVAL '1 day'
WHERE id IN (
  'proj-1111-1111-1111-111111111111',
  'proj-2222-2222-2222-222222222222',
  'proj-3333-3333-3333-333333333333'
);

-- Update user last_login_at for active users
UPDATE profiles SET 
  last_login_at = NOW() - INTERVAL '1 hour'
WHERE role = 'PROJECT_MANAGER';

-- =======================
-- SUMMARY COMMENT
-- =======================

-- This seed data provides:
-- • 2 Executive users
-- • 3 Project Manager users  
-- • 6 Inspector users
-- • 6 Renewable energy projects (solar, wind, battery storage)
-- • 15+ team assignments across projects
-- • 3 Different inspection checklists (solar, wind, battery)
-- • 10+ Inspection records in various states (draft, pending, approved, rejected)
-- • Evidence files with GPS metadata and annotations
-- • Approval records with detailed notes
-- • Real-time notifications for different user types
-- • Generated reports for compliance and progress tracking
-- • Comprehensive audit trail of all activities
--
-- All data represents realistic renewable energy inspection scenarios
-- with proper relationships and realistic timestamps for demo purposes.