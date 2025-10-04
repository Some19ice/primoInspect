# Data Model: PrimoInspect Digital Inspection Platform

**Phase 1 Design Output** | **Date**: 2025-01-27 | **Feature**: 001-primoinspect-digital-inspection
**Architecture**: Supabase Backend-as-a-Service with Enhanced Real-time Capabilities and Conflict Resolution
**Updated**: Enhanced with Session 2025-01-27 clarifications for operational workflows

## Entity Relationships Overview

```
Supabase Auth Users (1) -----> (*) Profile -----> (*) ProjectMember
                                   |                     |
                                   |                     v
                                   v                 Project (1) -----> (*) Inspection
Evidence (*) <----- Inspection <--+                     |                     |
   |                     |                             |                     |
   |                     |                             v                     v
   v                     v                         Checklist           Approval
Location/Timestamp   Notification <----- User                            |
   |                                                                     v
   v                                                              Real-time Updates
ConflictResolution <---> Evidence (disputed evidence tracking)              |
   |                                                                        v
   v                                                              EscalationQueue
Manager Resolution Interface                                 (delayed approvals)
```

## Core Entities

### Profile (Linked to Supabase Auth)

Represents user profiles connected to Supabase authentication system with role-based access.

**Supabase Schema**:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'INSPECTOR' CHECK (role IN ('EXECUTIVE', 'PROJECT_MANAGER', 'INSPECTOR')),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**TypeScript Interface**:
```typescript
interface Profile {
  id: string // UUID from Supabase Auth
  email: string
  name: string
  role: 'EXECUTIVE' | 'PROJECT_MANAGER' | 'INSPECTOR'
  avatar?: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  updatedAt: string
}
```

**Validation Rules**:
- Email must be unique and valid format
- Name required, 1-100 characters
- Role must be one of three defined values
- Avatar URL optional, must be valid URL if provided
- Real-time presence tracking for active users

**Row Level Security**:
```sql
-- Users can only view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Project

Represents renewable energy projects with real-time collaboration capabilities.

**Supabase Schema**:
```sql
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  latitude FLOAT,
  longitude FLOAT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Real-time Subscriptions**:
```typescript
// Subscribe to project updates
supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects',
    filter: `id=eq.${projectId}`
  }, (payload) => {
    // Handle real-time project updates
  })
  .subscribe()
```

**Validation Rules**:
- Name required and unique across organization
- Start date required, must be valid date
- End date optional, must be after start date if provided
- Location coordinates optional, must be valid lat/lng if provided
- Maximum 10 team members per project (from clarifications)
- Real-time status updates broadcast to all project members

### Inspection

Individual inspection instances with real-time status tracking and evidence management.

**Supabase Schema**:
```sql
CREATE TABLE inspections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  checklist_id UUID REFERENCES checklists(id) NOT NULL,
  assigned_to UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  due_date TIMESTAMPTZ,
  latitude FLOAT,
  longitude FLOAT,
  accuracy FLOAT,
  address TEXT,
  responses JSONB DEFAULT '{}',
  rejection_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Real-time Features**:
- Status changes broadcast instantly to relevant users
- Evidence uploads trigger real-time notifications
- Approval decisions update status across all connected clients
- Escalation alerts sent in real-time after 2 rejections

**Row Level Security**:
```sql
-- Inspectors can view assigned inspections, managers can view all in their projects
CREATE POLICY "Inspection access based on role and assignment" ON inspections
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN profiles p ON p.id = pm.user_id
      WHERE pm.project_id = inspections.project_id
      AND pm.user_id = auth.uid()
      AND p.role IN ('PROJECT_MANAGER', 'EXECUTIVE')
    )
  );
```

### Evidence (Supabase Storage Integration)

Media files stored in Supabase Storage with metadata and real-time upload notifications.

**Supabase Schema**:
```sql
CREATE TABLE evidence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  public_url TEXT, -- CDN URL for public access
  signed_url_expires_at TIMESTAMPTZ, -- For private files
  latitude FLOAT,
  longitude FLOAT,
  accuracy FLOAT,
  timestamp TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  annotations JSONB,
  metadata JSONB, -- EXIF, dimensions, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Supabase Storage Configuration**:
```sql
-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence-files', 'evidence-files', false);

-- Storage policies for evidence access
CREATE POLICY "Evidence upload policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Evidence access policy" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated'
  );
```

**Real-time Upload Notifications**:
```typescript
// Subscribe to evidence uploads for an inspection
supabase
  .channel(`evidence:${inspectionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'evidence',
    filter: `inspection_id=eq.${inspectionId}`
  }, (payload) => {
    // Handle real-time evidence upload
    notifyInspectionParticipants(payload.new)
  })
  .subscribe()
