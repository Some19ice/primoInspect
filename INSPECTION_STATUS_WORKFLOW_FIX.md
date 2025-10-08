# Inspection Status Workflow Fix

## Issue
There was a mismatch in the inspection status workflow. The system was checking for `IN_REVIEW` status to trigger manager review actions, but inspections were being marked as `PENDING` when submitted by inspectors.

## Correct Status Workflow

According to the database schema documentation and intended design:

```
DRAFT → PENDING → IN_REVIEW → APPROVED/REJECTED
```

### Status Definitions

1. **DRAFT** - Inspection created, inspector is filling it out
2. **PENDING** - Inspector has submitted, **waiting for manager to review**
3. **IN_REVIEW** - Manager has opened the inspection and is actively reviewing
4. **APPROVED** - Manager approved the inspection
5. **REJECTED** - Manager rejected, inspector needs to revise

## Changes Made

### 1. Manager Dashboard (`app/dashboard/manager/page.tsx`)

**Changed:**
- Pending approvals now filter by `status === 'PENDING'` (was `IN_REVIEW`)
- Dashboard shows inspections that are waiting for manager action

```typescript
// Before
const pendingApprovals = inspections.filter(i => i.status === 'IN_REVIEW').length

// After
const pendingApprovals = inspections.filter(i => i.status === 'PENDING').length
```

### 2. Inspection Detail Page (`app/inspections/[id]/page.tsx`)

**Changed:**
- Review button now appears for `PENDING` status (inspector submitted, ready for review)
- Added separate section for `IN_REVIEW` status (manager is actively reviewing)
- Removed duplicate `PENDING` section that was meant for inspectors

**Manager Actions by Status:**

#### DRAFT
- Shows "Awaiting Inspector" - inspector hasn't started yet

#### PENDING (NEW - triggers review)
```typescript
{inspection.status === 'PENDING' && (
  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h4>Ready for Review</h4>
    <p>The inspector has completed this inspection. Review and approve or request changes.</p>
    <Button onClick={() => router.push(`/inspections/${inspection.id}/review`)}>
      Review Inspection
    </Button>
  </div>
)}
```

#### IN_REVIEW
```typescript
{inspection.status === 'IN_REVIEW' && (
  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
    <h4>Under Review</h4>
    <p>You are currently reviewing this inspection.</p>
    <Button onClick={() => router.push(`/inspections/${inspection.id}/review`)}>
      Continue Review
    </Button>
  </div>
)}
```

#### APPROVED
- Shows completion confirmation

#### REJECTED
- Shows rejection notice with inspector name

### 3. Review Page (`app/inspections/[id]/review/page.tsx`)

**Added Automatic Status Transition:**

When a manager opens the review page:
1. If inspection status is `PENDING`, automatically change it to `IN_REVIEW`
2. This indicates the manager has started the review process
3. Accepts both `PENDING` and `IN_REVIEW` statuses

```typescript
// If status is PENDING, automatically change it to IN_REVIEW when manager opens it
if (data.status === 'PENDING') {
  await fetch(`/api/inspections/${inspectionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'IN_REVIEW' }),
  })
  setInspection({ ...data, status: 'IN_REVIEW' })
}
```

## Complete User Journey

### Inspector Flow
1. Create inspection → `DRAFT`
2. Fill out checklist → still `DRAFT`
3. Submit for review → `PENDING`
4. Wait for manager review
5. If rejected → back to `PENDING` or `DRAFT` (can revise)
6. If approved → `APPROVED` ✅

### Manager Flow
1. See inspection on dashboard with "Pending Approvals" badge (status: `PENDING`)
2. Click "Review" button
3. Status automatically changes to `IN_REVIEW`
4. Review all responses and evidence
5. Approve or reject with notes
6. Status changes to `APPROVED` or `REJECTED`
7. Inspector receives notification

## Visual Status Indicators

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| DRAFT | Gray | - | Not started or in progress |
| PENDING | Blue | FileText | Waiting for manager review |
| IN_REVIEW | Purple | Clock | Manager is reviewing |
| APPROVED | Green | CheckCircle | Completed successfully |
| REJECTED | Red | XCircle | Needs revision |

## API Endpoints Affected

### GET /api/inspections (list)
- Returns inspections filtered by status
- Managers see `PENDING` in their pending list

### GET /api/inspections/[id] (detail)
- Returns single inspection with current status

### PUT /api/inspections/[id] (update)
- Can update status from `PENDING` to `IN_REVIEW`
- Used automatically by review page

### POST /api/inspections/[id]/approve
- Still checks for `IN_REVIEW` status (correct)
- Changes status to `APPROVED` or `REJECTED`

## Benefits of This Workflow

1. **Clear separation**: 
   - `PENDING` = waiting for action
   - `IN_REVIEW` = action in progress

2. **Better tracking**: 
   - Managers can see how many inspections are truly waiting
   - Can distinguish between new submissions and those being reviewed

3. **Real-time indicators**:
   - Inspectors know when a manager has opened their inspection
   - Prevents duplicate reviews by multiple managers

4. **Audit trail**:
   - Clear timestamps of when inspection moved through each stage
   - When submitted (PENDING)
   - When review started (IN_REVIEW)
   - When decision made (APPROVED/REJECTED)

## Testing Checklist

- [ ] Inspector submits inspection → status becomes `PENDING`
- [ ] Manager dashboard shows inspection in "Pending Approvals"
- [ ] Manager clicks "Review" button from inspection detail page
- [ ] Status automatically changes to `IN_REVIEW`
- [ ] Manager can see all responses and evidence
- [ ] Manager approves/rejects
- [ ] Status changes to `APPROVED` or `REJECTED`
- [ ] Inspector receives notification
- [ ] If rejected, inspector can revise and resubmit
