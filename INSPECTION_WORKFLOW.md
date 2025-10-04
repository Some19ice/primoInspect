# Inspection Workflow

## Correct Role-Based Workflow

### 1. Manager Creates Inspection Assignment (Status: DRAFT)
**Who**: Project Manager  
**Action**: Creates an inspection and assigns it to an inspector  
**Location**: 
- Dashboard → "Assign Inspection" button
- Project page → "Create Inspection" 
- `/inspections/create?projectId=xxx`

**What Happens**:
- Manager selects a checklist template
- Configures inspection details (title, description, priority, due date)
- Assigns to a specific inspector
- Inspection is created with status `DRAFT`
- Inspector receives notification

### 2. Inspector Starts Inspection (Status: PENDING)
**Who**: Assigned Inspector  
**Action**: Begins the inspection and starts filling out the checklist  
**Location**: 
- Inspector Dashboard → Assigned inspections
- Inspection detail page → "Start Inspection" button
- `/inspections/[id]/execute`

**What Happens**:
- Inspector clicks "Start Inspection"
- Status changes from `DRAFT` to `PENDING`
- Inspector fills out checklist questions
- Can save progress and continue later
- Can upload evidence (photos, documents)

### 3. Inspector Submits for Review (Status: IN_REVIEW)
**Who**: Assigned Inspector  
**Action**: Completes checklist and submits for manager approval  
**Location**: Inspection execution page

**What Happens**:
- Inspector completes all required questions
- Uploads required evidence
- Clicks "Submit for Review"
- Status changes from `PENDING` to `IN_REVIEW`
- Manager receives notification

### 4. Manager Reviews and Approves/Rejects
**Who**: Project Manager  
**Action**: Reviews completed inspection and makes decision  
**Location**: 
- Manager Dashboard → "Pending Approvals"
- Inspection detail page → "Review Inspection" button
- `/inspections/[id]/review`

**What Happens**:
- Manager reviews all responses and evidence
- Can approve (status → `APPROVED`) or reject (status → `REJECTED`)
- If rejected, inspector can revise and resubmit
- If approved, inspection is complete

## Status Flow

```
DRAFT → PENDING → IN_REVIEW → APPROVED
                              ↓
                          REJECTED → (back to PENDING for revision)
```

## Key Changes Made

### 1. Inspection Detail Page (`app/inspections/[id]/page.tsx`)
- **Inspector View**: Shows clear status-based actions
  - DRAFT: "Start Inspection" button with explanation
  - PENDING: "Continue Inspection" button
  - IN_REVIEW: "Under Review" status message
  - REJECTED: "Revise Inspection" button with feedback
  - APPROVED: "Approved" confirmation message

- **Manager View**: Shows appropriate oversight actions
  - DRAFT: "Awaiting Inspector" message
  - IN_REVIEW: "Review Inspection" button
  - Other statuses: Status information

### 2. Create Inspection Page (`app/inspections/create/page.tsx`)
- Changed title from "Create New Inspection" to "Create Inspection Assignment"
- Updated descriptions to clarify this is an assignment, not execution
- Changed button text to "Create & Assign Inspection"
- Success message now mentions the assigned inspector

### 3. Manager Dashboard (`app/dashboard/manager/page.tsx`)
- Changed button text from "New Inspection" to "Assign Inspection"
- Clarifies that managers assign, not execute

## Benefits of This Workflow

1. **Clear Separation of Duties**: Managers plan and oversee, inspectors execute
2. **Accountability**: Each inspection has a clear owner (assigned inspector)
3. **Quality Control**: Manager review ensures standards are met
4. **Audit Trail**: Status changes track the inspection lifecycle
5. **Notifications**: Automatic notifications keep everyone informed
6. **Revision Process**: Rejected inspections can be revised and resubmitted

## User Experience

### For Managers
- Create inspection assignments with clear checklists
- Monitor progress of assigned inspections
- Review completed work before approval
- Track team performance and workload

### For Inspectors
- Receive clear assignments with all necessary information
- Start inspections when ready
- Save progress and work at their own pace
- Submit for review when complete
- Revise if needed based on feedback

## Technical Implementation

- **Status Field**: Enforces workflow progression
- **Role-Based Access**: Different views for managers vs inspectors
- **Notifications**: Automatic alerts at each status change
- **Audit Logging**: Tracks all status changes and actions
- **RLS Policies**: Database-level security ensures proper access
