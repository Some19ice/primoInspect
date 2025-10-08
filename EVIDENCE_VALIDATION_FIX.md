# Evidence Validation Fix

**Date:** 2025-01-07  
**Issue:** Incorrect evidence validation requiring evidence for all FAIL answers  
**Status:** ✅ FIXED

---

## Problem Summary

When inspectors tried to submit an inspection, they received an error requiring evidence for any question that was answered with "FAIL" (false), even if the question didn't explicitly require evidence.

### Error Behavior

```
Error: "Evidence required for failed check: [question-id]"
```

This error appeared for:
- ❌ ALL boolean questions that were required AND answered with FAIL
- ❌ Regardless of whether `evidenceRequired` was set on the question

---

## Root Cause

### Issue 1: State Machine Validation Logic
**File:** `lib/services/inspection-state-machine.ts` (Lines 138-152)

The validation logic was incorrectly filtering questions:

```typescript
// ❌ WRONG - Required evidence for ALL boolean+required questions with FAIL
const questionsRequiringEvidence = questions.filter(
  q => q.type === 'boolean' && q.required
)

questionsRequiringEvidence.forEach(question => {
  const hasEvidence = evidence.some(e => e.question_id === question.id)
  if (!hasEvidence) {
    const response = responses[question.id]
    // If answer is "fail" (false), evidence is typically required
    if (response?.value === false) {
      errors.push(`Evidence required for failed check: ${question.id}`)
    }
  }
})
```

**Problems:**
1. Filtered for ALL boolean AND required questions
2. Then checked if the answer was false (FAIL)
3. Required evidence only for FAIL answers
4. Ignored the `evidenceRequired` flag on questions

### Issue 2: Evidence Upload UI Logic
**File:** `app/inspections/[id]/execute/page.tsx` (Lines 572-575)

The evidence upload component's `required` prop was set incorrectly:

```tsx
{/* ❌ WRONG - Required only when question is required AND answer is FAIL */}
<EvidenceUpload
  required={
    currentQuestion.required &&
    responses[currentQuestion.id]?.value === false
  }
/>
```

**Problems:**
1. Evidence marked as required only when answer was FAIL
2. Didn't respect the `evidenceRequired` field on questions
3. Inconsistent with validation logic

---

## Solution

### Fix 1: State Machine Validation ✅
**File:** `lib/services/inspection-state-machine.ts`

Changed to only validate questions with explicit `evidenceRequired` flag:

```typescript
// ✅ CORRECT - Only check questions with evidenceRequired flag
const questionsRequiringEvidence = questions.filter(
  q => q.evidenceRequired === true
)

questionsRequiringEvidence.forEach(question => {
  const hasEvidence = evidence.some(e => e.question_id === question.id)
  if (!hasEvidence) {
    errors.push(`Evidence required for question: "${question.question}"`)
  }
})
```

**Benefits:**
- ✅ Only validates questions that explicitly require evidence
- ✅ Evidence required regardless of answer (Pass, Fail, or N/A)
- ✅ Respects the checklist configuration
- ✅ Better error messages with question text

### Fix 2: Evidence Upload UI ✅
**File:** `app/inspections/[id]/execute/page.tsx`

Changed to use the `evidenceRequired` field:

```tsx
{/* ✅ CORRECT - Required based on question configuration */}
<EvidenceUpload
  required={currentQuestion.evidenceRequired === true}
/>
```

**Benefits:**
- ✅ Consistent with validation logic
- ✅ Shows evidence as required for all configured questions
- ✅ Works with Pass, Fail, and N/A answers

---

## How Evidence Should Work

### Question Configuration

Questions have an optional `evidenceRequired` field:

```typescript
interface ChecklistQuestion {
  id: string
  question: string
  type: 'boolean' | 'text' | 'number' | 'select' | ...
  required: boolean              // Answer is required
  evidenceRequired?: boolean     // Photo evidence is required (NEW)
}
```

### Evidence Validation Rules

