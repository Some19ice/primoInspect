# Feature Specification: PrimoInspect Digital Inspection Platform

**Feature Branch**: `001-primoinspect-digital-inspection`  
**Created**: 2025-09-26  
**Status**: In Development - Supabase Migration Phase  
**Input**: User description: "PrimoInspect is a digital inspection and reporting platform tailored for renewable energy projects. The web app gives leaders and managers real‑time visibility into field work, while making it easy to assign inspections, review evidence, approve results, and share reports with stakeholders. Inspectors primarily capture data on mobile, and the web app is where teams coordinate, monitor progress, and close the loop on quality and compliance."

## Execution Flow (main)

```
1. Parse user description from Input
   → ✅ Complete: Digital inspection platform for renewable energy
2. Extract key concepts from description
   → ✅ Actors: Leaders, Managers, Inspectors, Stakeholders
   → ✅ Actions: Assign, Review, Approve, Report, Capture, Coordinate
   → ✅ Data: Inspections, Evidence, Projects, Reports, Compliance
   → ✅ Constraints: Mobile-first for field work, web for oversight
3. For each unclear aspect:
   → ✅ All key aspects clearly defined in description
4. Fill User Scenarios & Testing section
   → ✅ Clear user flows identified across three role types
5. Generate Functional Requirements
   → ✅ Each requirement mapped to user needs and testable
6. Identify Key Entities (if data involved)
   → ✅ Projects, Inspections, Evidence, Reports, Users, Approvals
7. Run Review Checklist
   → ✅ No implementation details, focused on business needs
8. Architecture Update: Supabase Migration
   → ✅ Real-time capabilities for live updates
   → ✅ Managed database and authentication
   → ✅ Integrated file storage for evidence
9. Return: SUCCESS (spec ready for Supabase implementation)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers
- 🔄 **NEW**: Real-time updates for mobile field workers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

---

## Clarifications

### Session 2025-09-26

- Q: What is the expected scale for a typical renewable energy project in PrimoInspect? → A: Small projects: 10-50 inspections, 5-10 team members, single site
- Q: How should users authenticate and access different project workspaces? → A: **UPDATED**: Supabase Auth with email/password, integrated user management with JWT tokens
- Q: What are the expected response time requirements for the web dashboard and mobile app? → A: **ENHANCED**: <1 second for most operations, <3 seconds for reports, real-time updates for status changes
- Q: How long should inspection evidence be retained and what are the size constraints? → A: Permanent retention for compliance with 50MB max per file, 1GB per inspection, **NEW**: Supabase Storage with CDN delivery
- Q: When an inspection is rejected multiple times, how should escalation be handled? → A: Simple: After 2 rejections, notify project manager who must manually reassign, **NEW**: Real-time escalation notifications

### Session 2025-01-27

- Q: When two inspectors submit different evidence or assessments for the same inspection checkpoint simultaneously, which conflict resolution approach should the system use? → A: Manager-mediated: System flags conflict and requires project manager to manually resolve with side-by-side comparison
- Q: How should the system handle time-sensitive approvals when the assigned project manager is unavailable? → A: Delayed-approval queue: Hold inspections in pending state with urgent notifications until original manager returns
- Q: How should the system handle team member role changes during active projects? → A: Project-completion boundary: Role changes take effect only for new projects, existing project assignments remain unchanged until completion
- Q: What should be the synchronization priority when offline mobile data reconnects? → A: Status-first priority: Sync status changes and critical updates first, then upload evidence files in background
- Q: What should be the real-time update strategy for dashboards with multiple concurrent users? → A: Instant updates: Every change broadcasts immediately to all connected users for maximum real-time responsiveness

## User Scenarios & Testing _(mandatory)_

### Primary User Story

Renewable energy project managers need to coordinate field inspections, track progress in real-time, and ensure quality compliance through evidence-based approvals. Field inspectors capture inspection data on mobile devices while project leaders monitor progress and approve results through a centralized web dashboard, enabling fast decision-making and stakeholder reporting. **NEW**: All participants receive live updates without page refresh for immediate coordination.

### Acceptance Scenarios

1. **Given** a new renewable energy project is initiated, **When** a project manager creates inspection assignments in the web app, **Then** field inspectors receive **real-time mobile notifications** with inspection checklists and can capture evidence on-site
2. **Given** an inspector completes field data collection with photos and location data, **When** the inspection is submitted via mobile, **Then** the web dashboard **immediately reflects the updated status** and evidence for manager review **without page refresh**
3. **Given** inspection evidence is submitted and requires approval, **When** a manager reviews the evidence and approves/rejects with notes, **Then** **instant notifications** are sent to relevant stakeholders and the inspection status updates **live across all dashboards**
4. **Given** multiple inspections are completed across a project, **When** a stakeholder requests a compliance report, **Then** the system generates a comprehensive report with evidence, timelines, and approval history ready for export **with real-time data**
5. **Given** field inspectors are working in areas with limited connectivity, **When** data is captured offline on mobile, **Then** the web dashboard shows sync status and updates **automatically in real-time** when connectivity is restored

### Edge Cases

- System flags conflicting evidence submissions and requires project manager to manually resolve disputes through side-by-side comparison interface with **real-time conflict resolution** notifications
- Time-sensitive inspections are held in delayed-approval queue with urgent notifications when required approvers are unavailable, maintaining approval hierarchy integrity **with live escalation alerts**
- Team member role changes take effect only for new projects, while existing project assignments remain unchanged until completion to ensure workflow stability **with instant permission updates** applied to future projects

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide role-aware home dashboards showing relevant KPIs, alerts, and shortcuts for each user type (Executive, Project Manager, Inspector) **with real-time data updates**
- **FR-002**: System MUST allow project managers to create and assign inspections with custom checklists to field inspectors **with instant notifications**
- **FR-003**: System MUST enable real-time tracking of inspection status across multiple stages (draft, pending, in review, approved, rejected) **with instant live status broadcasting** to all connected users
- **FR-004**: System MUST support evidence capture including photos, videos, location data, and timestamps through mobile interface **with Supabase Storage integration**
- **FR-005**: System MUST provide streamlined approval workflows with required notes and **real-time notifications** to stakeholders
- **FR-006**: System MUST generate customizable reports with one-click summaries, saved templates, and scheduled deliveries **with live data**
- **FR-007**: System MUST maintain comprehensive search functionality across projects, inspections, evidence, users, and reports with reusable filter presets **and real-time result updates**
- **FR-008**: System MUST provide central activity feed with **real-time alerts** for assignments and status changes
- **FR-009**: System MUST support offline data capture on mobile with sync status indicators and **automatic real-time updates** when connectivity is restored, prioritizing status changes and critical updates before evidence file uploads
- **FR-010**: System MUST implement project-based team administration with clear role definitions and approval hierarchies **using Supabase Auth and RLS policies**
- **FR-011**: System MUST provide **instant real-time project dashboards** with KPIs, trends, maps, and configurable time ranges that broadcast every change immediately to all connected users
- **FR-012**: System MUST maintain detailed inspection records including summary, checklist responses, media gallery, location, timeline, and comments **with live updates**
- **FR-013**: System MUST support evidence verification through location and timestamp validation **with Supabase Storage metadata**
- **FR-014**: System MUST enable bulk operations for multiple inspection assignments and status updates **with real-time progress tracking**
- **FR-015**: System MUST provide audit trails for all inspection activities, approvals, and report generation **with real-time audit logging**
- **FR-016**: System MUST support projects with up to 50 inspections and 10 concurrent team members with responsive performance **and real-time collaboration**
- **FR-017**: System MUST authenticate users via **Supabase Auth** with email/password and enable project managers to invite team members to specific projects **with instant access provisioning**
- **FR-018**: System MUST respond to user interactions within 1 second for navigation, form submission, status updates, evidence viewing, and search operations, and complete report generation within 3 seconds **with real-time updates not counting toward response time**
- **FR-019**: System MUST retain all inspection evidence permanently for compliance purposes with file size limits of 50MB per individual file and 1GB total per inspection **using Supabase Storage with automatic backup**
- **FR-020**: System MUST notify project managers **in real-time** when an inspection receives 2 rejections and require manual reassignment to resolve escalation

### Key Entities _(include if feature involves data)_

- **Profile**: User profiles linked to Supabase Auth with roles (Executive, Project Manager, Inspector) and **real-time presence**
- **Project**: Represents a renewable energy project with milestones, status tracking, and associated inspections **with live collaboration**
- **Inspection**: Individual inspection instance with checklists, evidence, status, assignments, and approval history **with real-time status updates**
- **Evidence**: Media files (photos/videos) stored in **Supabase Storage** with metadata including location, timestamp, annotations, and verification status
- **User**: Team members with specific roles and project-based permissions **managed through Supabase Auth and RLS**
- **Report**: Generated summaries and compliance documents with templates, scheduling, and export capabilities **with real-time data**
- **Approval**: Decision records with notes, timestamps, approver identity, and **real-time notification history**
- **Checklist**: Inspection templates with customizable questions, required fields, and validation rules
- **Notification**: **Real-time alert system** for assignments, status changes, and workflow events with delivery preferences

---

## Architecture Updates _(new section)_

### Real-time Capabilities
- **Instant Status Updates**: Every inspection status change broadcasts immediately to all connected users for maximum responsiveness
- **Real-time Notifications**: Immediate alerts for assignments, approvals, and escalations
- **Live Evidence Updates**: Evidence uploads appear instantly in inspection views
- **Collaborative Dashboards**: Multiple users can view live project updates simultaneously with instant change propagation

### Supabase Integration Benefits
- **Managed Database**: PostgreSQL hosting with automatic scaling and backups
- **Integrated Authentication**: JWT-based auth with role management and social logins
- **File Storage**: CDN-delivered evidence files with signed URLs and access policies
- **Row Level Security**: Database-level security policies for multi-tenant data isolation
- **Real-time Subscriptions**: WebSocket-based live updates with offline queue support

### Mobile-First Enhancements
- **Offline-First**: Data captured offline syncs automatically with real-time conflict resolution
- **Push Notifications**: Native mobile notifications for critical updates
- **Progressive Web App**: Enhanced mobile experience with app-like features
- **Touch Optimization**: 44px+ touch targets with haptic feedback support

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed
- [x] **NEW**: Real-time capabilities clearly defined

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
- [x] **NEW**: Supabase migration benefits articulated

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
- [x] **NEW**: Supabase architecture integration planned

---
