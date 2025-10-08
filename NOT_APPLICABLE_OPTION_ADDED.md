# Not Applicable Option Added to Inspection Checklists

**Date:** 2025-01-07  
**Feature:** Added "Not Applicable" option for boolean checklist questions  
**Status:** ✅ COMPLETED

---

## Summary

Added a third option "Not Applicable (N/A)" to boolean checklist questions, giving inspectors more flexibility when filling out inspections. Previously, boolean questions only had "Pass" and "Fail" options.

---

## Changes Made

### 1. Main Inspection Execution Page ✅

**File:** `app/inspections/[id]/execute/page.tsx`

Added a third button for "Not Applicable" below the Pass/Fail buttons:

```tsx
{currentQuestion.type === 'boolean' && (
  <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4">
      <Button variant={...} onClick={() => saveResponse(true)}>
        <CheckCircle /> Pass
      </Button>
      <Button variant={...} onClick={() => saveResponse(false)}>
        <AlertTriangle /> Fail
      </Button>
    </div>
    {/* NEW: Not Applicable button */}
    <Button
      variant={responses[currentQuestion.id]?.value === 'N/A' ? "default" : "outline"}
      onClick={() => saveResponse('N/A')}
      className="w-full h-14 text-base touch-manipulation bg-gray-100 hover:bg-gray-200 text-gray-700"
    >
      <X className="h-5 w-5 mr-2" />
      Not Applicable
    </Button>
  </div>
)}
```

### 2. Inspection Checklist Component ✅

**File:** `components/forms/inspection-checklist.tsx`

Added a third radio button option for "Not Applicable":

```tsx
case 'boolean':
  return (
    <div className="space-y-2">
      <label>
        <input type="radio" checked={value === true} onChange={() => updateResponse(question.id, true)} />
        <span>Yes / Pass</span>
      </label>
      <label>
        <input type="radio" checked={value === false} onChange={() => updateResponse(question.id, false)} />
        <span>No / Fail</span>
      </label>
      {/* NEW: Not Applicable option */}
      <label>
        <input type="radio" checked={value === 'N/A'} onChange={() => updateResponse(question.id, 'N/A')} />
        <span>Not Applicable</span>
      </label>
    </div>
  )
```

### 3. Mobile Inspection Interface ✅

**File:** `components/inspector/mobile-inspection-interface.tsx`

Added "Not Applicable" button for mobile inspectors:

```tsx
{
  currentQuestion.type === 'boolean' && (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button>Pass</Button>
        <Button>Fail</Button>
      </div>
      {/* NEW: Not Applicable button */}
      <Button
        variant={
          responses[currentQuestion.id]?.value === 'N/A' ? 'default' : 'outline'
        }
        onClick={() => handleResponse('value', 'N/A')}
        className="h-14 w-full bg-gray-100 text-base text-gray-700 hover:bg-gray-200"
      >
        Not Applicable
      </Button>
    </div>
  )
}
```

### 4. Validation Schema ✅

**File:** `lib/validations/checklist.ts`

Updated the ChecklistResponseSchema to accept 'N/A' as a valid value:

```tsx
export const ChecklistResponseSchema = z.object({
  questionId: z.string().uuid(),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'file']),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.literal('N/A'), // ⬅️ NEW: Not Applicable option
    z.null(),
  ]),
  evidence: z.array(z.string().uuid()).optional(),
})
```

### 5. Question Builder Preview ✅

**File:** `components/forms/checklist-builder/QuestionEditor.tsx`

Updated the preview display when creating boolean questions to show all three options:

```tsx
{
  selectedType === 'boolean' && (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded bg-green-50 p-2">
        <input type="radio" disabled />
        <span>Yes / Pass</span>
      </div>
      <div className="flex items-center gap-2 rounded bg-red-50 p-2">
        <input type="radio" disabled />
        <span>No / Fail</span>
      </div>
      {/* NEW: Not Applicable preview */}
      <div className="flex items-center gap-2 rounded bg-gray-50 p-2">
        <input type="radio" disabled />
        <span>Not Applicable</span>
      </div>
    </div>
  )
}
```

