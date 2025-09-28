# PrimoInspect Development Guidelines

Auto-generated from implementation plan. Last updated: 2025-01-27
**Enhanced**: Session 2025-01-27 clarifications for operational workflows and conflict resolution

## Active Technologies

**Framework**: Next.js 14 (App Router) + React 18 + TypeScript
**Backend**: **Supabase Backend-as-a-Service** (migrated from Prisma + PostgreSQL)  
**Database**: **Supabase PostgreSQL** with Row Level Security (RLS) policies
**Authentication**: **Supabase Auth** with JWT tokens (replaced NextAuth)
**Storage**: **Supabase Storage** for evidence files with CDN delivery
**Real-time**: **Supabase real-time subscriptions** for **instant live updates** and conflict detection
**UI Components**: Tailwind CSS + shadcn/ui + Headless UI + Radix Primitives  
**Data Management**: TanStack React Query v5 + Zod validation schemas
**Forms**: React Hook Form + Zod Resolver for mobile-optimized forms
**Visualization**: Recharts for dashboard charts and KPI displays
**Mapping**: MapLibre GL JS for evidence location verification
**Analytics**: Vercel Analytics + Core Web Vitals tracking
**Error Handling**: React Error Boundaries + structured logging

## Project Structure

```
app/
├── (dashboard)/         # Role-based dashboard layouts with real-time updates
│   ├── executive/       # Executive visibility dashboards
│   ├── manager/         # Project manager orchestration
│   └── inspector/       # Inspector submission follow-up
├── api/                 # Next.js API routes (reduced with Supabase auto-generated APIs)
│   ├── inspections/     # Inspection CRUD with real-time notifications
│   ├── evidence/        # File upload with Supabase Storage integration
│   ├── projects/        # Project management with live collaboration
│   └── reports/         # Report generation with real-time data
├── auth/                # Supabase Auth integration (replacing NextAuth)
├── globals.css          # Tailwind CSS styles
└── layout.tsx           # Root layout with role-aware navigation

components/
├── ui/                  # shadcn/ui component library
├── forms/               # React Hook Form + Zod validation with real-time sync
├── charts/              # Recharts dashboard components with live data
├── maps/                # MapLibre GL evidence location
├── evidence/            # Media upload with Supabase Storage and real-time progress
└── realtime/            # Real-time subscription components

lib/
├── supabase/            # Supabase integration (NEW)
│   ├── client.ts        # Supabase client configuration
│   ├── auth.ts          # Supabase Auth helpers
│   ├── storage.ts       # Supabase Storage service
│   ├── realtime.ts      # Real-time subscription service
│   └── types.ts         # Generated TypeScript types from Supabase
├── hooks/               # React hooks for real-time subscriptions
├── validations/         # Zod schemas for type safety
└── utils.ts             # Utility functions

supabase/                # Supabase project configuration (NEW)
├── migrations/          # Database schema migrations
├── functions/           # Edge functions for complex operations
└── config.toml          # Supabase project configuration
```

## Commands

### Development

```bash
npm run dev              # Start development server with mobile debugging
npm run build            # Production build with mobile optimizations
npm run start            # Production server
npm run lint             # ESLint with mobile-first rules
npm run type-check       # TypeScript validation
```

### Supabase (NEW)

```bash
npx supabase start       # Start local Supabase development
npx supabase db reset    # Reset local database
npx supabase gen types typescript --local > lib/supabase/types.ts  # Generate types
npx supabase db push     # Push schema changes
npx supabase functions deploy  # Deploy edge functions
```

### Database (Legacy - being phased out)

```bash
npm run db:generate      # Generate Prisma client (DEPRECATED)
npm run db:push          # Push schema changes (DEPRECATED)
npm run db:seed          # Seed test data (DEPRECATED)
npm run db:migrate       # Apply migrations (DEPRECATED)
```

## Code Style

### TypeScript

- Strict mode enabled with mobile performance considerations
- Zod schemas for all API inputs/outputs and form validation
- React Server Components where possible for mobile performance
- Client components only when interactivity required
- **NEW**: Supabase TypeScript types generated from database schema

### Supabase Integration Patterns (NEW)

