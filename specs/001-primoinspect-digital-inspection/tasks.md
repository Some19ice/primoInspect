# Tasks: PrimoInspect Digital Inspection Platform

**Input**: Design documents from `/specs/001-primoinspect-digital-inspection/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md
**Architecture**: Supabase Backend-as-a-Service Migration with Enhanced Operational Workflows
**Updated**: Session 2025-01-27 clarifications for conflict resolution, escalation management, and real-time enhancements

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → ✅ Complete: Enhanced with Session 2025-01-27 clarifications for operational workflows
   → Extract: conflict resolution, escalation queues, role transitions, real-time broadcasting
2. Load design documents:
   → ✅ data-model.md: Enhanced with ConflictResolution, EscalationQueue, RoleTransition entities
   → ✅ contracts/: API endpoints + Supabase APIs → integration tasks
   → ✅ research.md: Enhanced with manager-mediated workflows, status-first sync, instant broadcasting
3. Generate tasks by category:
   → Setup: Supabase project, dependencies, schema migration
   → Migration: Auth (NextAuth→Supabase), Database (Prisma→Supabase), Storage
   → Core: Real-time subscriptions, RLS policies, API integration
   → **NEW**: Conflict resolution, escalation management, role transitions
   → UI: components with real-time features, mobile optimization, conflict interfaces
   → Integration: auth, file upload, real-time updates, operational workflows
   → Polish: performance optimization, constitutional compliance, operational testing
4. Apply task rules:
   → Different services/tables = mark [P] for parallel
   → Same service = sequential (no [P])
   → Dependencies before dependents
   → **NEW**: Operational workflows after core real-time implementation
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph including operational workflow enhancements
7. Create parallel execution examples with conflict resolution
8. Validate task completeness:
   → All entities have Supabase schema and RLS policies?
   → All endpoints migrated to Supabase integration?
   → All constitutional principles addressed with real-time features?
   → **NEW**: All operational workflows implemented with manager-mediated conflict resolution?
9. Return: SUCCESS (tasks ready for enhanced operational workflow execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different services/tables, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/`, `components/`, `lib/` at repository root
- **Supabase Integration**: `lib/supabase/`, `supabase/` directories
- API routes in `app/api/` (reduced with Supabase auto-generated APIs)
- Role-based layouts in `app/(dashboard)/`
- Shared components in `components/`

## Phase 1: Supabase Setup & Migration Foundation

- [x] T001 Initialize Supabase project and install dependencies
- [x] T002 [P] Configure Supabase environment variables and connection
- [x] T003 [P] Set up Supabase CLI and project configuration
- [x] T004 [P] Create Supabase database schema from Prisma schema
- [x] T005 Generate TypeScript types from Supabase schema

## Phase 2: Authentication Migration (NextAuth → Supabase Auth)

- [x] T006 [P] Create Supabase Auth client configuration in lib/supabase/auth.ts
- [x] T007 [P] Implement Supabase Auth service replacing NextAuth
- [x] T008 [P] Create profiles table linked to Supabase Auth users
- [x] T009 Update authentication middleware for Supabase JWT tokens
- [x] T010 Migrate signin page to use Supabase Auth in app/auth/signin/page.tsx
- [x] T011 [P] Update session management across all components
- [x] T012 [P] Implement role-based access control with Supabase Auth

## Phase 3: Database Migration (Prisma → Supabase Client)

- [x] T013 [P] Create Supabase client configuration in lib/supabase/client.ts
- [x] T014 [P] Implement database service abstraction layer in lib/supabase/database.ts
- [x] T015 [P] Create Row Level Security policies for profiles table
- [x] T016 [P] Create Row Level Security policies for projects table
- [x] T017 [P] Create Row Level Security policies for inspections table
- [x] T018 [P] Create Row Level Security policies for evidence table
- [x] T019 [P] Create Row Level Security policies for approvals table
- [x] T020 [P] Create Row Level Security policies for notifications table

## Phase 4: Real-time Subscriptions Implementation

- [x] T021 [P] Create real-time service for inspections in lib/supabase/realtime.ts
- [x] T022 [P] Implement inspection status change subscriptions
- [x] T023 [P] Create real-time notifications service
- [x] T024 [P] Implement evidence upload real-time notifications
- [x] T025 [P] Add real-time approval workflow notifications
- [x] T026 [P] Create project-level real-time subscriptions
- [x] T027 [P] Implement offline/online state management for real-time

## Phase 5: File Storage Migration (Supabase Storage)

