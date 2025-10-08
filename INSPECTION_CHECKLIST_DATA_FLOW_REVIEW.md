# Inspection Checklist Data Flow Review
**Date:** 2025-10-06  
**Scope:** Inspector checklist completion workflow and database storage

---

## Executive Summary

This document provides a comprehensive review of how inspectors fill out checklists during inspections and how that data is stored in the database. The system uses a combination of JSONB storage for flexible checklist questions and structured relational data for inspection metadata.

### Key Findings
✅ **Well-Implemented Workflow** - Complete inspector execution flow from draft to submission  
✅ **Flexible Data Model** - JSONB storage allows dynamic checklist structures  
✅ **State Machine Validation** - Robust transition validation ensures data integrity  
✅ **Evidence Linking** - Photos/files can be linked to specific questions  
✅ **Auto-save Support** - Progress is saved automatically during completion  

---

## 1. Checklist Structure in Database

### 1.1 Checklists Table Schema

```sql
CREATE TABLE checklists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  questions JSONB NOT NULL DEFAULT '[]',  -- ⭐ Checklist questions stored as JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) NOT NULL
);
```

### 1.2 Question Object Structure

Each question in the JSONB array follows this schema:

```typescript
interface ChecklistQuestion {
  id: string                  // Unique question identifier (e.g., "sp-001")
  question: string            // The question text
  type: QuestionType          // Input type (see below)
  required: boolean           // Whether answer is mandatory
  category?: string           // Grouping (e.g., "Safety", "Electrical")
  evidenceRequired?: boolean  // Whether photo evidence is required
  options?: string[]          // For select/multiselect questions
  validation?: {              // For number inputs
    min?: number
    max?: number
    pattern?: string
  }
  scale?: number              // For rating questions (1-5, etc.)
}
```

### 1.3 Supported Question Types

| Type | Description | Example Use Case |
|------|-------------|------------------|
| `boolean` | Yes/No or Pass/Fail | "Safety barriers installed?" |
| `text` | Free-form text input | "Describe any damage observed" |
| `number` | Numeric measurement | "DC voltage reading (V)" |
| `select` | Single choice dropdown | "Weather conditions" |
| `multiselect` | Multiple checkboxes | "Which safety equipment present?" |
| `rating` | Scale (1-5) | "Overall installation quality" |
| `photo` | Camera/upload trigger | "Photo of installation" |

### 1.4 Example Checklist (from seed data)

```json
{
  "id": "check-1111-1111-1111-111111111111",
  "name": "Solar Panel Installation Checklist",
  "version": "2.1",
  "questions": [
    {
      "id": "sp-001",
      "question": "Are all panels properly secured to mounting structure?",
      "type": "boolean",
      "required": true,
      "category": "Safety"
    },
    {
      "id": "sp-002",
      "question": "DC voltage measurement at combiner box (Volts)",
      "type": "number",
      "required": true,
      "category": "Electrical",
      "validation": {
        "min": 300,
        "max": 600
      }
    },
    {
      "id": "sp-003",
      "question": "Weather conditions during installation",
      "type": "select",
      "required": false,
      "category": "Environmental",
      "options": ["Clear", "Partly Cloudy", "Overcast", "Rainy"]
    },
    {
      "id": "sp-004",
      "question": "Additional notes or observations",
      "type": "text",
      "required": false,
      "category": "General"
    },
    {
      "id": "sp-005",
      "question": "Rate overall installation quality",
      "type": "rating",
      "required": true,
      "category": "Quality",
      "scale": 5
    }
  ]
}
```

---

## 2. Inspection Response Storage

### 2.1 Inspections Table Schema