```

**Validation Rules**:
- File size maximum 50MB per file (from clarifications)
- Total inspection evidence maximum 1GB (from clarifications)
- Supported formats: images (JPEG, PNG, WebP) and videos (MP4, MOV)
- Location and timestamp required for compliance
- Real-time upload progress and completion notifications

### Approval (Real-time Workflow)

Decision records with real-time notifications and escalation handling.

**Supabase Schema**:
```sql
CREATE TABLE approvals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE NOT NULL,
  approver_id UUID REFERENCES profiles(id) NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  notes TEXT NOT NULL,
  review_date TIMESTAMPTZ DEFAULT NOW(),
  is_escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  previous_approval_id UUID REFERENCES approvals(id),
  attachments JSONB, -- Array of evidence IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Real-time Escalation Logic**:
```typescript
// Automatic escalation after 2 rejections (FR-020)
const checkEscalation = async (inspectionId: string) => {
  const { count } = await supabase
    .from('approvals')
    .select('*', { count: 'exact' })
    .eq('inspection_id', inspectionId)
    .eq('decision', 'REJECTED')

  if (count >= 2) {
    // Trigger real-time escalation notification
    await supabase
      .from('notifications')
      .insert({
        type: 'ESCALATION',
        title: 'Inspection Escalated',
        message: 'Manual reassignment required after 2 rejections',
        priority: 'HIGH'
      })
  }
}
```

### Notification (Real-time Alert System)

Real-time notification system for assignments, status changes, and escalations.

**Supabase Schema**:
```sql
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ASSIGNMENT', 'STATUS_CHANGE', 'APPROVAL_REQUIRED', 'ESCALATION', 'REPORT_READY')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT NOT NULL CHECK (related_entity_type IN ('INSPECTION', 'PROJECT', 'APPROVAL', 'REPORT')),
  related_entity_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  delivery_channel TEXT DEFAULT 'IN_APP' CHECK (delivery_channel IN ('IN_APP', 'EMAIL', 'PUSH')),
  scheduled_for TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Real-time Notification Delivery**:
```typescript
// Subscribe to user notifications
supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Show real-time notification in UI
    showToastNotification(payload.new)
  })
  .subscribe()
