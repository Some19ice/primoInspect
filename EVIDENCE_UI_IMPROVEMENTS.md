# Evidence UI Improvements

**Date:** 2025-01-07  
**Feature:** Enhanced evidence tracking and visual feedback  
**Status:** ✅ COMPLETED

---

## Summary

Improved the inspection execution UI to provide better visual feedback about evidence requirements and automatically navigate to questions that need evidence when submission fails.

---

## User Requirements

1. ✅ **Question boxes should NOT turn green** when a question is answered but still requires evidence
2. ✅ **Navigate to first missing evidence** when submission fails due to missing evidence

---

## Changes Implemented

### 1. New Helper Functions ✅

**File:** `app/inspections/[id]/execute/page.tsx`

Added three new functions to better track question completion status:

```typescript
// Check if question has required evidence
const hasRequiredEvidence = (questionId: string) => {
  const question = questions.find(q => q.id === questionId)
  if (!question || !question.evidenceRequired) {
    return true // No evidence required
  }

  // Check if evidence exists for this question
  const evidence = inspection?.evidence || []
  return evidence.some((e: any) => e.question_id === questionId)
}

// Check if question is fully complete (answered + evidence if required)
const isQuestionComplete = (questionId: string) => {
  return isQuestionAnswered(questionId) && hasRequiredEvidence(questionId)
}
```

**Purpose:**

- `hasRequiredEvidence()` - Checks if a question's evidence requirement is satisfied
- `isQuestionComplete()` - Checks both answer AND evidence (if required)

---

### 2. Enhanced Question Box Colors ✅

**File:** `app/inspections/[id]/execute/page.tsx` (Lines 452-490)

Updated the question overview to show three different states:

```typescript
{questions.map((q, idx) => {
  const complete = isQuestionComplete(q.id)
  const answered = isQuestionAnswered(q.id)
  const needsEvidence = q.evidenceRequired && answered && !hasRequiredEvidence(q.id)

  return (
    <button
      className={`
        ${complete ? 'bg-green-500 text-white' :
          needsEvidence ? 'bg-purple-500 text-white' :
          'bg-white text-gray-600'}
      `}
      title={`Question ${idx + 1}${needsEvidence ? ' - Needs Evidence' : ''}`}
    >
      {idx + 1}
    </button>
  )
})}
```

**Color Legend:**
| Color | Meaning | Condition |
|-------|---------|-----------|
| 🟢 Green | Complete | Answered + Evidence (if required) |
| 🟣 Purple | Needs Evidence | Answered but missing required evidence |
| ⚪ White | Unanswered | No answer yet |
| 🟠 Orange Border | Required | Required question (overlays other states) |
| 🔵 Blue Ring | Current | Currently viewing this question |

**Before:**

```
✅ Green = Answered (even without required evidence)
⚪ White = Unanswered
```

**After:**

```
✅ Green = Fully Complete (answer + evidence if needed)
🟣 Purple = Needs Evidence (answered but evidence missing)
⚪ White = Unanswered
```

---

### 3. Auto-Navigation to Missing Evidence ✅

**File:** `app/inspections/[id]/execute/page.tsx` (Lines 244-260)

When submission fails, automatically navigate to the first question needing evidence:

```typescript
if (!validation.valid) {
  // Check if error is about missing evidence
  const hasMissingEvidence = validation.errors.some(err =>
    err.includes('Evidence required')
  )

  if (hasMissingEvidence) {
    // Find first question that needs evidence
    const firstMissingEvidence = questions.findIndex(
      q =>
        q.evidenceRequired &&
        isQuestionAnswered(q.id) &&
        !hasRequiredEvidence(q.id)
    )

    if (firstMissingEvidence !== -1) {
      setCurrentQuestionIndex(firstMissingEvidence)
      setShowEvidence(true) // Open evidence upload UI
    }
  }

  toast({
    title: 'Cannot Submit',
    description: validation.errors.join('. '),
    variant: 'destructive',
  })
  return
}
```

**Behavior:**

1. Inspector tries to submit
2. Validation fails due to missing evidence
3. Page automatically scrolls to first question needing evidence
4. Evidence upload UI opens automatically
5. Error toast displays with details

---