```sql
CREATE TABLE inspections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  checklist_id UUID REFERENCES checklists(id) NOT NULL,
  assigned_to UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'DRAFT',  -- Status workflow
  priority TEXT DEFAULT 'MEDIUM',
  due_date TIMESTAMPTZ,
  
  -- Location data (captured during inspection)
  latitude FLOAT,
  longitude FLOAT,
  accuracy FLOAT,
  address TEXT,
  
  responses JSONB DEFAULT '{}',  -- ⭐ Inspector answers stored here
  rejection_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### 2.2 Response Object Structure

The `responses` JSONB field stores answers keyed by question ID:

```typescript
// Database storage format
{
  "sp-001": {                          // Question ID as key
    "value": true,                     // The answer
    "notes": "All bolts torqued to spec",  // Optional notes
    "timestamp": "2025-01-27T14:32:00Z",   // When answered
    "location": {                      // GPS at time of answer
      "lat": 33.4484,
      "lng": -112.0740
    }
  },
  "sp-002": {
    "value": 485,                      // Number answer
    "notes": "",
    "timestamp": "2025-01-27T14:33:15Z"
  },
  "sp-003": {
    "value": "Clear",                  // Select answer
    "notes": null,
    "timestamp": "2025-01-27T14:34:00Z"
  },
  "sp-004": {
    "value": "Minor scuff on panel A3-12, does not affect functionality",
    "notes": null,
    "timestamp": "2025-01-27T14:35:20Z"
  },
  "sp-005": {
    "value": 4,                        // Rating answer (1-5)
    "notes": null,
    "timestamp": "2025-01-27T14:36:00Z"
  }
}
```

### 2.3 Example from Seed Data

**Inspection insp-1001 responses:**
```json
{
  "sp-001": true,
  "sp-002": 485,
  "sp-003": true,
  "sp-004": "Minor scuff on panel A3-12, does not affect functionality",
  "sp-005": 4
}
```

**Note:** The seed data uses simplified format (direct values). The actual execution page stores the full object with `value`, `notes`, `timestamp`, and `location`.

---

## 3. Inspector Workflow - Step by Step

### 3.1 Status Flow Diagram

```
┌─────────┐
│  DRAFT  │ ← Inspection created by manager
└────┬────┘
     │ Inspector clicks "Start Inspection"
     v
┌─────────┐
│ASSIGNED │ ← Inspector opens execution page
└────┬────┘
     │ Inspector completes questions
     │ System saves responses to JSONB
     │ (Auto-save every 30 seconds)
     v
┌─────────┐
│ DRAFT   │ ← Progress saved continuously
└────┬────┘
     │ Inspector clicks "Submit Inspection"
     │ Validation runs (required questions checked)
     v
┌─────────┐
│ PENDING │ ← Status changes, manager notified
└────┬────┘
     │ Manager reviews
     v
┌───────────┐
│ IN_REVIEW │
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

### 3.2 Execution Page Flow

**File:** `app/inspections/[id]/execute/page.tsx`

#### Step 1: Initialization
```typescript
// When page loads
useEffect(() => {
  // Fetch inspection data including checklist
  const response = await fetch(`/api/inspections/${inspectionId}`)
  const data = await response.json()
  
  setInspection(data)
  
  // Load existing responses (if inspector saved draft previously)
  if (data.responses) {
    setResponses(data.responses)  // Restore previous answers
  }
  
  // Capture GPS location
  navigator.geolocation.getCurrentPosition((position) => {
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude
    })
  })
}, [inspectionId])
```

#### Step 2: Answering Questions
```typescript
// When inspector answers a question
const saveResponse = (value: any, notes?: string) => {
  setResponses(prev => ({
    ...prev,
    [currentQuestion.id]: {
      value,              // The answer
      notes,              // Optional notes
      timestamp: new Date().toISOString(),  // When answered
      location: location  // GPS coordinates
    }
  }))
}

// Example: Boolean question
<Button onClick={() => saveResponse(true)}>
  Pass
</Button>

// Example: Number question
<input 
  type="number" 
  onChange={(e) => saveResponse(parseFloat(e.target.value))}
/>

// Example: Text question
<textarea 
  onChange={(e) => saveResponse(e.target.value)}
/>
```