```

## Enhanced Operational Entities (Session 2025-01-27)

### ConflictResolution (Manager-Mediated Dispute Handling)

Entity for tracking and resolving conflicting evidence submissions with manager intervention.

**Supabase Schema**:
```sql
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
```

**Real-time Conflict Detection**:
```typescript
// Automatic conflict detection for simultaneous evidence submissions
const detectConflict = async (inspectionId: string, newEvidence: Evidence) => {
  const recentEvidence = await getRecentEvidenceForInspection(inspectionId, '5 minutes')
  
  if (recentEvidence.length > 1) {
    await supabase.from('conflict_resolutions').insert({
      inspection_id: inspectionId,
      triggered_by_evidence_ids: [newEvidence.id, ...recentEvidence.map(e => e.id)],
      conflict_type: 'EVIDENCE_DISPUTE',
      description: 'Multiple evidence submissions detected within 5-minute window',
      status: 'PENDING'
    })
    
    // Trigger real-time notification to project managers
    notifyProjectManagers(inspectionId, 'CONFLICT_DETECTED')
  }
}
```

### EscalationQueue (Delayed-Approval Management)

Entity for managing time-sensitive approvals when project managers are unavailable.

**Supabase Schema**:
```sql
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
```

**Delayed-Approval Logic**:
```typescript
// Check for manager availability and queue escalations
const checkManagerAvailability = async (managerId: string, inspectionId: string) => {
  const lastSeen = await getManagerLastActivity(managerId)
  const hoursOffline = (Date.now() - lastSeen) / (1000 * 60 * 60)
  
  if (hoursOffline > 4) { // 4-hour threshold from clarifications
    await supabase.from('escalation_queue').insert({
      inspection_id: inspectionId,
      original_manager_id: managerId,
      escalation_reason: 'Manager unavailable for time-sensitive approval',
      priority_level: 'HIGH',
      manager_last_seen: new Date(lastSeen).toISOString(),
      notification_count: 1
    })
    
    // Send urgent notification to manager
    await sendUrgentNotification(managerId, 'PENDING_APPROVAL_QUEUE')
  }
}
```

### RoleTransition (Project-Completion Boundary Changes)

Entity for managing role changes with project-completion boundaries.

**Supabase Schema**:
```sql
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
```

**Project-Boundary Logic**:
```typescript
// Apply role changes only to new projects
const applyRoleTransition = async (userId: string, newRole: Role) => {
  // Get active projects where user has assignments
  const activeProjects = await getUserActiveProjects(userId)
  
  await supabase.from('role_transitions').insert({
    user_id: userId,
    from_role: currentUser.role,
    to_role: newRole,
    transition_type: 'PROJECT_BOUNDARY',
    affected_projects: activeProjects.map(p => p.id),
    new_projects_only: true
  })
  
  // Update user role for new projects only
  // Existing project assignments remain unchanged until completion
}
```

## Real-time Architecture

### Subscription Channels

**Project-level Updates**:
- `project:${projectId}` - Project status, member changes
- `inspections:${projectId}` - All inspection updates for project
- `evidence:${projectId}` - Evidence uploads across project
- `conflicts:${projectId}` - **NEW**: Conflict detection and resolution updates
- `escalations:${projectId}` - **NEW**: Delayed-approval queue notifications

**User-level Updates**:
- `notifications:${userId}` - Personal notifications
- `assignments:${userId}` - New inspection assignments
- `approvals:${userId}` - Approval requests
- `conflicts:${userId}` - **NEW**: Manager-assigned conflict resolution tasks
- `escalations:${userId}` - **NEW**: Urgent approval queue notifications

**Inspection-level Updates**:
- `inspection:${inspectionId}` - Status changes, evidence uploads
- `approval:${inspectionId}` - Approval decisions and comments  
- `conflict:${inspectionId}` - **NEW**: Real-time conflict detection and resolution
- `sync:${inspectionId}` - **NEW**: Offline sync status and priority updates

### Offline Support

**Conflict Resolution**:
```typescript
// Handle offline/online sync with conflict resolution
const syncOfflineData = async () => {
  const offlineChanges = await getOfflineChanges()
  
  for (const change of offlineChanges) {
    try {
      await supabase.from(change.table).upsert(change.data)
    } catch (conflict) {
      // Handle conflicts with last-write-wins or user choice
      await resolveConflict(change, conflict)
    }
  }
}
```

## Performance Optimizations

### Database Indexes

```sql
-- Optimize common queries
CREATE INDEX idx_inspections_project_status ON inspections(project_id, status);
CREATE INDEX idx_inspections_assigned_to ON inspections(assigned_to);
CREATE INDEX idx_evidence_inspection_id ON evidence(inspection_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
```

### Real-time Optimizations

- Channel-based subscriptions to reduce overhead
- Selective field updates to minimize payload size
- Connection pooling for mobile clients
- Offline queue for missed updates during connectivity issues

### Caching Strategy

- Profile data cached in browser storage
- Project metadata cached with TTL
- Evidence thumbnails cached via CDN
- Real-time updates bypass cache for immediate consistency

## Security Model

### Row Level Security Policies

**Multi-tenant Data Isolation**:
- Users only access projects they're members of
- Inspectors see only assigned inspections
- Executives have read access to all organizational data
- Project managers have full access to their projects

**Evidence Access Control**:
- Evidence files accessible only to inspection participants
- Signed URLs for temporary access to private files
- Automatic expiration of file access tokens
- Audit trail for all file access attempts

### Authentication Integration

**Supabase Auth Features**:
- JWT token-based authentication
- Role-based access control via user metadata
- Social login support (Google, GitHub, etc.)
- Password reset and email verification
- Session management with automatic refresh

This data model provides a robust foundation for the PrimoInspect platform with real-time capabilities, secure multi-tenant access, and scalable file storage through Supabase's managed services.
- End date must be after start date
- Location coordinates must be valid geographic coordinates

### Inspection

Individual inspection instance with lifecycle tracking and evidence collection.

**Zod Schema**:

```typescript
const InspectionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  checklistId: z.string().uuid(),
  assignedTo: z.string().uuid(), // User ID
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["draft", "pending", "in-review", "approved", "rejected"]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.date().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
      address: z.string().optional(),
    })
    .optional(),
  responses: z.record(z.unknown()), // Checklist responses
  rejectionCount: z.number().min(0).max(2).default(0), // Escalation after 2 rejections
  createdAt: z.date(),
  updatedAt: z.date(),
  submittedAt: z.date().optional(),
  completedAt: z.date().optional(),
})
```

**State Transitions**:

- draft → pending (inspector submits)
- pending → in-review (manager starts review)
- in-review → approved (manager approves)
- in-review → rejected (manager rejects)
- rejected → pending (inspector resubmits)
- rejected → escalated (after 2 rejections, notify PM)

### Evidence

Media files with metadata for inspection verification.

**Zod Schema**:

```typescript
const EvidenceSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  uploadedBy: z.string().uuid(), // User ID
  filename: z.string().min(1),
  originalName: z.string(),
  mimeType: z.string().regex(/^(image|video)\//),
  fileSize: z.number().max(50 * 1024 * 1024), // 50MB limit from clarifications
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
  timestamp: z.date(),
  verified: z.boolean().default(false),
  annotations: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        text: z.string(),
      })
    )
    .optional(),
  metadata: z
    .object({
      exif: z.record(z.unknown()).optional(),
      duration: z.number().optional(), // For videos
      dimensions: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional(),
    })
    .optional(),
  createdAt: z.date(),
})
```

**Validation Rules**:

- File size maximum 50MB per file (from clarifications)
- Total evidence per inspection maximum 1GB (from clarifications)
- Location and timestamp required for verification
- Supported formats: images (JPEG, PNG, WebP) and videos (MP4, MOV)

### User

Team members with role-based access and project assignments.

**Zod Schema**:

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["executive", "project-manager", "inspector"]),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
  projectIds: z.array(z.string().uuid()), // Projects user has access to
  permissions: z.object({
    canCreateProjects: z.boolean().default(false),
    canApproveInspections: z.boolean().default(false),
    canViewReports: z.boolean().default(true),
    canManageTeam: z.boolean().default(false),
  }),
  createdAt: z.date(),
  lastLoginAt: z.date().optional(),
})
```