### 4. Visual Warning for Missing Evidence ✅

**File:** `app/inspections/[id]/execute/page.tsx` (Lines 603-618)

Added a prominent warning banner when viewing a question that needs evidence:

```tsx
{
  /* Evidence Required Warning */
}
{
  currentQuestion.evidenceRequired &&
    isQuestionAnswered(currentQuestion.id) &&
    !hasRequiredEvidence(currentQuestion.id) && (
      <div className="rounded-lg border-2 border-purple-500 bg-purple-50 p-4">
        <div className="flex items-start gap-3">
          <Camera className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
          <div>
            <h4 className="font-medium text-purple-900">
              Photo Evidence Required
            </h4>
            <p className="mt-1 text-sm text-purple-700">
              This question requires photo evidence. Please upload at least one
              photo before submitting the inspection.
            </p>
          </div>
        </div>
      </div>
    )
}
```

**When Shown:**

- Question has `evidenceRequired: true`
- Question has been answered
- No evidence uploaded yet

---

### 5. Enhanced Evidence Button ✅

**File:** `app/inspections/[id]/execute/page.tsx` (Lines 620-631)

Updated the evidence upload button to show when evidence is required:

```tsx
<Button
  variant={currentQuestion.evidenceRequired ? 'default' : 'outline'}
  onClick={() => setShowEvidence(!showEvidence)}
  className="w-full"
>
  <Camera className="mr-2 h-4 w-4" />
  {showEvidence ? 'Hide' : 'Add'} Photo Evidence
  {currentQuestion.evidenceRequired && (
    <Badge variant="secondary" className="ml-2">
      Required
    </Badge>
  )}
</Button>
```

**Features:**

- Default (filled) variant when evidence is required
- Outline variant when evidence is optional
- "Required" badge when `evidenceRequired: true`

---

### 6. Auto-Refresh After Evidence Upload ✅

**File:** `app/inspections/[id]/execute/page.tsx` (Lines 633-645)

Added callback to refresh inspection data after evidence upload:

```tsx
<EvidenceUpload
  inspectionId={inspectionId}
  questionId={currentQuestion.id}
  questionText={currentQuestion.question}
  required={currentQuestion.evidenceRequired === true}
  onUploadComplete={() => {
    // Refresh inspection to update evidence list
    fetchInspection()
  }}
/>
```

**Purpose:**

- Reloads inspection with updated evidence list
- Question boxes update colors immediately
- Warning banner disappears after evidence upload
- Progress indicators update

---

## User Flow Examples

### Example 1: Question with Required Evidence

**Step 1:** Inspector answers question

- ✅ Question answered with "Pass"
- 🟣 Question box turns PURPLE (not green)
- ⚠️ Warning banner appears: "Photo Evidence Required"
- 📸 Evidence button shows "Required" badge

**Step 2:** Inspector uploads photo

- 📤 Photo uploads successfully
- 🔄 Inspection data refreshes
- 🟢 Question box turns GREEN
- ✅ Warning banner disappears

### Example 2: Submission with Missing Evidence

**Step 1:** Inspector answers all questions

- Some questions have required evidence but no photos
- These show as 🟣 PURPLE boxes

**Step 2:** Inspector clicks "Submit Inspection"

- ❌ Validation fails
- 📍 Page navigates to first question needing evidence
- 📸 Evidence upload UI opens automatically
- 🔔 Toast shows error message

**Step 3:** Inspector uploads required evidence

- 📤 Uploads photo
- 🟢 Question box turns green
- 🔄 Returns to submit inspection

### Example 3: Optional Evidence

**Step 1:** Inspector answers question (no evidence required)

- ✅ Question answered with "Fail"
- 🟢 Question box turns GREEN immediately
- 📸 Evidence button available but optional (outline variant)
- ✅ No warning banner

**Step 2:** Inspector can still upload evidence (optional)

- Inspector may choose to add evidence even though not required
- Useful for documentation purposes

---

## Visual States Summary

### Question Box States

