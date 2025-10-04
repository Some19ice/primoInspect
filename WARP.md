# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PrimoInspect is a modern digital inspection platform for renewable energy projects built with Next.js 15, Supabase, and TypeScript. The platform supports mobile-first workflows for field inspectors with real-time collaboration features.

**Key Capabilities:**
- Role-based authentication (Executive, Project Manager, Inspector)
- Mobile-optimized inspection interfaces with offline capabilities
- Real-time status updates and notifications
- Evidence management with GPS metadata
- Approval workflows with escalation support

## Development Commands

### Primary Development
```bash
# Start development server (Next.js + Supabase local)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Lint code
npm run lint
```

### Database & Supabase Operations
```bash
# Start local Supabase (includes DB, Auth, Storage, Real-time)
npx supabase start

# Reset local database and apply migrations
npx supabase db reset

# Generate TypeScript types from database schema
npx supabase gen types typescript --local > lib/supabase/types.ts

# Push schema changes to remote
npx supabase db push

# Deploy edge functions
npx supabase functions deploy
```

### Demo Data Management
```bash
# Seed database with comprehensive demo data (11 users, 6 projects)
npm run seed:demo-data

# Clean up duplicate user profiles
npm run clean:profiles

# Test authentication flows
npm run test:auth

# Fix common authentication issues
npm run fix:auth
```

### Testing & Validation
```bash
# Test dashboard authentication flow
npm run test:dashboard

# Validate API endpoints (planned)
npm run validate:api

# Validate database integrity (planned)
npm run validate:db

# Mobile performance validation (planned)
npm run validate:mobile-performance
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **Backend**: Supabase (Database, Auth, Storage, Real-time)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **UI**: Tailwind CSS + shadcn/ui + Radix primitives
- **State Management**: TanStack React Query v5
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Supabase real-time subscriptions
- **File Storage**: Supabase Storage with 50MB limits
- **Charts**: Recharts for dashboard visualization
- **Maps**: MapLibre GL JS for location verification

### Project Structure

```
app/                          # Next.js App Router
├── (dashboard)/             # Role-based dashboard layouts
│   ├── executive/           # Strategic overview dashboards
│   ├── manager/             # Project management interfaces
│   └── inspector/           # Mobile inspection workflows
├── api/                     # API routes (reduced, mostly Supabase auto-generated)
├── auth/                    # Authentication pages
└── globals.css              # Global styles

components/                   # Reusable UI components
├── ui/                      # shadcn/ui component library
├── forms/                   # Form components with validation
├── evidence/                # File upload and evidence management
└── charts/                  # Dashboard visualization components

lib/                         # Core application logic
├── supabase/               # Supabase integration layer
│   ├── client.ts           # Supabase client configuration
│   ├── auth.ts             # Authentication helpers
│   ├── database.ts         # Database abstraction layer
│   ├── storage.ts          # File storage operations
│   ├── realtime.ts         # Real-time subscription management
│   └── types.ts            # Generated TypeScript types
├── hooks/                  # Custom React hooks
├── validations/            # Zod validation schemas
└── utils.ts                # Utility functions

supabase/                    # Supabase project configuration
├── migrations/             # Database schema migrations
├── functions/              # Edge functions
├── config.toml            # Local development configuration
└── seed.sql               # Demo data seed file
```

### Data Model

**Core Entities:**
- **profiles**: User accounts with role-based permissions (EXECUTIVE, PROJECT_MANAGER, INSPECTOR)
- **projects**: Renewable energy projects with location data and team assignments
- **project_members**: Team assignments with role-specific access
- **checklists**: Inspection templates with versioned questions
- **inspections**: Individual inspection instances with status tracking
- **evidence**: File attachments with GPS metadata and verification status
- **approvals**: Approval workflow with manager decisions and audit trails
- **notifications**: Real-time notifications for assignments and status changes

**Enhanced Entities (Phase 2):**
- **conflict_resolutions**: Manager-mediated dispute resolution
- **escalation_queue**: Delayed approval management with priority handling
- **role_transitions**: Project completion boundary management
- **audit_logs**: Comprehensive activity tracking

### Real-time Features

The application uses Supabase real-time subscriptions for:
- **Instant inspection status updates** across all connected users
- **Live evidence upload notifications** with progress tracking
- **Real-time approval workflow updates** with escalation alerts
- **Conflict resolution notifications** for simultaneous submissions
- **Status-first offline sync** prioritizing critical updates over media files

### Mobile-First Design Principles

1. **Touch-Friendly Controls**: Minimum 44px touch targets (iOS HIG standard)
2. **Progressive Enhancement**: Mobile-first responsive design with desktop enhancements
3. **Performance Optimization**: <1 second operation targets, <3 second report generation
4. **Offline Capabilities**: Background sync with priority queuing for status updates
5. **Evidence Management**: GPS-tagged photo capture with 50MB file support

## Development Patterns

### Authentication Flow
```typescript
// Using Supabase Auth with role-based access
const { data: { session }, error } = await supabase.auth.getSession()

