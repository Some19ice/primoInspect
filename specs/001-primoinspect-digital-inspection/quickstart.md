# Quickstart: PrimoInspect Digital Inspection Platform

**Phase 1 Validation Output** | **Date**: 2025-09-26 | **Feature**: 001-primoinspect-digital-inspection

## Overview

This quickstart guide provides end-to-end validation scenarios for demonstrating PrimoInspect's mobile-first inspection platform. All scenarios are designed to verify constitutional principles and clarified requirements through real user workflows.

## Prerequisites

### Development Environment

- Node.js 18+ installed
- Next.js 14 project initialized
- Database setup (PostgreSQL recommended)
- File storage configured (local for development)

### Demo Data Setup

```bash
# Initialize demo project
npm run seed:demo-data

# Create demo users
- Executive: john.doe@example.com (password: Demo123!)
- Project Manager: jane.smith@example.com (password: Demo123!)
- Inspector: mike.jones@example.com (password: Demo123!)
```

### Performance Validation Tools

- Lighthouse CLI for mobile performance validation
- Chrome DevTools for network throttling (3G simulation)
- React DevTools for component performance

## Core Validation Scenarios

### Scenario 1: Mobile-First Evidence Capture

**Constitutional Principle**: Mobile-First Experience
**Validation Objective**: Verify thumb-friendly navigation and mobile evidence upload

**Steps**:

1. **Setup**: Open browser in mobile viewport (375x667px)
2. **Login**: Authenticate as Inspector (mike.jones@example.com)
3. **Navigate**: Access assigned inspection via mobile dashboard
4. **Capture Evidence**:
   - Take photo using device camera (simulate with file upload)
   - Verify location data is captured automatically
   - Add text annotation to evidence
   - Confirm upload progress shows (chunked upload for 50MB limit)
5. **Submit Inspection**: Complete checklist and submit for review

**Expected Results**:

- ✅ All buttons minimum 44px height (touch-friendly)
- ✅ Navigation optimized for thumb reach
- ✅ File upload supports up to 50MB per file
- ✅ Upload progress indicator shows chunked progress
- ✅ Location and timestamp automatically captured
- ✅ Mobile keyboard optimized for form inputs
- ✅ Page loads within 1 second on 3G simulation

**Performance Validation**:

```bash
# Run Lighthouse mobile audit
lighthouse http://localhost:3000/inspector/inspections/123 --preset=perf --view

# Expected scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >90
```

### Scenario 2: Role-Based Dashboard Access

**Constitutional Principle**: Role-Oriented UX
**Validation Objective**: Verify each role sees only relevant information

**Executive Dashboard Test**:

1. **Login**: Authenticate as Executive (john.doe@example.com)
2. **Dashboard Access**: Navigate to executive dashboard
3. **Verify Content**:
   - High-level KPIs visible (project progress, completion rates)
   - Real-time status charts and trends
   - No operational controls (approve/reject buttons hidden)
   - Report generation and export options available

**Project Manager Dashboard Test**:

1. **Login**: Authenticate as Project Manager (jane.smith@example.com)
2. **Dashboard Access**: Navigate to manager dashboard
3. **Verify Content**:
   - Inspection approval queue prominent
   - Team management and assignment tools
   - Project orchestration controls
   - Evidence review and approval workflows

**Inspector Dashboard Test**:

1. **Login**: Authenticate as Inspector (mike.jones@example.com)
2. **Dashboard Access**: Navigate to inspector dashboard (web follow-up)
3. **Verify Content**:
   - Assigned inspections list
   - Submission status tracking
   - Limited to own assignments only
   - No approval or management controls

**Expected Results**:

- ✅ Each role sees distinct, relevant interface
- ✅ No unauthorized controls visible
- ✅ Navigation adapts to role permissions
- ✅ Dashboard loads within 1 second

### Scenario 3: Evidence-Driven Approval Workflow

**Constitutional Principle**: Evidence-Driven Decisions
**Validation Objective**: Verify all approvals require evidence verification

**Steps**:

1. **Inspector Submission**:

   - Complete inspection with photo evidence
   - Add location verification
   - Submit for manager review

2. **Manager Review**:

   - Login as Project Manager
   - Access inspection approval queue
   - View evidence with location/timestamp verification
   - Attempt approval without reviewing evidence (should be blocked)
   - Review evidence gallery with annotations
   - Add required approval notes
   - Approve inspection

3. **Evidence Verification**:
   - Verify location data matches inspection site
   - Confirm timestamp is within reasonable inspection window
   - Check file integrity (50MB limit enforcement)

**Expected Results**:

- ✅ Evidence must be reviewed before approval
- ✅ Location and timestamp verification required
- ✅ Notes required for all approval decisions
- ✅ Evidence gallery supports 50MB files
- ✅ Total inspection evidence limited to 1GB

### Scenario 4: Escalation After Double Rejection

**Clarified Requirement**: Simple escalation workflow
**Validation Objective**: Verify project manager notification after 2 rejections

**Steps**:

1. **First Rejection**:

   - Manager rejects inspection with notes
   - Inspector receives notification
   - Inspection status = "rejected", rejectionCount = 1