```
┌─────────────────────────────────────────────────┐
│ State              │ Color    │ Icon │ Meaning   │
├─────────────────────────────────────────────────┤
│ Complete           │ 🟢 Green │  ✓   │ Done      │
│ Needs Evidence     │ 🟣 Purple│  📷  │ Upload    │
│ Unanswered         │ ⚪ White  │      │ Todo      │
│ Required           │ 🟠 Border│  *   │ Must do   │
│ Current            │ 🔵 Ring  │      │ Viewing   │
└─────────────────────────────────────────────────┘
```

### Evidence Button States

```
┌─────────────────────────────────────────────┐
│ Condition          │ Variant  │ Badge       │
├─────────────────────────────────────────────┤
│ Required           │ Default  │ "Required"  │
│ Optional           │ Outline  │ None        │
└─────────────────────────────────────────────┘
```

---

## Technical Details

### Data Flow

```
1. Inspector answers question
   ↓
2. isQuestionAnswered(id) = true
   ↓
3. hasRequiredEvidence(id) checks:
   - If evidenceRequired = false → returns true
   - If evidenceRequired = true → checks evidence array
   ↓
4. isQuestionComplete(id) = answered && hasEvidence
   ↓
5. Question box color updates:
   - complete → GREEN
   - needsEvidence → PURPLE
   - unanswered → WHITE
```

### Evidence Validation

```typescript
// Question Configuration
{
  "id": "q1",
  "question": "Are safety barriers installed?",
  "type": "boolean",
  "required": true,
  "evidenceRequired": true  // ⬅️ Controls evidence requirement
}

// Inspection Evidence
{
  "evidence": [
    {
      "id": "ev1",
      "question_id": "q1",  // ⬅️ Links evidence to question
      "url": "...",
      "filename": "safety-barriers.jpg"
    }
  ]
}

// Validation
hasRequiredEvidence("q1") →
  1. Find question with id "q1"
  2. Check if evidenceRequired = true
  3. If true, search evidence array for question_id = "q1"
  4. Return true if found, false if not
```

---

## Benefits

✅ **Better Visual Feedback** - Purple color clearly indicates evidence needed  
✅ **Prevents Confusion** - Inspectors know exactly which questions need photos  
✅ **Faster Workflow** - Auto-navigation to missing evidence saves time  
✅ **Real-time Updates** - UI refreshes immediately after evidence upload  
✅ **Clear Requirements** - Warning banner and badges show what's needed  
✅ **Consistent UX** - Same pattern for all evidence-required questions

---

## Testing Scenarios

### Test 1: Question with Required Evidence ✅

1. Create inspection with question having `evidenceRequired: true`
2. Answer the question
3. **Expected:** Question box shows PURPLE (not green)
4. **Expected:** Warning banner appears
5. Upload photo
6. **Expected:** Question box turns GREEN
7. **Expected:** Warning banner disappears

### Test 2: Submit Without Evidence ✅

1. Answer all questions
2. Skip evidence upload on required question
3. Click "Submit Inspection"
4. **Expected:** Error toast appears
5. **Expected:** Page navigates to first question needing evidence
6. **Expected:** Evidence upload UI opens automatically

### Test 3: Optional Evidence ✅

1. Answer question without `evidenceRequired`
2. **Expected:** Question box turns GREEN immediately
3. **Expected:** No warning banner
4. **Expected:** Evidence button shows outline variant (optional)

### Test 4: Multiple Questions Needing Evidence ✅

1. Answer 3 questions with `evidenceRequired: true`
2. Upload evidence for 2 out of 3
3. Try to submit
4. **Expected:** Navigates to first question missing evidence
5. Upload evidence
6. Try to submit again
7. **Expected:** Submission succeeds

---

## Compatibility

✅ **Works with N/A option** - Evidence validation works with Pass, Fail, N/A  
✅ **Works with existing inspections** - Backwards compatible  
✅ **Mobile optimized** - Purple boxes and warnings work on mobile  
✅ **Consistent with validation** - UI matches server-side validation logic

---

## Files Modified

1. ✅ `app/inspections/[id]/execute/page.tsx` - All improvements

**No linter errors. All tests passing.**

---

## Related Features

This enhancement works with:

- ✅ Evidence validation fix (only requires evidence when configured)
- ✅ Not Applicable option for boolean questions
- ✅ Evidence upload and linking to questions
- ✅ Inspection state machine validation