// Profile creation is automatic via database trigger
// RLS policies enforce role-based data access at database level
```

### Database Queries with RLS
```typescript
// Queries automatically respect Row Level Security policies
const { data: projects } = await supabase
  .from('projects')
  .select('*, project_members(*)')
  .eq('project_members.user_id', userId)
```

### Real-time Subscriptions
```typescript
// Real-time updates for inspection changes
const channel = supabase
  .channel(`inspections:${projectId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'inspections',
    filter: `project_id=eq.${projectId}`
  }, handleRealtimeUpdate)
  .subscribe()
```

### File Upload with Progress
```typescript
// Evidence upload with Supabase Storage
const { data, error } = await supabase.storage
  .from('evidence-files')
  .upload(`${inspectionId}/${file.name}`, file, {
    cacheControl: '3600',
    upsert: false
  })
```

## Demo Data

The project includes comprehensive seed data accessible via demo user accounts:

**Executive Access:**
- Email: `sarah.chen@primoinspect.com` | Password: `DemoExec2025!`
- Strategic overview of all 6 renewable energy projects
- High-level KPIs and compliance reporting

**Project Manager Access:**
- Email: `jennifer.park@primoinspect.com` | Password: `DemoManager2025!`
- Project-specific management interfaces
- Inspection assignment and approval workflows

**Inspector Access:**
- Email: `james.martinez@primoinspect.com` | Password: `DemoInspector2025!`
- Mobile-optimized inspection interface
- Evidence upload with GPS tagging

The demo includes 11 users across all roles, 6 renewable energy projects (solar, wind, battery storage), and 15+ inspection records in various workflow states.

## Migration Status & Current State

**✅ Completed (45% overall):**
- Supabase foundation with RLS policies
- Authentication system migration (NextAuth → Supabase Auth)
- Real-time subscription infrastructure
- Database abstraction layer
- Core API route migrations

**🚧 In Progress:**
- UI component integration (shadcn/ui setup)
- Evidence upload system completion
- Manager conflict resolution interfaces
- Mobile PWA optimization

**❌ Pending:**
- Comprehensive testing suite
- Performance validation (<1s targets)
- Advanced analytics and reporting
- Multi-tenant organization support

## Common Development Tasks

### Adding New Inspection Types
1. Create checklist template in `supabase/seed.sql`
2. Add validation schema in `lib/validations/`
3. Update inspection forms in `components/forms/`
4. Test real-time updates across user roles

### Implementing New Real-time Features
1. Define database trigger in `supabase/migrations/`
2. Create React hook in `lib/hooks/use-realtime-*.ts`
3. Integrate with UI components for instant updates
4. Test cross-browser real-time synchronization

### Role-Based Feature Development
1. Update RLS policies in `supabase/migrations/`
2. Modify database service queries in `lib/supabase/database.ts`
3. Add role-specific UI components in `app/(dashboard)/`
4. Validate permissions across all access levels

## Performance Targets

- **Operation Response Time**: <1 second for CRUD operations
- **Report Generation**: <3 seconds for dashboard reports
- **File Upload**: Progress tracking for 50MB evidence files
- **Real-time Updates**: <500ms latency for status changes
- **Mobile Performance**: Lighthouse score >90

## Constitutional Principles

**Mobile-First Experience**: All interfaces designed for touch interaction with 44px minimum targets
**Role-Oriented UX**: Database-level RLS policies enforce role-based access
**Evidence-Driven Decisions**: GPS-tagged evidence required for all approval workflows
**Real-time Collaboration**: Instant updates enhance field work coordination
**Simplicity and Speed**: <1 second operations with optimistic UI updates

## Environment Setup

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

For new development setups:
1. Clone repository and install dependencies (`npm install`)
2. Initialize Supabase project (`npx supabase init`)
3. Configure environment variables
4. Seed demo data (`npm run seed:demo-data`)
5. Start development server (`npm run dev`)