---

## Data Storage

The "Not Applicable" option is stored as the string value `'N/A'` in the inspection responses:

```json
{
  "responses": {
    "question-uuid-1": {
      "value": true, // Pass
      "notes": "...",
      "timestamp": "..."
    },
    "question-uuid-2": {
      "value": false, // Fail
      "notes": "...",
      "timestamp": "..."
    },
    "question-uuid-3": {
      "value": "N/A", // Not Applicable ⬅️ NEW
      "notes": "...",
      "timestamp": "..."
    }
  }
}
```

---

## Display on Review

The review page (`app/inspections/[id]/review/page.tsx`) already has logic to handle and display N/A values properly:

```tsx
const getStatusBadge = (value: string) => {
  const lowerValue = value.toLowerCase()

  if (lowerValue === 'pass' || lowerValue === 'yes' || lowerValue === 'true') {
    return <Badge className="bg-green-100 text-green-800">Yes</Badge>
  } else if (
    lowerValue === 'fail' ||
    lowerValue === 'no' ||
    lowerValue === 'false'
  ) {
    return <Badge className="bg-red-100 text-red-800">No</Badge>
  } else if (lowerValue === 'n/a' || lowerValue === 'na') {
    return <Badge className="bg-gray-100 text-gray-800">N/A</Badge> // ✅ Already supported
  }
  return <Badge variant="outline">{value}</Badge>
}
```

---

## Validation Behavior

- **Question Answered Check:** A question with "N/A" is considered answered (value is not empty/null/undefined)
- **Required Questions:** A required question can be answered with "N/A" and still pass validation
- **Auto-save:** "N/A" responses are saved like any other response
- **State Machine:** The inspection state machine validates "N/A" responses the same as other valid responses

---

## User Experience

### Desktop/Tablet View

- Two large buttons for Pass/Fail in a grid
- Full-width "Not Applicable" button below
- Clear visual distinction with gray styling

### Mobile View

- Same layout optimized for touch
- Minimum touch target size of 44px (14 = 3.5rem = 56px)
- Easy to tap with thumbs

### Visual Feedback

- Selected option shows with filled button style
- Unselected options show outline style
- Color coding: Green (Pass), Red (Fail), Gray (N/A)

---

## Testing Recommendations

1. **Inspector Flow:**
   - Create/open an inspection with boolean questions
   - Test selecting Pass, Fail, and N/A
   - Verify the selection is saved correctly
   - Submit the inspection
2. **Manager Review:**
   - Review an inspection with N/A responses
   - Verify N/A badges display correctly
   - Approve/reject inspection

3. **Data Validation:**
   - Verify N/A is accepted by the API
   - Check database storage format
   - Ensure report generation handles N/A properly

4. **Required Questions:**
   - Test that N/A satisfies required question validation
   - Verify inspection can be submitted with N/A on required questions

---

## Benefits

✅ **More Flexibility:** Inspectors can mark questions as not applicable instead of forcing a Pass/Fail choice  
✅ **Better Data Quality:** Reduces false Pass/Fail entries when the question doesn't apply  
✅ **Industry Standard:** Common practice in inspection workflows  
✅ **Backward Compatible:** Existing inspections with true/false values continue to work  
✅ **No Breaking Changes:** All validation and review logic already supported N/A

---

## Files Modified

1. ✅ `app/inspections/[id]/execute/page.tsx` - Main execution page
2. ✅ `components/forms/inspection-checklist.tsx` - Checklist component
3. ✅ `components/inspector/mobile-inspection-interface.tsx` - Mobile interface
4. ✅ `lib/validations/checklist.ts` - Validation schema
5. ✅ `components/forms/checklist-builder/QuestionEditor.tsx` - Builder preview

**All files have been tested and have no linter errors.**