- [x] T028 [P] Create Supabase Storage service in lib/supabase/storage.ts
- [x] T029 [P] Set up evidence-files bucket with access policies
- [x] T030 [P] Implement file upload with Supabase Storage in components/evidence/evidence-upload.tsx
- [x] T031 [P] Update evidence table to use Supabase Storage paths
- [x] T032 [P] Migrate existing files to Supabase Storage (if any)
- [x] T033 [P] Implement signed URLs for secure file access

## Phase 6: API Routes Migration

- [x] T034 [P] Migrate GET/POST /api/projects to use Supabase client
- [x] T035 [P] Migrate GET/PUT/DELETE /api/projects/[id] to use Supabase client
- [x] T036 [P] Migrate GET /api/projects/[id]/dashboard with real-time data
- [x] T037 [P] Migrate GET/POST /api/inspections to use Supabase client
- [x] T038 [P] Migrate GET/PUT/DELETE /api/inspections/[id] to use Supabase client
- [x] T039 [P] Migrate POST /api/inspections/[id]/approve with real-time notifications
- [x] T040 [P] Migrate GET/POST /api/checklists to use Supabase client
- [x] T041 [P] Migrate GET/PUT /api/checklists/[id] to use Supabase client
- [x] T042 [P] Migrate POST /api/reports/generate with real-time data
- [x] T043 [P] Migrate GET /api/users/me to use Supabase profiles

## Phase 7: UI Components with Real-time Integration

- [x] T044 [P] Update dashboard layouts with real-time data hooks
- [x] T045 [P] Add real-time subscriptions to executive dashboard
- [x] T046 [P] Add real-time subscriptions to manager dashboard
- [x] T047 [P] Add real-time subscriptions to inspector dashboard
- [x] T048 [P] Update ProjectList component with real-time updates
- [x] T049 [P] Update InspectionCard component with live status changes
- [x] T050 [P] Update EvidenceUpload component with real-time progress
- [x] T051 [P] Update ApprovalForm component with escalation notifications

## Phase 8: Real-time Hooks & Utilities

- [x] T052 [P] Create useRealtimeInspections hook in lib/hooks/use-realtime-inspections.ts
- [x] T053 [P] Create useRealtimeNotifications hook in lib/hooks/use-realtime-notifications.ts
- [x] T054 [P] Create useRealtimeProjects hook in lib/hooks/use-realtime-projects.ts
- [x] T055 [P] Create useSupabaseAuth hook in lib/hooks/use-supabase-auth.ts
- [x] T056 [P] Create useEvidenceUpload hook with progress tracking in lib/hooks/use-evidence-upload.ts
- [x] T057 [P] Create offline sync utilities in lib/utils/offline-sync.ts

## Phase 9: Data Migration & Cleanup

- [x] T058 Create data export script from Prisma database
- [x] T059 Create data transformation script for Supabase format
- [x] T060 Execute data migration to Supabase (production)
- [x] T061 Verify data integrity after migration
- [x] T062 Update environment configuration to use Supabase exclusively
- [x] T063 Remove Prisma client and dependencies
- [x] T064 Delete Prisma schema and migration files
- [x] T065 Clean up old database connection configuration

## Phase 10: Constitutional Compliance & Testing

- [ ] T066 [P] Test real-time subscriptions across all user roles
- [ ] T067 [P] Validate offline/online sync functionality
- [ ] T068 [P] Test file upload with 50MB limits in Supabase Storage
- [ ] T069 [P] Validate Row Level Security policies
- [ ] T070 [P] Test escalation workflows with real-time notifications
- [ ] T071 Execute quickstart validation scenarios with real-time features
- [ ] T072 Performance validation (<1s operations, <3s reports, real-time updates)
- [ ] T073 Constitutional compliance final verification with Supabase

## Phase 11: Enhanced Operational Workflows (Session 2025-01-27)

### Conflict Resolution Implementation

- [x] T074 [P] Create conflict_resolutions table schema in supabase/migrations/
- [x] T075 [P] Implement conflict detection logic in lib/supabase/conflicts.ts
- [ ] T076 [P] Create ConflictResolution service for manager-mediated disputes
- [ ] T077 [P] Build side-by-side evidence comparison component in components/conflicts/
- [ ] T078 [P] Add conflict resolution interface to manager dashboard
- [ ] T079 [P] Implement real-time conflict notifications in lib/hooks/use-conflict-notifications.ts
- [ ] T080 [P] Create conflict resolution API endpoints in app/api/conflicts/

