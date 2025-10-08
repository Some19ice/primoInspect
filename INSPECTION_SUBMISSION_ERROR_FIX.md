# Inspection Submission Error Fix

**Date:** 2025-01-06  
**Issue:** Inspectors unable to save inspection responses - database constraint violation  
**Status:** ✅ FIXED

---

## Problem Summary

Inspectors encountered an error when attempting to:
1. Save draft responses during inspection execution
2. Submit completed inspections for review

The error was caused by a mismatch between the database schema constraints and the seed data.

---

## Root Cause

### Database Schema Constraint (Line 64 in `20250927_initial_schema.sql`)
```sql
CREATE TABLE inspections (
  ...
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
  ...
);
```

**Allowed status values:**
- `DRAFT` - Inspection created, being filled out
- `PENDING` - Submitted, waiting for manager review
- `IN_REVIEW` - Manager is reviewing
- `APPROVED` - Approved by manager
- `REJECTED` - Rejected, needs revision

### Seed Data Issue (Lines 240, 254 in `seed.sql`)
```sql
-- ❌ WRONG - Used invalid 'ASSIGNED' status
('insp-1004', ..., 'ASSIGNED', ...)
('insp-3002', ..., 'ASSIGNED', ...)
```

The seed data used **`ASSIGNED`** status which is **NOT** in the CHECK constraint's allowed list.

### Error Behavior

When the inspector tried to save responses:
1. Frontend calls `PUT /api/inspections/[id]` with `{ responses: {...} }`
2. Backend calls `supabaseDatabase.updateInspection(id, body)`
3. Supabase attempts to update the inspection row
4. **PostgreSQL CHECK constraint violation** - operation fails
5. Error returned to frontend, responses not saved

---

## Solution

### 1. Fixed Seed Data ✅

**File:** `supabase/seed.sql`

Changed:
```sql
-- Before (WRONG)
('insp-1004', ..., 'ASSIGNED', ...)

-- After (CORRECT)
('insp-1004', ..., 'DRAFT', ...)
```

This ensures seed data only uses valid status values.

### 2. Created Migration Script ✅

**File:** `supabase/migrations/20250106_fix_assigned_status.sql`

```sql
-- Update any existing inspections with invalid ASSIGNED status
UPDATE inspections 
SET status = 'DRAFT'
WHERE status = 'ASSIGNED';

-- Document valid statuses
COMMENT ON COLUMN inspections.status IS 'Valid values: DRAFT, PENDING, IN_REVIEW, APPROVED, REJECTED';
```

This fixes any existing data that might have the invalid status.

### 3. Improved Error Handling ✅

**File:** `app/inspections/[id]/execute/page.tsx`

#### Before:
```typescript
// Error not logged, no details returned
catch (error) {
  console.error('Error saving draft:', error)
}
```

#### After:
```typescript
// Detailed error logging with response data
if (!response.ok) {
  const errorData = await response.json()
  console.error('Save draft error:', errorData)
  throw new Error(errorData.error || 'Failed to save draft')
}
```

**File:** `app/api/inspections/[id]/route.ts`

#### Added:
```typescript
// Log incoming data
console.log('Updating inspection:', id, 'with data:', JSON.stringify(body).substring(0, 200))

// Log errors with full details
console.error('Error details:', JSON.stringify(result.error, null, 2))

// Return detailed error messages
return NextResponse.json({
  error: 'Failed to update inspection',
  details: result.error.message || String(result.error)
}, { status: 500 })
```

### 4. Removed Unnecessary Field ✅

Removed manual `updated_at` from request body - the database handles this automatically:

```typescript
// Before
body: JSON.stringify({
  responses,
  updated_at: new Date().toISOString(),  // ❌ Unnecessary
})

// After
body: JSON.stringify({
  responses,  // ✅ Clean
})
```

---

## How to Apply Fix

### Step 1: Apply Database Migration

Run the migration to fix existing data:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard SQL Editor
```

**SQL to run:**
```sql
UPDATE inspections 
SET status = 'DRAFT'
WHERE status = 'ASSIGNED';
```

### Step 2: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

### Step 3: Test Inspector Workflow

1. Log in as inspector
2. Navigate to an inspection
3. Click "Start Inspection"
4. Answer a few questions
5. Click "Save Draft" - should see success toast ✅
6. Complete remaining questions
7. Click "Submit Inspection" - should transition to PENDING ✅

---

## Verification

### Check Database Status Values

```sql
-- Should return only valid statuses
SELECT DISTINCT status FROM inspections;

-- Expected result:
-- DRAFT
-- PENDING
-- IN_REVIEW
-- APPROVED
-- REJECTED
```

### Check Browser Console

**Success indicators:**
```
Updating inspection: insp-1004 with data: {"responses":{"sp-001":{"value":true,...}}}
Successfully updated inspection: insp-1004
```

**Error indicators (if still failing):**
```
Error updating inspection: {code: "...", message: "...", details: "..."}
Error details: {...}
```

---

## Status Flow Reference

```
┌─────────┐
│  DRAFT  │ ← New inspection, being filled out
└────┬────┘
     │ Inspector submits
     v
┌─────────┐
│ PENDING │ ← Awaiting manager review
└────┬────┘
     │ Manager reviews
     v
┌───────────┐
│ IN_REVIEW │ ← Currently being reviewed
└─────┬─────┘
      │
      ├─────→ ┌──────────┐
      │       │ APPROVED │ (Terminal state)
      │       └──────────┘
      │
      └─────→ ┌──────────┐
              │ REJECTED │ → Can revise & resubmit to PENDING
              └──────────┘
```

**Note:** There is **NO** `ASSIGNED` status in the schema. Inspections start in `DRAFT` status.

---

## Related Files

### Modified Files
1. `supabase/seed.sql` - Fixed invalid ASSIGNED status
2. `app/inspections/[id]/execute/page.tsx` - Better error handling
3. `app/api/inspections/[id]/route.ts` - Detailed error logging

### Created Files
1. `supabase/migrations/20250106_fix_assigned_status.sql` - Migration to fix data
2. `INSPECTION_SUBMISSION_ERROR_FIX.md` - This documentation

### Reference Files
1. `supabase/migrations/20250927_initial_schema.sql` - Status constraint definition (line 64)
2. `lib/services/inspection-state-machine.ts` - Status transition logic
3. `lib/supabase/database.ts` - updateInspection function (line 912)

---

## Future Prevention

### 1. Type Safety

Add TypeScript type for status values:

```typescript
export type InspectionStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'IN_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED'

// Use in function signatures
function updateStatus(status: InspectionStatus) { ... }
```

### 2. Validation in API

Add explicit validation before database call:

```typescript
const VALID_STATUSES = ['DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED']

if (body.status && !VALID_STATUSES.includes(body.status)) {
  return NextResponse.json(
    { error: `Invalid status: ${body.status}` },
    { status: 400 }
  )
}
```

### 3. Database Tests

Add test to verify CHECK constraint:

```typescript
test('should reject invalid status', async () => {
  const result = await supabaseDatabase.updateInspection('test-id', {
    status: 'INVALID_STATUS'
  })
  expect(result.error).toBeTruthy()
})
```

---

## Summary

✅ **Fixed seed data** - Changed `ASSIGNED` to `DRAFT`  
✅ **Created migration** - Updates existing invalid data  
✅ **Improved logging** - Detailed error messages for debugging  
✅ **Cleaned code** - Removed unnecessary `updated_at` field  

**Impact:** Inspectors can now successfully save and submit inspection responses without database constraint violations.
