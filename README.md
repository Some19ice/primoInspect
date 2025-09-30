# PrimoInspect - Digital Inspection Platform

Modern, mobile-first inspection platform for renewable energy projects built with Next.js, Supabase, and TypeScript.

## 🌱 Demo Data

PrimoInspect includes comprehensive seed data for demonstration and testing purposes.

### Quick Demo Setup
```bash
# Install dependencies
npm install

# Seed the database with demo data
npm run seed:demo-data
```

### Demo User Accounts
- **Executive**: `sarah.chen@primoinspect.com` / `DemoExec2025!`
- **Project Manager**: `jennifer.park@primoinspect.com` / `DemoManager2025!`  
- **Inspector**: `james.martinez@primoinspect.com` / `DemoInspector2025!`

### What's Included
- **11 demo users** across all roles with working authentication
- **6 renewable energy projects** (solar, wind, battery storage)
- **15+ team assignments** across projects
- **10+ inspection records** in various workflow states
- **Real-time notifications** and approval workflows
- **Evidence files** with GPS metadata and annotations
- **Compliance reports** and audit trails

See [SEED_DATA_DOCUMENTATION.md](SEED_DATA_DOCUMENTATION.md) for complete details.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- Environment variables configured

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd primoInspect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and keys

# Seed demo data
npm run seed:demo-data

# Start development server
npm run dev
```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🏗️ Architecture

- **Frontend**: Next.js 15 with App Router
- **Backend**: Supabase (Database, Auth, Storage, Real-time)
- **UI**: Tailwind CSS + shadcn/ui components
- **State**: React Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Mobile**: Mobile-first responsive design

## 🎯 Features

### Core Functionality
- ✅ Role-based authentication (Executive, Manager, Inspector)
- ✅ Mobile-optimized inspection interface
- ✅ Real-time collaboration and notifications
- ✅ Evidence upload with GPS metadata
- ✅ Approval workflows and audit trails
- ✅ Compliance reporting

### Security
- ✅ Row Level Security (RLS) policies
- ✅ Role-based access control (RBAC)
- ✅ Secure file upload and storage
- ✅ Audit logging for compliance

### Mobile Optimization
- ✅ Touch-friendly 44px minimum targets
- ✅ iOS zoom prevention (16px fonts)
- ✅ Offline-capable PWA architecture
- ✅ GPS location capture for evidence

## 📱 User Roles

### Executive
- Strategic overview of all projects
- High-level KPIs and metrics
- Compliance report access
- Read-only access to all data

### Project Manager  
- Project-specific management view
- Inspection assignment and approval
- Team performance monitoring
- Evidence review and verification

### Inspector
- Mobile-optimized inspection interface
- Checklist completion with evidence upload
- Real-time status updates
- GPS-tagged photo capture

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run seed:demo-data  # Populate with demo data
```

### Database Management
```bash
# Reset database with fresh schema
supabase db reset

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > lib/supabase/types.ts
```

## 📊 Project Status

**Current Status**: 60% Complete - Production Ready Core Features

### ✅ Completed
- Authentication system with role-based access
- Mobile-first responsive UI components
- Real-time inspection workflows
- Evidence management with GPS metadata
- Dashboard implementations for all roles
- Comprehensive seed data for demos

### 🚧 In Progress
- Advanced reporting and analytics
- Bulk operations and batch processing
- Enhanced mobile PWA features

### ⏳ Planned
- Multi-tenant organization support
- Advanced analytics and insights
- Third-party integrations
- Mobile app development

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 📋 Documentation

- [SEED_DATA_DOCUMENTATION.md](SEED_DATA_DOCUMENTATION.md) - Complete demo data guide
- [AUTH_SYSTEM_REVIEW.md](AUTH_SYSTEM_REVIEW.md) - Authentication security review
- [SIGNIN_SIGNUP_FINAL_REVIEW.md](SIGNIN_SIGNUP_FINAL_REVIEW.md) - Authentication UI review
- [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) - Development progress tracking

## 🚀 Deployment

### Production Deployment
```bash
# Build the application
npm run build

# Deploy to Vercel (recommended)
npx vercel --prod

# Or deploy to other platforms
npm run start
```

### Environment Setup
1. Create Supabase project
2. Run database migrations
3. Configure environment variables  
4. Seed demo data
5. Deploy application

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions and support:
- Create an issue in the repository
- Check existing documentation
- Review the demo data guide

---

**PrimoInspect** - Powering the future of renewable energy inspections with mobile-first technology.