**Role Permissions**:

- Executive: View dashboards and reports, no modification rights
- Project Manager: Full project access, approve inspections, manage team
- Inspector: Submit inspections and evidence, view assigned tasks

### Checklist

Template for inspection procedures with customizable questions.

**Zod Schema**:

```typescript
const ChecklistSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  version: z.string().default("1.0"),
  isActive: z.boolean().default(true),
  questions: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum([
        "text",
        "number",
        "boolean",
        "select",
        "multiselect",
        "file",
      ]),
      question: z.string().min(1),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(), // For select/multiselect
      validation: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
          pattern: z.string().optional(),
        })
        .optional(),
    })
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
})
```

### Approval

Decision records for inspection approval workflow with escalation tracking.

**Zod Schema**:

```typescript
const ApprovalSchema = z.object({
  id: z.string().uuid(),
  inspectionId: z.string().uuid(),
  approverId: z.string().uuid(), // User ID
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().min(1), // Required notes from clarifications
  reviewDate: z.date(),
  isEscalated: z.boolean().default(false),
  escalationReason: z.string().optional(),
  previousApprovalId: z.string().uuid().optional(), // Chain of approvals
  attachments: z.array(z.string().uuid()).optional(), // Evidence IDs
  createdAt: z.date(),
})
```

### Notification

Alert system for workflow events and status changes.

**Zod Schema**:

```typescript
const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([
    "assignment",
    "status-change",
    "approval-required",
    "escalation",
    "report-ready",
  ]),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  relatedEntityType: z.enum(["inspection", "project", "approval", "report"]),
  relatedEntityId: z.string().uuid(),
  isRead: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  deliveryChannel: z.enum(["in-app", "email", "push"]).default("in-app"),
  scheduledFor: z.date().optional(),
  deliveredAt: z.date().optional(),
  createdAt: z.date(),
})
```

### Report

Generated compliance documents with templates and export capabilities.

**Zod Schema**:

```typescript
const ReportSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  type: z.enum(["compliance", "summary", "progress", "custom"]),
  status: z.enum(["generating", "ready", "error"]),
  format: z.enum(["pdf", "excel", "csv"]),
  url: z.string().url().optional(), // Generated report URL
  filters: z.object({
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    inspectionStatus: z.array(z.string()).optional(),
    assignedTo: z.array(z.string().uuid()).optional(),
  }),
  generatedBy: z.string().uuid(), // User ID
  generatedAt: z.date().optional(),
  expiresAt: z.date().optional(), // Report retention
  createdAt: z.date(),
})
```

## Database Constraints

### Performance Constraints

- Project queries must return within 500ms for dashboard loads
- Inspection list queries optimized for mobile pagination (20 items per page)
- Evidence upload progress tracking with 1-second interval updates
- Real-time updates using optimistic UI patterns

### Storage Constraints

- Evidence files: 50MB maximum per file
- Total evidence per inspection: 1GB maximum
- Permanent retention for compliance (no automatic deletion)
- Database indexes on frequently queried fields (projectId, status, assignedTo)

### Scalability Assumptions

- Maximum 50 inspections per project
- Maximum 10 team members per project
- Response time targets: <1 second operations, <3 seconds reports
- Mobile-first optimization for network efficiency

## Validation Rules Summary

1. **File Size Limits**: 50MB per evidence file, 1GB per inspection total
2. **Team Size**: Maximum 10 users per project
3. **Escalation**: Automatic notification after 2 inspection rejections
4. **Performance**: <1 second for most operations, <3 seconds for reports
5. **Authentication**: Email/password with manual project invitations
6. **Retention**: Permanent evidence storage for compliance
7. **Mobile-First**: All schemas optimized for mobile form validation

This data model supports the constitutional requirements for mobile-first experience, role-oriented UX, evidence-driven decisions, and simplicity while maintaining the clarified scale and performance expectations.