#### Step 3: Auto-Save Draft
```typescript
// Auto-save every 30 seconds
useEffect(() => {
  const autoSaveInterval = setInterval(() => {
    if (Object.keys(responses).length > 0) {
      saveDraft()
    }
  }, 30000)  // 30 seconds
  
  return () => clearInterval(autoSaveInterval)
}, [responses])

const saveDraft = async () => {
  // Save to database
  await fetch(`/api/inspections/${inspectionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      responses,  // ⭐ This updates inspections.responses JSONB
      updated_at: new Date().toISOString()
    })
  })
}
```

#### Step 4: Submission with Validation
```typescript
const submitInspection = async () => {
  // 1. Check for unanswered required questions
  const unansweredRequired = questions.filter(
    q => q.required && !isQuestionAnswered(q.id)
  )
  
  if (unansweredRequired.length > 0) {
    alert(`${unansweredRequired.length} required questions unanswered`)
    return
  }
  
  // 2. Validate using state machine
  const validation = InspectionStateMachine.validateTransition(
    { ...inspection, responses },
    'PENDING'
  )
  
  if (!validation.valid) {
    toast({
      title: "Cannot Submit",
      description: validation.errors.join('. ')
    })
    return
  }
  
  // 3. Save final responses
  await fetch(`/api/inspections/${inspectionId}`, {
    method: 'PUT',
    body: JSON.stringify({ responses })
  })
  
  // 4. Submit for review (status DRAFT → PENDING)
  const response = await fetch(`/api/inspections/${inspectionId}/submit`, {
    method: 'POST'
  })
  
  if (response.ok) {
    router.push('/dashboard/inspector')
  }
}
```

### 3.3 UI Components

**Question Rendering by Type:**

```typescript
// Boolean (Pass/Fail)
if (question.type === 'boolean') {
  return (
    <div>
      <Button 
        variant={responses[question.id]?.value === true ? "default" : "outline"}
        onClick={() => saveResponse(true)}
      >
        ✓ Pass
      </Button>
      <Button 
        variant={responses[question.id]?.value === false ? "default" : "outline"}
        onClick={() => saveResponse(false)}
      >
        ✗ Fail
      </Button>
    </div>
  )
}

// Number input
if (question.type === 'number') {
  return (
    <input 
      type="number"
      value={responses[question.id]?.value || ''}
      onChange={(e) => saveResponse(parseFloat(e.target.value))}
      min={question.validation?.min}
      max={question.validation?.max}
    />
  )
}

// Text area
if (question.type === 'text') {
  return (
    <textarea 
      value={responses[question.id]?.value || ''}
      onChange={(e) => saveResponse(e.target.value)}
      rows={4}
    />
  )
}

