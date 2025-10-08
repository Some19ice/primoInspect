# Inspection Submit Validation Fix

## Problem
When submitting an inspection, users were seeing an empty error message: `Error submitting inspection: {}` followed by `Inspection validation failed`. The actual validation errors were not being displayed.

## Root Causes

### 1. Missing `question_id` in Evidence Query
The `getInspectionById` method in `lib/supabase/database.ts` was fetching evidence but **not including the `question_id` field**. This meant the state machine validation couldn't check if evidence was linked to the correct questions.

**Before:**
```typescript
evidence(
  id,
  filename,
  url,
  thumbnail_url,
  verified,
  latitude,
  longitude,
  timestamp
)
```

**After:**
```typescript
evidence(
  id,
  filename,
  url,
  thumbnail_url,
  verified,
  latitude,
  longitude,
  timestamp,
  question_id  // ✅ Added
)
```

### 2. Incorrect Error Handling
The execute page was looking for `data.error` but the submit API returns validation errors in `data.validationErrors` array when validation fails.

**Before:**
```typescript
const data = await response.json()
console.error('Error submitting inspection:', data)
throw new Error(data.error || 'Failed to submit inspection')
```

**After:**
```typescript
const data = await response.json()
console.error('Error submitting inspection:', data)

// Handle validation errors from the API
const errorMessage = data.error || 
  (data.validationErrors && data.validationErrors.length > 0 
    ? data.validationErrors.join('. ') 
    : 'Failed to submit inspection')

throw new Error(errorMessage)
```

## How Validation Works

The inspection submission flow:

1. **Execute Page** → Calls `/api/inspections/[id]/submit`
2. **Submit API** → Uses `InspectionStateMachine.validateTransition()`
3. **State Machine** → Checks:
   - All required questions are answered
   - Evidence exists for questions with `evidenceRequired: true`
   - Evidence is linked via `question_id` in the `evidence` array

## Files Changed

1. **lib/supabase/database.ts**
   - Added `question_id` to evidence query in `getInspectionById()`

2. **app/inspections/[id]/execute/page.tsx**
   - Fixed error handling to display `validationErrors` array

## Testing

To verify the fix:

1. Create an inspection with required questions
2. Try to submit without answering all required questions
3. Should see: "X required question(s) not answered"

4. Answer required questions but skip evidence on questions with `evidenceRequired: true`
5. Should see: "Evidence required for question: [question text]"

6. Complete all requirements and submit
7. Should succeed and redirect to inspector dashboard

## Related Files

- `lib/services/inspection-state-machine.ts` - Validation logic
- `app/api/inspections/[id]/submit/route.ts` - Submit endpoint
- `components/evidence/evidence-upload.tsx` - Evidence upload component