### Escalation Queue Management

- [ ] T081 [P] Create escalation_queue table schema in supabase/migrations/
- [ ] T082 [P] Implement delayed-approval queue logic in lib/supabase/escalations.ts
- [ ] T083 [P] Build escalation queue dashboard component in components/escalations/
- [ ] T084 [P] Add 4-hour threshold detection for manager availability
- [ ] T085 [P] Implement urgent notification system for delayed approvals
- [ ] T086 [P] Create escalation queue API endpoints in app/api/escalations/
- [ ] T087 [P] Add escalation queue management to manager dashboard

### Role Transition Management

- [ ] T088 [P] Create role_transitions table schema in supabase/migrations/
- [ ] T089 [P] Implement project-completion boundary logic in lib/supabase/roles.ts
- [ ] T090 [P] Build role transition management interface in components/admin/
- [ ] T091 [P] Add role change workflow with project-completion boundaries
- [ ] T092 [P] Implement role transition notifications and permissions updates
- [ ] T093 [P] Create role transition API endpoints in app/api/roles/transitions/

## Phase 12: Enhanced Real-time Features

### Status-First Offline Sync

- [ ] T094 [P] Implement sync priority queue in lib/utils/sync-queue.ts
- [ ] T095 [P] Enhance offline storage with priority-based queuing in lib/hooks/use-offline-sync.ts
- [ ] T096 [P] Update evidence upload components with background processing
- [ ] T097 [P] Add status-first sync indicators to mobile interface
- [ ] T098 [P] Implement sync priority controls in components/sync/

### Instant Real-time Broadcasting

- [ ] T099 [P] Optimize Supabase real-time subscriptions for instant updates
- [ ] T100 [P] Implement instant broadcasting service in lib/supabase/broadcasting.ts
- [ ] T101 [P] Enhance dashboard components with instant update reception
- [ ] T102 [P] Add performance monitoring for real-time update latency
- [ ] T103 [P] Implement connection status indicators with instant feedback

## Phase 13: Enhanced UI Components

### Manager-Mediated Conflict Resolution UI

- [ ] T104 [P] Build ConflictDetectionAlert component in components/conflicts/conflict-detection-alert.tsx
- [ ] T105 [P] Create SideBySideComparison component in components/conflicts/side-by-side-comparison.tsx
- [ ] T106 [P] Implement ConflictResolutionForm component with approval controls
- [ ] T107 [P] Add conflict resolution notifications to components/notifications/
- [ ] T108 [P] Create conflict audit trail display in components/conflicts/conflict-history.tsx

### Escalation Queue Dashboard

- [ ] T109 [P] Build EscalationQueueList component in components/escalations/escalation-queue-list.tsx
- [ ] T110 [P] Create UrgentNotificationBanner component with 4-hour threshold alerts
- [ ] T111 [P] Implement DelayedApprovalCard component for pending inspections
- [ ] T112 [P] Add escalation priority indicators to inspection cards
- [ ] T113 [P] Create manager availability status indicator

### Enhanced Mobile Experience

- [ ] T114 [P] Update mobile forms with status-first sync feedback
- [ ] T115 [P] Add conflict resolution mobile interface for field managers
- [ ] T116 [P] Implement mobile escalation notifications with urgent alerts
- [ ] T117 [P] Enhance offline sync indicators with priority queue status
- [ ] T118 [P] Add instant update animations for mobile real-time feedback

## Phase 14: Operational Workflow Testing

### Conflict Resolution Testing

- [ ] T119 Create conflict detection test scenarios in tests/conflicts/
- [ ] T120 Test manager-mediated resolution workflow end-to-end
- [ ] T121 Validate side-by-side evidence comparison functionality
- [ ] T122 Test real-time conflict notifications across user roles
- [ ] T123 Verify conflict audit trail accuracy and completeness

### Escalation Queue Testing

- [ ] T124 Test delayed-approval queue functionality with 4-hour thresholds
- [ ] T125 Validate urgent notification delivery for escalated approvals
- [ ] T126 Test manager availability detection and escalation triggers
- [ ] T127 Verify escalation queue priority ordering and management
- [ ] T128 Test escalation resolution and queue cleanup processes

### Enhanced Real-time Testing

- [ ] T129 Test status-first sync priority under various network conditions  
- [ ] T130 Validate instant real-time broadcasting performance and latency
- [ ] T131 Test offline-online sync with priority queue management
- [ ] T132 Verify real-time update consistency across multiple connected users
- [ ] T133 Test conflict resolution with concurrent real-time updates

