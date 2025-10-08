# Approval Authorization Fix

## Issue
Managers were getting "Not authorized to approve inspections" error when trying to approve inspections, even though they had the correct PROJECT_MANAGER or EXECUTIVE role.

## Root Cause

The approval API route (`app/api/inspections/[id]/approve/route.ts`) was checking the wrong field for the user's role.

### Incorrect Code (Line 17)
```typescript
const userRole = (user as any)?.user_metadata?.role
```

The code was looking for `user.user_metadata.role`, but the `withSupabaseAuth` function returns an `AuthenticatedUser` object that has the role directly on the user object.

### Correct Code
```typescript
const userRole = (user as any)?.role
```

## Technical Details

### How `withSupabaseAuth` Works

The RBAC middleware (`lib/supabase/rbac.ts`) does the following:

1. Gets the authenticated user from Supabase auth
2. **Fetches the user's profile** from the `profiles` table
3. **Extracts the role** from the profile
4. Returns an `AuthenticatedUser` object with this structure:

```typescript
interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: Role  // ← Role is here, not in user_metadata
  isActive: boolean
}
```

### Why This Matters

- ✅ **Correct**: `user.role` - Gets role from the profiles table
- ❌ **Wrong**: `user.user_metadata.role` - Tries to get role from Supabase Auth metadata (not used in this app)

## Files Modified

### `/app/api/inspections/[id]/approve/route.ts`

**Line 17 - Changed from:**
```typescript
const userRole = (user as any)?.user_metadata?.role
```

**To:**
```typescript
const userRole = (user as any)?.role
```

**Also added debug logging:**
```typescript
if (userRole !== 'PROJECT_MANAGER' && userRole !== 'EXECUTIVE') {
  console.error('Authorization failed - User role:', userRole, 'User:', user)
  return NextResponse.json(
    { error: 'Not authorized to approve inspections', userRole },
    { status: 403 }
  )
}
```

## Testing

To verify the fix:

1. **Log in as a PROJECT_MANAGER**
2. Navigate to an inspection in PENDING or IN_REVIEW status
3. Click "Review Inspection"
4. Fill out the approval form
5. Click "Submit Approved" or "Submit Rejected"
6. **Should succeed** with success toast message

### Expected Behavior After Fix

- ✅ PROJECT_MANAGER can approve/reject inspections
- ✅ EXECUTIVE can approve/reject inspections
- ❌ INSPECTOR cannot approve/reject (gets 403 error)

## Related Files

- `lib/supabase/rbac.ts` - RBAC middleware that extracts role from profiles
- `app/api/inspections/[id]/approve/route.ts` - Approval endpoint (FIXED)
- `components/approvals/approval-form.tsx` - UI form for approval

## Prevention

To prevent this issue in the future:

1. Always use TypeScript interfaces for authenticated users
2. Import and use the `AuthenticatedUser` type from `lib/supabase/rbac.ts`
3. Don't cast to `any` when accessing user properties
4. Use the documented structure from `withSupabaseAuth`

### Recommended Pattern

```typescript
import { withSupabaseAuth, AuthenticatedUser } from '@/lib/supabase/rbac'

export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error
  
  // User is already typed as AuthenticatedUser
  // Access role directly: user.role
  if (user.role !== 'PROJECT_MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // ... rest of handler
}
```