2. **Resubmission**:

   - Inspector revises and resubmits
   - Manager reviews and rejects again
   - Inspection status = "rejected", rejectionCount = 2

3. **Escalation Trigger**:
   - System automatically notifies project manager
   - Escalation flag set on inspection
   - Manual reassignment required to proceed

**Expected Results**:

- ✅ Rejection count tracked accurately
- ✅ Automatic PM notification after 2 rejections
- ✅ Manual reassignment required for resolution
- ✅ Audit trail maintained for escalation

### Scenario 5: Real-Time Dashboard Updates

**Constitutional Principle**: Simplicity and Speed
**Validation Objective**: Verify responsive updates and performance targets

**Steps**:

1. **Multi-User Setup**:

   - Open inspector view in one browser tab
   - Open manager dashboard in another tab (different user)

2. **Real-Time Updates**:

   - Inspector submits new inspection
   - Verify manager dashboard updates within 5 seconds
   - Inspector uploads evidence
   - Verify evidence appears in manager review queue

3. **Performance Monitoring**:
   - Measure dashboard load times
   - Test with multiple concurrent users (5-10 simulated)
   - Verify network efficiency on mobile

**Expected Results**:

- ✅ Dashboard updates within 5 seconds
- ✅ Inspection operations complete within 1 second
- ✅ Report generation completes within 3 seconds
- ✅ Mobile data usage optimized (query caching)

### Scenario 6: Offline-to-Online Sync

**Mobile-First Requirement**: Offline capability with sync indicators
**Validation Objective**: Test offline evidence capture and sync

**Steps**:

1. **Offline Simulation**:

   - Enable network throttling to "Offline"
   - Attempt evidence capture on mobile
   - Verify offline queue functionality

2. **Sync Restoration**:
   - Re-enable network connectivity
   - Verify automatic sync initiation
   - Check sync status indicators
   - Confirm evidence upload completion

**Expected Results**:

- ✅ Offline evidence capture queued
- ✅ Sync status clearly indicated
- ✅ Automatic sync on connectivity restoration
- ✅ Progress indicators during sync

## API Validation Suite

### API Endpoint Validation

```bash
# Verify all endpoints are functional
npm run validate:api

# Expected functionality:
# POST /api/inspections - assignment creation
# PUT /api/inspections/{id} - status updates
# POST /api/inspections/{id}/evidence - file uploads
# POST /api/inspections/{id}/approve - approval workflow
# GET /api/projects/{id}/dashboard - role-based data
```

### Database Schema Validation

```bash
# Verify database schema and constraints
npm run validate:db

# Data integrity verification:
# - Foreign key constraints
# - File size limits (50MB/1GB)
# - Rejection count triggers
# - User permission enforcement
```

### Mobile Performance Validation

```bash
# Mobile-specific performance validation
npm run validate:mobile-performance

# Performance targets:
# - First Contentful Paint < 1.5s on 3G
# - Largest Contentful Paint < 2.5s
# - Mobile PageSpeed score > 90
# - Touch target sizes >= 44px
```

## Validation Checklist

### Constitutional Compliance

- [ ] **Mobile-First**: All interfaces optimized for mobile interaction
- [ ] **Clarity Over Completeness**: Essential workflows prioritized
- [ ] **Role-Oriented UX**: Each role sees only relevant information
- [ ] **Evidence-Driven**: All decisions require evidence verification
- [ ] **Simplicity and Speed**: <1s operations, <3s reports

### Clarified Requirements

- [ ] **Scale**: Support 10-50 inspections, 5-10 team members per project
- [ ] **Authentication**: Email/password with manual project invitations
- [ ] **Performance**: <1 second operations, <3 seconds reports
- [ ] **Storage**: 50MB per file, 1GB per inspection, permanent retention
- [ ] **Escalation**: PM notification after 2 rejections, manual reassignment

### Technical Requirements

- [ ] **Next.js 14**: App Router with React Server Components
- [ ] **UI Framework**: shadcn/ui with mobile-optimized components
- [ ] **Data Management**: TanStack React Query with real-time updates
- [ ] **File Handling**: Chunked uploads with progress tracking
- [ ] **Performance**: Lighthouse mobile score >90

## Deployment Validation

### Production Readiness

```bash
# Build and deploy validation
npm run build
npm run start

# Environment checks:
# - NextAuth configuration
# - File upload limits enforced
# - Database migrations applied
# - Performance monitoring active
```

### Security Validation

- [ ] Authentication required for all endpoints
- [ ] Role-based access control enforced
- [ ] File upload security (type validation, size limits)
- [ ] Evidence location/timestamp validation

## Success Criteria

**Functional Success**:

- All 5 core validation scenarios pass
- API endpoint functionality verified
- Mobile performance targets met
- Role-based access properly enforced

**Constitutional Success**:

- Mobile-first experience validated
- Evidence-driven workflow enforced
- Role-oriented UX confirmed
- Simplicity and speed targets achieved

**Performance Success**:

- <1 second for inspection operations
- <3 seconds for report generation
- Mobile Lighthouse score >90
- 50MB file upload with progress tracking

This quickstart validates that PrimoInspect meets all constitutional principles, clarified requirements, and technical specifications for a mobile-first renewable energy inspection platform.