## Dependencies

- **Phase 1** (Supabase Setup) before all other phases
- **Phase 2** (Auth Migration) before Phases 3-4 (database operations need auth)
- **Phase 3** (Database Migration) before Phase 6 (API routes need RLS policies)
- **Phase 4** (Real-time) can run parallel with Phase 5 (Storage)
- **Phase 6** (API Migration) before Phase 7 (UI needs migrated APIs)
- **Phase 7** (UI Integration) before Phase 8 (components need real-time hooks)
- **Phase 8** (Hooks) can run parallel with Phase 7
- **Phase 9** (Data Migration) after all implementation phases complete
- **Phase 10** (Testing) after all implementation complete
- **NEW Phase 11** (Enhanced Operational Workflows) after Phase 4 (Real-time) complete
- **NEW Phase 12** (Enhanced Real-time Features) can run parallel with Phase 11
- **NEW Phase 13** (Enhanced UI Components) after Phase 11 and Phase 7 complete
- **NEW Phase 14** (Operational Workflow Testing) after all enhanced phases complete

## Enhanced Supabase Migration Benefits

- **Real-time Collaboration**: Live updates for inspection status, evidence uploads, approvals
- **Managed Infrastructure**: No database maintenance, automatic scaling, built-in backups
- **Integrated Authentication**: JWT tokens, social logins, user management
- **Secure File Storage**: CDN delivery, signed URLs, access policies
- **Row Level Security**: Database-level multi-tenant security
- **Mobile Optimization**: Offline-first with automatic sync, real-time conflict resolution
- **NEW**: **Manager-Mediated Conflict Resolution**: Side-by-side evidence comparison with real-time notifications
- **NEW**: **Delayed-Approval Queue Management**: 4-hour threshold escalation with urgent notifications
- **NEW**: **Project-Completion Boundary Role Changes**: Workflow stability with gradual permission transitions
- **NEW**: **Status-First Offline Sync**: Critical updates prioritized over evidence file uploads
- **NEW**: **Instant Real-time Broadcasting**: Every change immediately broadcast to all connected users

## Enhanced Operational Notes

- [P] tasks = different services/tables/components, no dependencies
- Follow constitutional mobile-first principles throughout
- Ensure 50MB file upload capability with Supabase Storage
- Maintain <1 second operation performance targets
- Role-based access control via Supabase RLS policies
- Evidence-driven approval workflows with real-time notifications
- Real-time audit trail logging for all inspection activities (FR-015)
- Real-time escalation after 2 rejections (FR-020)
- Offline-first mobile experience with automatic sync
- **NEW**: Manager-mediated conflict resolution with side-by-side evidence comparison
- **NEW**: Delayed-approval queue with 4-hour manager availability threshold
- **NEW**: Project-completion boundary role changes for workflow stability
- **NEW**: Status-first sync priority: critical updates before evidence files
- **NEW**: Instant real-time broadcasting for maximum user responsiveness
- **NEW**: Enhanced mobile interfaces for field manager conflict resolution
- **NEW**: Operational workflow testing with real-time scenario validation

## Enhanced Parallel Execution Examples

### Phase 11 (Enhanced Operational Workflows) - Can run in parallel groups:

**Group A - Database Schema (run together):**
```bash
# Conflict resolution, escalation queue, and role transition schemas
T074 T081 T088  # All schema creation tasks
```

**Group B - Service Implementation (run together):**
```bash
# Service layer for operational workflows
T075 T082 T089  # Conflict, escalation, role services
```

**Group C - API Endpoints (run together):**
```bash
# API endpoints for enhanced workflows
T080 T086 T093  # Conflict, escalation, role APIs
```

### Phase 12 (Enhanced Real-time Features) - Parallel with Phase 11:

**Real-time Enhancement Group:**
```bash
# Can run parallel with Phase 11 Group B
T094 T099 T100  # Sync queue, broadcasting, monitoring
```

### Phase 13 (Enhanced UI Components) - After Phase 11 completion:

**UI Component Groups (run in parallel):**
```bash
# Group D - Conflict Resolution UI
T104 T105 T106 T107 T108

# Group E - Escalation Queue UI
T109 T110 T111 T112 T113

# Group F - Enhanced Mobile UI
T114 T115 T116 T117 T118
```

**Total Enhanced Tasks**: 60 additional tasks (T074-T133)
**Total Project Tasks**: 133 tasks with operational workflow enhancements
**Current Completion**: 10/133 tasks (7.5%) - API foundation complete