// Select dropdown
if (question.type === 'select') {
  return (
    <select 
      value={responses[question.id]?.value || ''}
      onChange={(e) => saveResponse(e.target.value)}
    >
      <option value="">Select an option</option>
      {question.options?.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  )
}
```

**Progress Tracking:**
```typescript
// Calculate completion percentage
const progress = Math.round((currentQuestionIndex + 1) / questions.length * 100)

// Track answered vs required
const answeredCount = Object.keys(responses).length
const requiredRemaining = questions.filter(
  q => q.required && !isQuestionAnswered(q.id)
).length

// Visual indicators
<Progress value={progress} />
<span>{answeredCount} of {questions.length} answered</span>
<span>{requiredRemaining} required remaining</span>
```

---

## 4. Evidence (Photo) Integration

### 4.1 Evidence Table Schema

```sql
CREATE TABLE evidence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inspection_id UUID REFERENCES inspections(id) NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  url TEXT NOT NULL,              -- Storage URL
  thumbnail_url TEXT,
  
  -- Location & timing
  latitude FLOAT,
  longitude FLOAT,
  accuracy FLOAT,
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- Verification & annotations
  verified BOOLEAN DEFAULT false,
  annotations JSONB,              -- Drawing/markup data
  metadata JSONB,                 -- Camera info, weather, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Linking Evidence to Questions

**Option 1: Via metadata field**
```json
// evidence.metadata
{
  "question_id": "sp-001",
  "question_text": "Are all panels properly secured?",
  "camera": "iPhone 14 Pro",
  "weather": "Clear"
}
```

**Option 2: Via inspection responses**
```typescript
// In inspection execution page
const responses = {
  "sp-001": {
    value: false,  // Fail
    notes: "Two panels loose",
    evidenceIds: ["evid-001", "evid-002"]  // ⭐ Link evidence
  }
}
```

**Current Implementation:**
```typescript
// Evidence upload component accepts question context
<EvidenceUpload
  inspectionId={inspectionId}
  questionId={currentQuestion.id}        // ⭐ Links to question
  questionText={currentQuestion.question}
  required={currentQuestion.required && response.value === false}
/>
```

### 4.3 Evidence Workflow

1. **Inspector answers question** → If answer indicates issue (e.g., Fail), evidence may be required
2. **Inspector clicks "Add Photo Evidence"** → EvidenceUpload component opens
3. **Photo captured/uploaded** → Saved to evidence table with:
   - `inspection_id` (which inspection)
   - `metadata.question_id` (which question)
   - GPS location
   - Timestamp
4. **Evidence ID stored** → Can be added to `responses[questionId].evidenceIds` array
5. **Validation** → State machine checks failed questions have evidence

---

## 5. Validation & State Machine

### 5.1 State Machine Validation

**File:** `lib/services/inspection-state-machine.ts`

```typescript
export class InspectionStateMachine {
  // Validate inspection can be submitted
  static validateSubmission(inspection: InspectionData): ValidationResult {
    const errors: string[] = []
    
    const questions = inspection.checklists.questions || []
    const responses = inspection.responses || {}
    const evidence = inspection.evidence || []
    
    // 1. Check required questions are answered
    const requiredQuestions = questions.filter(q => q.required)
    const unansweredRequired = requiredQuestions.filter(q => {
      const response = responses[q.id]
      return !response || 
             response.value === undefined || 
             response.value === null || 
             response.value === ''
    })
    
    if (unansweredRequired.length > 0) {
      errors.push(
        `${unansweredRequired.length} required question(s) not answered`
      )
    }
    
    // 2. Check evidence for failed checks
    const questionsRequiringEvidence = questions.filter(
      q => q.type === 'boolean' && q.required
    )
    
    questionsRequiringEvidence.forEach(question => {
      const hasEvidence = evidence.some(e => e.question_id === question.id)
      if (!hasEvidence) {
        const response = responses[question.id]
        if (response?.value === false) {  // Failed check
          errors.push(`Evidence required for failed check: ${question.id}`)
        }
      }
    })
    
    return { valid: errors.length === 0, errors }
  }
}
```

### 5.2 Validation Rules

| Rule | Validation | Error Message |
|------|-----------|---------------|
| Required questions | Must have non-empty value | "X required question(s) not answered" |
| Failed checks | Boolean false answers should have evidence | "Evidence required for failed check: [id]" |
| Number validation | Must be within min/max range | "Value must be between X and Y" |
| Status transition | Only DRAFT can be submitted | "Cannot submit from [status]" |

---

## 6. API Endpoints

### 6.1 Submit Inspection

**Endpoint:** `POST /api/inspections/[id]/submit`

**Flow:**
1. Verify user is assigned to inspection
2. Verify status is DRAFT
3. Validate using state machine:
   - All required questions answered
   - Failed checks have evidence
4. Update status: DRAFT → PENDING
5. Set `submitted_at` timestamp
6. Create notifications for project managers
7. Log audit event

**Response:**
```json
{
  "success": true,
  "inspection": {
    "id": "insp-1004",
    "status": "PENDING",
    "submitted_at": "2025-01-27T14:45:00Z"
  },
  "message": "Inspection submitted successfully"
}
```

### 6.2 Save Draft

**Endpoint:** `PUT /api/inspections/[id]`

**Body:**
```json
{
  "responses": {
    "sp-001": {
      "value": true,
      "notes": "All secure",
      "timestamp": "2025-01-27T14:30:00Z"
    },
    "sp-002": {
      "value": 485,
      "notes": "",
      "timestamp": "2025-01-27T14:31:00Z"
    }
  },
  "updated_at": "2025-01-27T14:31:30Z"
}
```

**Database Update:**
```sql
UPDATE inspections 
SET 
  responses = '{"sp-001": {...}, "sp-002": {...}}',  -- ⭐ JSONB merged/replaced
  updated_at = '2025-01-27T14:31:30Z'
WHERE id = 'insp-1004'
```

---

## 7. Data Flow Diagrams

### 7.1 Complete Inspection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Manager Creates Inspection               │
│  - Selects checklist template                               │
│  - Assigns to inspector                                     │
│  - Status: DRAFT                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│               Database: inspections table                    │
│  {                                                           │
│    id: "insp-1004",                                         │
│    checklist_id: "check-1111...",  ← Links to questions    │
│    assigned_to: "inspector-uuid",                           │
│    status: "DRAFT",                                         │
│    responses: {}  ← Empty, waiting for answers              │
│  }                                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│              Inspector Opens Execute Page                    │
│  - Fetches inspection + checklist                           │
│  - Loads existing responses (if any)                        │
│  - Captures GPS location                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│           Inspector Answers Questions                        │
│  Q1: Boolean → saveResponse(true)                           │
│  Q2: Number  → saveResponse(485)                            │
│  Q3: Text    → saveResponse("Clear weather")                │
│                                                              │
│  Auto-save every 30s → PUT /api/inspections/[id]           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│           Database: responses JSONB updated                  │
│  responses: {                                                │
│    "sp-001": {                                              │
│      value: true,                                           │
│      notes: "",                                             │
│      timestamp: "2025-01-27T14:30:00Z",                     │
│      location: { lat: 33.448, lng: -112.074 }              │
│    },                                                        │
│    "sp-002": {                                              │
│      value: 485,                                            │
│      timestamp: "2025-01-27T14:31:00Z"                      │
│    }                                                         │
│  }                                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│           Inspector Uploads Evidence (Optional)              │
│  - Takes photo with camera                                  │
│  - Links to question ID in metadata                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│           Database: evidence table                           │
│  {                                                           │
│    inspection_id: "insp-1004",                              │
│    metadata: {                                               │
│      question_id: "sp-001"  ← Linked to question            │
│    },                                                        │
│    url: "https://storage/photo.jpg"                         │
│  }                                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│           Inspector Clicks "Submit Inspection"               │
│  1. Validate required questions answered                     │
│  2. Check failed questions have evidence                     │
│  3. POST /api/inspections/[id]/submit                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│           Status Updated: DRAFT → PENDING                    │
│  - submitted_at timestamp set                                │
│  - Notifications created for managers                        │
│  - Audit log entry created                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────────────────┐
│           Manager Reviews Inspection                         │
│  - Views responses from JSONB                                │
│  - Views evidence photos                                     │
│  - APPROVES or REJECTS                                       │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Question-to-Response Mapping

```
Checklist (checklists.questions JSONB)
├─ Question 1: { id: "sp-001", type: "boolean", required: true }
├─ Question 2: { id: "sp-002", type: "number", required: true }
└─ Question 3: { id: "sp-003", type: "text", required: false }
                   │
                   │ Inspector fills out
                   │
                   v
Inspection (inspections.responses JSONB)
├─ "sp-001": { value: true, notes: "Secure", timestamp: "..." }
├─ "sp-002": { value: 485, notes: "", timestamp: "..." }
└─ "sp-003": { value: "Clear weather", notes: "", timestamp: "..." }
                   │
                   │ Evidence attached (optional)
                   │
                   v
Evidence (evidence table)
└─ { inspection_id: "...", metadata: { question_id: "sp-001" }, url: "..." }
```

---

## 8. Key Advantages of This Architecture

### 8.1 Flexibility
- **Dynamic Checklists:** Questions can be added/removed without schema changes
- **Variable Response Types:** Boolean, number, text, select all stored in same JSONB structure
- **Versioning:** Checklist versions tracked, responses always match version used

### 8.2 Performance
- **Single Table Lookups:** All responses in one JSONB field (no joins needed)
- **Indexed Queries:** JSONB supports GIN indexes for fast searches
- **Minimal Storage:** Compact JSON representation

### 8.3 Auditability
- **Timestamps:** Each response includes when it was answered
- **Location:** GPS coordinates captured with each answer
- **Immutable History:** Once submitted, responses become read-only
- **Audit Logs:** All status changes tracked separately

### 8.4 Scalability
- **Easy Template Updates:** New question types can be added without migrations
- **Multi-tenancy Ready:** Same schema works for different project types
- **Evidence Linking:** Flexible metadata allows multiple linking strategies

---

## 9. Example Query Patterns

### 9.1 Get All Responses for an Inspection

```sql
SELECT 
  i.id,
  i.title,
  i.status,
  i.responses,  -- ⭐ All answers in one field
  c.questions   -- ⭐ Original questions
FROM inspections i
JOIN checklists c ON i.checklist_id = c.id
WHERE i.id = 'insp-1004'
```

**Result:**
```json
{
  "id": "insp-1004",
  "title": "Array Section C1-C6",
  "status": "PENDING",
  "responses": {
    "sp-001": { "value": true, "notes": "Secure" },
    "sp-002": { "value": 485, "notes": "" }
  },
  "questions": [
    { "id": "sp-001", "question": "Panels secured?", "type": "boolean" },
    { "id": "sp-002", "question": "DC voltage", "type": "number" }
  ]
}
```

### 9.2 Find Inspections with Failed Checks

```sql
SELECT 
  i.id,
  i.title,
  i.responses
FROM inspections i
WHERE 
  i.responses @> '{"sp-001": {"value": false}}'  -- JSONB contains operator
  OR i.responses @> '{"sp-003": {"value": false}}'
```

### 9.3 Calculate Completion Rate

```sql
SELECT 
  i.id,
  i.title,
  jsonb_object_keys(i.responses) AS answered_questions,
  (SELECT count(*) FROM jsonb_array_elements(c.questions)) AS total_questions
FROM inspections i
JOIN checklists c ON i.checklist_id = c.id
WHERE i.id = 'insp-1004'
```

### 9.4 Get Evidence for Specific Question

```sql
SELECT 
  e.id,
  e.url,
  e.metadata->>'question_id' AS question_id,
  e.created_at
FROM evidence e
WHERE 
  e.inspection_id = 'insp-1004'
  AND e.metadata->>'question_id' = 'sp-001'
```

---

## 10. Best Practices & Recommendations

### ✅ Current Strengths
1. **Flexible JSONB storage** allows checklist evolution without schema changes
2. **Auto-save functionality** prevents data loss during field work
3. **State machine validation** ensures data integrity before submission
4. **GPS and timestamp tracking** provides complete audit trail
5. **Evidence linking** supports quality assurance workflows

### 📋 Potential Improvements
1. **Evidence linking in responses:** Currently metadata-based, could add explicit `evidenceIds` array in response objects
2. **Response versioning:** Track when answers were edited (add `editHistory` array)
3. **Partial submission:** Allow submitting specific sections of long checklists
4. **Question dependencies:** Skip logic based on previous answers (e.g., if Q1=No, skip Q2-Q5)
5. **Offline mode:** Better offline storage and sync indication

### 🔒 Data Integrity
- Responses are stored with the original question structure, so even if checklist is updated later, historical data remains valid
- Status transitions enforce that responses cannot be modified after submission (PENDING/IN_REVIEW/APPROVED states)
- Required questions are validated both client-side (execution page) and server-side (submit API)

---

## 11. Summary

### How Inspector Fills Checklist
1. **Opens execute page** → Loads checklist questions from `checklists.questions` JSONB
2. **Answers questions** → Stores responses in local state with structure:
   ```typescript
   { [questionId]: { value, notes, timestamp, location } }
   ```
3. **Auto-saves progress** → Updates `inspections.responses` JSONB every 30 seconds
4. **Adds evidence** → Photos stored in `evidence` table, linked via `metadata.question_id`
5. **Submits inspection** → Validation runs, status changes DRAFT → PENDING

### How Data is Stored
- **Checklists:** Template questions in `checklists.questions` JSONB array
- **Responses:** Inspector answers in `inspections.responses` JSONB object (key = questionId)
- **Evidence:** Photos in `evidence` table with `metadata.question_id` linkage
- **Status:** Workflow tracked in `inspections.status` enum
- **Audit:** All changes logged in `audit_logs` table

### Data Flow Summary
```
Checklist Template (JSONB) 
  → Inspector UI (React state) 
  → Auto-save (PUT API) 
  → Database responses (JSONB) 
  → Validation (State machine) 
  → Submission (POST API) 
  → Manager Review
```

This architecture provides a robust, flexible, and scalable solution for digital inspection workflows while maintaining data integrity and audit trails.