```typescript
// Supabase client setup
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Authentication with Supabase Auth
const { data: { session } } = await supabase.auth.getSession()

// Database operations with RLS
const { data: inspections } = await supabase
  .from('inspections')
  .select('*, evidence(*)')
  .eq('project_id', projectId)

// Real-time subscriptions
supabase
  .channel(`inspections:${projectId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'inspections',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe()

// File upload with Supabase Storage
const { data, error } = await supabase.storage
  .from('evidence-files')
  .upload(`${inspectionId}/${file.name}`, file)
```

### React Patterns

```typescript
// Mobile-optimized component with real-time updates
import { Button } from "@/components/ui/button"
import { useRealtimeInspections } from "@/lib/hooks/use-realtime-inspections"

export function InspectionCard({ inspectionId }: { inspectionId: string }) {
  const { inspection, isLoading } = useRealtimeInspections(inspectionId)

  return (
    <Card className="min-h-[44px] touch-manipulation">
      <Button size="lg" className="w-full">
        {inspection?.title}
      </Button>
    </Card>
  )
}
```

### Mobile-First CSS

```css
/* Tailwind mobile-first responsive design with real-time indicators */
.inspection-grid {
  @apply grid grid-cols-1 gap-4 p-4;
  @apply md:grid-cols-2 lg:grid-cols-3; /* Progressive enhancement */
  @apply touch-manipulation; /* Optimize for touch */
}

/* Real-time status indicators */
.status-live {
  @apply animate-pulse bg-green-100 border-green-300;
}

/* Touch-friendly minimum sizes */
.touch-target {
  @apply min-h-[44px] min-w-[44px]; /* iOS HIG recommendation */
}
```

### Real-time Hooks Pattern (NEW)

```typescript
// Custom hook for real-time data with offline support
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useRealtimeInspections(projectId: string) {
  const [inspections, setInspections] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    const fetchInspections = async () => {
      const { data } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
      
      setInspections(data || [])
      setIsLoading(false)
    }

    // Real-time subscription
    const channel = supabase
      .channel(`inspections:${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inspections',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        // Update local state with real-time changes
        if (payload.eventType === 'INSERT') {
          setInspections(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setInspections(prev => 
            prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            )
          )
        } else if (payload.eventType === 'DELETE') {
          setInspections(prev => 
            prev.filter(item => item.id !== payload.old.id)
          )
        }
      })
      .subscribe()

    fetchInspections()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return { inspections, isLoading }
}
```

## Constitutional Principles

### I. Mobile-First Experience

- All components designed for mobile interaction first
- Touch-friendly controls (min 44px touch targets)
- Responsive layouts with mobile-first CSS
- Performance optimized for mobile networks
- **NEW**: Real-time updates enhance mobile field work coordination

### II. Clarity Over Completeness

- Essential inspection workflows prioritized
- Default values pre-selected in forms
- Progressive disclosure for complex features
- Simplified navigation patterns
- **NEW**: Supabase simplifies infrastructure complexity

### III. Role-Oriented UX

- Route-based role separation in app directory
- Conditional rendering based on user permissions
- Role-specific dashboard components
- Clear visual distinction between role interfaces
- **NEW**: Supabase RLS enforces role-based data access at database level

### IV. Evidence-Driven Decisions

- All approval workflows require evidence verification
- Location and timestamp validation enforced
- Evidence gallery with annotation support
- Audit trails for all decisions
- **NEW**: Supabase Storage provides secure, compliant evidence management

### V. Simplicity and Speed

- <1 second response time requirements
- TanStack React Query for optimistic updates
- Image optimization for mobile performance
- Minimal JavaScript bundles with code splitting
- **NEW**: Real-time updates provide immediate feedback without page refresh

## Supabase Migration Strategy (NEW)

### Phase-by-Phase Approach

1. **Setup**: Initialize Supabase project and schema
2. **Auth Migration**: NextAuth → Supabase Auth with JWT tokens
3. **Database Migration**: Prisma → Supabase client with RLS policies
4. **Real-time**: Add live subscriptions for inspections and notifications
5. **Storage**: Migrate file uploads to Supabase Storage with CDN
6. **API Integration**: Update routes to use Supabase client
7. **UI Enhancement**: Add real-time features to components
8. **Data Migration**: Move existing data to Supabase
9. **Cleanup**: Remove Prisma dependencies

### Benefits

- **Real-time Collaboration**: Live updates for inspection status, evidence uploads
- **Managed Infrastructure**: No database maintenance, automatic scaling
- **Integrated Authentication**: JWT tokens, social logins, user management
- **Secure File Storage**: CDN delivery, signed URLs, access policies
- **Row Level Security**: Database-level multi-tenant security
- **Mobile Optimization**: Offline-first with automatic sync

## Recent Changes

1. **2025-01-27**: Enhanced Operational Workflows (Session 2025-01-27)

   - **Manager-Mediated Conflict Resolution**: Side-by-side evidence comparison interface
   - **Delayed-Approval Queue**: Time-sensitive escalation with urgent notifications  
   - **Project-Completion Boundary Role Changes**: Workflow stability with gradual transitions
   - **Status-First Offline Sync**: Critical updates prioritized over evidence files
   - **Instant Real-time Broadcasting**: Every change immediately broadcast to all users
   - Added new entities: ConflictResolution, EscalationQueue, RoleTransition
   - Enhanced real-time channels for conflicts, escalations, and sync status

2. **2025-01-27**: API Route Implementation (T034-T043)

   - Migrated all 10 API routes from stubs to full Supabase integration
   - Implemented comprehensive RBAC with role-based access control
   - Added automatic audit logging for all operations
   - Enhanced database service with conflict detection and escalation logic
   - Real-time notification creation for assignments and status changes

3. **2025-09-26**: Supabase Migration Planning

   - Designed 7-phase migration strategy from Prisma to Supabase
   - Added real-time capabilities for live inspection updates
   - Integrated Supabase Auth, Storage, and RLS policies
   - Updated all specifications to reflect new architecture

4. **2025-09-26**: Phase 3.5-3.6 UI Implementation

   - Implemented role-based dashboard layouts for all three roles
   - Created mobile-first forms with touch optimization
   - Added evidence upload with 50MB file support
   - Built approval workflow with escalation warnings

5. **2025-09-26**: Initial Project Setup

   - Configured mobile-first responsive design system
   - Implemented role-based routing structure
   - Set up evidence upload with file limits
   - Created comprehensive data model and API contracts

## Enhanced Operational Patterns (Session 2025-01-27)

### Conflict Resolution Implementation

```typescript
// Manager-mediated conflict detection and resolution
const handleEvidenceConflict = {
  detection: 'Automatic flagging of simultaneous submissions',
  notification: 'Real-time alert to project manager',
  interface: 'Side-by-side comparison with approval controls',
  resolution: 'Manager decision with audit trail'
}

// Real-time conflict notification
await supabase.from('conflict_resolutions').insert({
  inspection_id: inspectionId,
  conflict_type: 'EVIDENCE_DISPUTE',
  assigned_manager_id: projectManagerId
})
```

### Escalation Queue Management

```typescript
// Delayed-approval queue for unavailable managers
const escalationLogic = {
  threshold: '4 hours offline',
  priority: 'Status-first urgent notifications',
  queue: 'Pending approvals with manager return',
  resolution: 'Hierarchy integrity maintained'
}
```

### Status-First Sync Priority

```typescript
// Offline synchronization priority queue
const syncPriority = {
  immediate: ['status_changes', 'approval_decisions', 'escalation_flags'],
  high: ['inspection_metadata', 'location_data', 'timestamps'],
  background: ['evidence_files', 'thumbnails', 'media']
}
```

### Instant Real-time Broadcasting

```typescript
// Every change broadcasts immediately
const realtimeStrategy = {
  frequency: 'Instant (no throttling)',
  scope: 'All connected users with permissions',
  channels: 'Project, inspection, user subscriptions',
  performance: 'Optimized for mobile field work'
}
```

<!-- MANUAL ADDITIONS START -->
<!-- Add any custom development guidelines, team conventions, or project-specific patterns here -->
<!-- MANUAL ADDITIONS END -->