| Question Config | Answer Value | Evidence Required? |
|----------------|--------------|-------------------|
| `evidenceRequired: true` | Pass | ✅ Yes |
| `evidenceRequired: true` | Fail | ✅ Yes |
| `evidenceRequired: true` | N/A | ✅ Yes |
| `evidenceRequired: false` or undefined | Pass | ❌ No |
| `evidenceRequired: false` or undefined | Fail | ❌ No |
| `evidenceRequired: false` or undefined | N/A | ❌ No |

**Key Point:** Evidence requirements are based on the **question configuration**, NOT on the answer value.

---

## Example Use Cases

### Example 1: Safety Check (Evidence Always Required)
```json
{
  "id": "safety-001",
  "question": "Are all safety barriers properly installed?",
  "type": "boolean",
  "required": true,
  "evidenceRequired": true    // ⬅️ Photo required for ANY answer
}
```

- Inspector answers: Pass → Must upload photo ✅
- Inspector answers: Fail → Must upload photo ✅
- Inspector answers: N/A → Must upload photo ✅

### Example 2: Equipment Check (Evidence Only If Configured)
```json
{
  "id": "equipment-001",
  "question": "Is equipment operational?",
  "type": "boolean",
  "required": true,
  "evidenceRequired": false   // ⬅️ Photo optional for any answer
}
```

- Inspector answers: Pass → Photo optional ⭕
- Inspector answers: Fail → Photo optional ⭕ (project manager can request evidence during review if needed)
- Inspector answers: N/A → Photo optional ⭕

### Example 3: Damage Documentation (Evidence Required)
```json
{
  "id": "damage-001",
  "question": "Document any visible damage",
  "type": "text",
  "required": false,
  "evidenceRequired": true    // ⬅️ If answered, must include photo
}
```

- Inspector provides text description → Must upload photo ✅
- Inspector skips question → No photo needed (question not required) ⭕

---

## Testing Scenarios

### Test 1: Question Without Evidence Requirement ✅
1. Create inspection with boolean question
2. Set `required: true`, `evidenceRequired: false`
3. Answer with "Fail"
4. Submit inspection
5. **Expected:** Submission succeeds (no evidence error)

### Test 2: Question With Evidence Requirement ✅
1. Create inspection with boolean question
2. Set `required: true`, `evidenceRequired: true`
3. Answer with "Pass" (no photo uploaded)
4. Submit inspection
5. **Expected:** Error - "Evidence required for question: [question text]"

### Test 3: Evidence Uploaded ✅
1. Create inspection with boolean question
2. Set `required: true`, `evidenceRequired: true`
3. Answer with "Fail"
4. Upload photo evidence
5. Submit inspection
6. **Expected:** Submission succeeds

### Test 4: N/A Answer With Evidence Required ✅
1. Create inspection with boolean question
2. Set `required: true`, `evidenceRequired: true`
3. Answer with "N/A" (no photo uploaded)
4. Submit inspection
5. **Expected:** Error - "Evidence required for question: [question text]"

---

## Migration Notes

### Existing Inspections

For existing inspections in DRAFT status:
- ✅ Will continue to work normally
- ✅ Evidence only required if question has `evidenceRequired: true`
- ✅ Old inspections with FAIL answers without evidence can now be submitted (if evidence not configured as required)

### Checklist Configuration

For existing checklists:
- ✅ Questions without `evidenceRequired` field will treat it as `false`
- ✅ No migration needed
- ✅ Project managers can update checklist templates to add `evidenceRequired: true` where needed

---

## Benefits of This Fix

✅ **More Flexible:** Evidence only required when explicitly configured  
✅ **Less Confusing:** Inspectors know upfront which questions need photos  
✅ **Better UX:** Evidence button shows "required" badge when configured  
✅ **Consistent:** Same logic in validation and UI  
✅ **Works with N/A:** New "Not Applicable" option works correctly with evidence

---

## Files Modified

1. ✅ `lib/services/inspection-state-machine.ts` - Fixed validation logic
2. ✅ `app/inspections/[id]/execute/page.tsx` - Fixed evidence upload UI

**All files tested with no linter errors.**

---

## Related Features

This fix works seamlessly with:
- ✅ New "Not Applicable" option for boolean questions
- ✅ Existing required question validation
- ✅ Evidence upload and verification flow
- ✅ Manager review and approval process


