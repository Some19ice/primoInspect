
# Implementation Plan: PrimoInspect Digital Inspection Platform

**Branch**: `001-primoinspect-digital-inspection` | **Date**: 2025-01-27 | **Spec**: [specs/001-primoinspect-digital-inspection/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-primoinspect-digital-inspection/spec.md` with enhanced clarifications from Session 2025-01-27

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → ✅ COMPLETE: Loaded comprehensive spec with recent clarifications (conflict resolution, escalation handling, real-time strategy)
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ COMPLETE: All technical decisions provided, Supabase migration strategy implemented
   → Project Type: Web application (Next.js full-stack with Supabase backend services)
   → Structure Decision: App Router with role-based layouts and real-time subscriptions
3. Fill Constitution Check section based on existing project principles
   → ✅ COMPLETE: Mobile-first, evidence-driven, role-oriented principles verified
4. Evaluate Constitution Check section
   → ✅ PASS: Enhanced real-time capabilities align with constitutional principles
   → Update Progress Tracking: Initial Constitution Check PASSED
5. Execute Phase 0 → research.md
   → ✅ COMPLETE: Supabase integration patterns and real-time architecture researched
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CURSOR.md updates
   → ✅ COMPLETE: All design artifacts updated with clarifications and conflict resolution workflows
7. Re-evaluate Constitution Check section
   → ✅ PASS: All new clarifications enhance constitutional compliance
   → Update Progress Tracking: Post-Design Constitution Check PASSED
8. Plan Phase 2 → Task generation approach updated with conflict resolution and real-time features
9. STOP - Ready for /tasks command
```

## Summary

PrimoInspect is a mobile-first digital inspection platform for renewable energy projects with **enhanced real-time capabilities and operational workflow clarity**. The platform now features **manager-mediated conflict resolution**, **delayed-approval queues for escalation**, **project-completion boundary role changes**, **status-first offline sync priority**, and **instant real-time updates** across all connected users. The system supports evidence-based approvals, real-time collaboration, and comprehensive audit trails through Supabase's integrated backend services.

## Technical Context

**Language/Version**: TypeScript with Next.js 14 (App Router) and React 18  
**Primary Dependencies**: Tailwind CSS, shadcn/ui, Headless UI, Radix Primitives, TanStack React Query v5, Zod validation schemas  
**Backend**: **Supabase Backend-as-a-Service** with PostgreSQL hosting, real-time subscriptions, integrated authentication, and file storage  
**Authentication**: **Supabase Auth** with JWT tokens and Row Level Security (RLS) policies (migrated from NextAuth)  
**Storage**: **Supabase Storage** for evidence files with CDN delivery and signed URLs (50MB per file, 1GB per inspection)  
**Real-time**: **Supabase WebSocket subscriptions** for instant updates, conflict notifications, and collaborative dashboards  
**Testing**: React Testing Library + Jest for components, Playwright for E2E mobile-first validation  
**Target Platform**: Web application with mobile-responsive design optimized for iOS/Android browsers  
**Project Type**: web - full-stack Next.js application with Supabase backend services and real-time capabilities  
**Performance Goals**: <1 second for operations, <3 seconds for reports, **instant real-time updates** for all status changes  
**Constraints**: Mobile-first UX, evidence-driven workflows, **manager-mediated conflict resolution**, role-based access control  
**Scale/Scope**: Small projects (10-50 inspections, 5-10 team members) with **real-time collaboration** and **instant update broadcasting**

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Mobile-First Experience Check**:
- [x] All new clarifications enhance mobile user experience (conflict resolution, offline sync priority)
- [x] Manager-mediated conflict resolution accessible via mobile dashboard interface
- [x] Status-first sync priority ensures critical mobile updates reach project managers immediately
- [x] Instant real-time updates provide immediate mobile feedback without page refresh
- [x] Delayed-approval queue maintains mobile workflow continuity during connectivity issues

**Evidence-Driven Decisions Check**:
- [x] Manager-mediated conflict resolution requires side-by-side evidence comparison
- [x] All approval decisions tied to inspection evidence with verification requirements
- [x] Conflict detection system flags disputed evidence for manual review
- [x] Status changes require verifiable evidence through location and timestamp validation
- [x] Supabase Storage integration maintains evidence integrity with signed URLs

**Role-Oriented UX Check**:
- [x] Project-completion boundary role changes preserve workflow stability and clear responsibilities
- [x] Each role has distinct conflict resolution responsibilities (Inspector submit, Manager resolve)
- [x] Delayed-approval queue respects approval hierarchy (Project Manager authority maintained)
- [x] Real-time updates filtered by role-appropriate permissions and project access
- [x] Executive visibility maintained without workflow interference

**Real-time Collaboration Check**:
- [x] Instant update broadcasting enhances collaborative decision-making
- [x] Conflict resolution notifications enable immediate manager intervention
- [x] Status-first sync priority ensures critical workflow coordination
- [x] Real-time escalation alerts enable proactive project management
- [x] Supabase real-time subscriptions support multi-user concurrent collaboration

**Simplicity and Clarity Check**:
- [x] Conflict resolution follows clear manager-mediated process (no complex automation)
- [x] Approval escalation uses simple delayed-queue approach (no complex routing)
- [x] Role changes bounded to project completion (no mid-project disruption)
- [x] Sync priority straightforward: status first, then evidence (clear user expectation)
- [x] Instant updates provide immediate feedback (no complex throttling or batching)

## Project Structure

### Documentation (this feature)
```
specs/001-primoinspect-digital-inspection/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command) - ✅ Updated with clarifications
├── data-model.md        # Phase 1 output (/plan command) - ✅ Enhanced with conflict resolution
├── quickstart.md        # Phase 1 output (/plan command) - ✅ Existing real-time scenarios
├── contracts/           # Phase 1 output (/plan command) - ✅ Existing API specifications  
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Next.js Web Application with Supabase Backend
app/
├── (dashboard)/         # Role-based dashboard layouts with real-time updates
│   ├── executive/       # Executive visibility dashboards
│   ├── manager/         # Project manager orchestration with conflict resolution
│   └── inspector/       # Inspector submission with offline sync priority
├── api/                 # Next.js API routes with Supabase integration
│   ├── inspections/     # ✅ Implemented: Inspection CRUD with real-time notifications
│   ├── evidence/        # ✅ Implemented: File upload with Supabase Storage
│   ├── projects/        # ✅ Implemented: Project management with live collaboration  
│   ├── checklists/      # ✅ Implemented: Template management for inspections
│   └── reports/         # ✅ Implemented: Report generation with real-time data
├── auth/                # Supabase Auth integration pages
├── globals.css          # Tailwind CSS with mobile-first responsive styles
└── layout.tsx           # Root layout with role-aware navigation

components/
├── ui/                  # shadcn/ui component library for mobile-first design
├── forms/               # React Hook Form + Zod validation with real-time sync
├── charts/              # Recharts dashboard components with live data updates
├── maps/                # MapLibre GL evidence location verification
├── evidence/            # Media upload with Supabase Storage and progress tracking
├── approvals/           # NEW: Manager-mediated conflict resolution interfaces  
├── escalations/         # NEW: Delayed-approval queue management components
└── realtime/            # Real-time subscription components with instant broadcasting

lib/
├── supabase/            # ✅ Implemented: Complete Supabase integration
│   ├── client.ts        # Supabase client configuration
│   ├── auth.ts          # Supabase Auth helpers and JWT management
│   ├── database.ts      # ✅ Enhanced: Database service with conflict detection
│   ├── storage.ts       # Supabase Storage service for evidence files
│   ├── rbac.ts          # ✅ Implemented: Role-based access control system
│   └── types.ts         # Generated TypeScript types from Supabase schema
├── hooks/               # ✅ Implemented: Real-time React hooks
│   ├── use-realtime-inspections.ts  # Real-time inspection subscriptions
│   ├── use-realtime-notifications.ts # Instant notification system
│   └── use-supabase-auth.ts         # Authentication state management
├── validations/         # ✅ Implemented: Zod schemas for API validation
└── utils/               # Utility functions and helpers

supabase/
├── migrations/          # ✅ Implemented: Database schema with conflict resolution tables
├── functions/           # Edge functions for complex business logic
└── config.toml         # Supabase project configuration
```

**Structure Decision**: Selected Next.js full-stack web application with Supabase backend services. The app directory structure supports enhanced role-based layouts with conflict resolution interfaces, while the components directory provides mobile-first UI elements with real-time capabilities and operational workflow management.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**:
   - ✅ All technical decisions provided: Next.js 14, Supabase integration, real-time subscriptions
   - ✅ **Enhanced**: Conflict resolution patterns, escalation queue management, role transition strategies
   - ✅ **NEW**: Status-first sync priority, instant real-time broadcasting approach
   - ✅ Operational workflow clarifications integrated from Session 2025-01-27

2. **Generate and dispatch research agents**:
   ```
   ✅ Task: "Research Supabase real-time conflict detection patterns"
   ✅ Task: "Find manager-mediated dispute resolution UI patterns"  
   ✅ Task: "Research delayed-approval queue management strategies"
   ✅ Task: "Find status-first offline sync implementation approaches"
   ✅ Task: "Research instant real-time broadcasting performance optimization"
   ```

3. **Consolidate findings** in `research.md`:
   - ✅ **Enhanced**: Manager-mediated conflict resolution with side-by-side comparison
   - ✅ **Enhanced**: Status-first offline sync priority with background evidence uploads
   - ✅ **Enhanced**: Instant update broadcasting strategy for maximum responsiveness
   - ✅ **NEW**: Project-completion boundary role changes for workflow stability

**Output**: ✅ research.md updated with all operational workflow clarifications integrated

## Phase 1: Design & Contracts

*Prerequisites: ✅ research.md complete with enhanced clarifications*

1. **Extract entities from feature spec** → `data-model.md`:
   - ✅ **Enhanced**: Added ConflictResolution entity for manager-mediated disputes
   - ✅ **Enhanced**: Added EscalationQueue entity for delayed-approval management
   - ✅ **Enhanced**: Added RoleTransition entity for project-completion boundaries
   - ✅ **Enhanced**: Updated real-time channels for conflicts, escalations, sync status

2. **Generate API contracts** from functional requirements:
   - ✅ **Complete**: All 10 API routes implemented with Supabase integration (T034-T043)
   - ✅ **Enhanced**: Conflict detection and resolution endpoints
   - ✅ **Enhanced**: Escalation queue management APIs
   - ✅ **Enhanced**: Real-time notification systems for operational workflows

3. **Extract user scenarios** from user stories:
   - ✅ **Complete**: Existing quickstart scenarios cover core workflows
   - ✅ **Enhanced**: Real-time conflict resolution validation scenarios
   - ✅ **Enhanced**: Delayed-approval queue testing scenarios

4. **Update agent file** (CURSOR.md):
   - ✅ **Complete**: Updated with Session 2025-01-27 clarifications
   - ✅ **Enhanced**: Added operational workflow implementation patterns
   - ✅ **Enhanced**: Updated recent changes with conflict resolution and API implementation

**Output**: ✅ data-model.md (enhanced entities), ✅ contracts/* (complete API), ✅ quickstart.md (existing scenarios), ✅ CURSOR.md (updated guidance)

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load existing comprehensive tasks.md with 73 tasks (T001-T073)
- ✅ **Complete**: T034-T043 API routes already implemented  
- **Enhancement Needed**: Add conflict resolution, escalation queue, and role transition tasks
- **NEW**: Manager-mediated conflict UI components → implementation tasks
- **NEW**: Delayed-approval queue dashboard → notification tasks  
- **NEW**: Status-first sync priority → offline sync enhancement tasks
- **NEW**: Instant real-time broadcasting → performance optimization tasks

**Ordering Strategy**:
- Current 10-phase approach with Supabase migration mostly complete
- **Phase 11**: Conflict Resolution Implementation (manager interfaces, detection logic)
- **Phase 12**: Escalation Queue Management (delayed-approval workflows, urgent notifications)
- **Phase 13**: Enhanced Real-time Features (instant broadcasting, sync priority)
- **Phase 14**: Operational Workflow Testing (conflict scenarios, escalation validation)

**Estimated Output**: Add 15-20 additional tasks to existing tasks.md for operational workflow enhancements

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: ✅ Task execution (tasks.md exists with T034-T043 completed)  
**Phase 4**: Enhanced Implementation (conflict resolution UI, escalation management, real-time optimization)  
**Phase 5**: Operational Validation (conflict testing, escalation scenarios, real-time performance validation)

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - ✅ Enhanced with Session 2025-01-27 clarifications
- [x] Phase 1: Design complete (/plan command) - ✅ Updated entities, contracts, and agent guidance  
- [x] Phase 2: Task planning complete (/plan command) - ✅ Enhancement strategy for operational workflows
- [x] Phase 3: Tasks generated (/tasks command) - ✅ Existing 73 tasks with T034-T043 implemented
- [ ] Phase 4: Enhanced Implementation (conflict resolution, escalation queues, real-time optimization)
- [ ] Phase 5: Operational Validation (conflict scenarios, escalation testing, real-time performance)

**Gate Status**:
- [x] Initial Constitution Check: PASS - ✅ Enhanced real-time capabilities align with principles
- [x] Post-Design Constitution Check: PASS - ✅ All clarifications enhance constitutional compliance  
- [x] All NEEDS CLARIFICATION resolved - ✅ Session 2025-01-27 addressed operational ambiguities
- [x] Complexity deviations documented - ✅ Enhanced workflows justified for operational clarity

**Enhanced Operational Status**:
- [x] **Manager-Mediated Conflict Resolution**: Design complete with side-by-side comparison interface
- [x] **Delayed-Approval Queue**: Escalation logic designed with 4-hour threshold and urgent notifications
- [x] **Project-Completion Boundary Role Changes**: Workflow stability approach defined and documented
- [x] **Status-First Offline Sync Priority**: Sync queue prioritization strategy implemented in design
- [x] **Instant Real-time Broadcasting**: Maximum responsiveness strategy defined for all connected users

---

*Based on Enhanced Operational Principles - Session 2025-01-27*  
*API Implementation Status: T034-T043 Complete - See tasks.md*  
*Ready for Enhanced Operational Workflow Implementation*
