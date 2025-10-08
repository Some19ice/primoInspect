# Project Stats Fix - Manager Dashboard

## Issue
The "My Projects" section on the manager dashboard was showing `0 members` and `0 inspections` for all project cards, even when projects had members and inspections.

## Root Cause

The `ProjectList` component expects projects to have:
- `project.members` array
- `project.inspections` array

However, the projects data from `useRealtimeProjects` only included `project_members` relation but not the inspections data.

## Solution

Added a computed property that enriches the projects with inspection counts and properly formatted member data before passing them to the `ProjectList` component.

### Changes Made

#### File: `app/dashboard/manager/page.tsx`

**Added enrichment logic** (after line 197):

```typescript
// Enrich projects with inspection counts and member data
const enrichedProjects = useMemo(() => {
  return projects.map(project => {
    // Count inspections for this project
    const projectInspections = inspections.filter(i => i.project_id === project.id)
    
    // Get members from project_members relation
    const members = (project as any).project_members || []
    
    return {
      ...project,
      inspections: projectInspections,
      members: members,
    }
  })
}, [projects, inspections])
```

**Updated ProjectList component call** (line 353):

```typescript
// Before
<ProjectList 
  projects={projects}
  ...
/>

// After
<ProjectList 
  projects={enrichedProjects}
  ...
/>
```

## How It Works

1. **Projects Data**: Fetched via `useRealtimeProjects` with `includeMembers: true`
   - Includes `project_members` relation with profile data

2. **Inspections Data**: Fetched via `useRealtimeInspections`
   - All inspections for the manager's projects

3. **Enrichment**: The `useMemo` hook:
   - Filters inspections by `project_id` to get each project's inspections
   - Extracts members from `project_members` relation
   - Creates new project objects with `inspections` and `members` arrays

4. **Display**: `ProjectList` component now shows:
   - ✅ **Real member count**: e.g., "3 members"
   - ✅ **Real inspection count**: e.g., "12 inspections"

## Benefits

- **Real-time updates**: Uses existing real-time data hooks
- **No extra API calls**: Leverages already-fetched data
- **Efficient**: Uses `useMemo` to only recompute when projects or inspections change
- **Accurate**: Shows actual counts from the database

## Example Output

Before fix:
```
Project Alpha
0 members • 0 inspections
```

After fix:
```
Project Alpha
5 members • 8 inspections
```

## Related Components

- `app/dashboard/manager/page.tsx` - Main dashboard (FIXED)
- `components/projects/project-list.tsx` - Project card display
- `lib/hooks/use-realtime-projects.ts` - Projects data hook
- `lib/hooks/use-realtime-inspections.ts` - Inspections data hook
