# Middleware Authentication Fix

## Issue Summary

The application was experiencing errors when API routes failed authentication:
- **Error**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- **Root Cause**: Middleware was redirecting unauthenticated API requests to the HTML signin page instead of returning JSON error responses
- **Secondary Issue**: Supabase auth client in middleware was failing with "fetch failed" errors due to incorrect cookie handling

## Error Logs

```
Error: fetch failed
    at context.fetch (/Users/yakky/Dev/primoInspect/node_modules/next/dist/server/web/sandbox/context.js:321:60)
    at eval (webpack-internal:///(middleware)/./node_modules/@supabase/auth-js/dist/module/lib/helpers.js:116:25)
    ...
    at async eval (webpack-internal:///(middleware)/./node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:1049:28)

Console SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Changes Made

### 1. Fixed Middleware to Return JSON for API Routes (`middleware.ts`)

**Before:**
```typescript
// Redirect to signin if not authenticated
if (authResult.error) {
  const redirectUrl = new URL('/auth/signin', request.url)
  redirectUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(redirectUrl)
}
```

**After:**
```typescript
// Handle authentication failure
if (authResult.error) {
  // For API routes, return JSON error instead of redirecting
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: {
          code: authResult.error.code,
          message: authResult.error.message,
        },
      },
      { status: authResult.error.statusCode }
    )
  }
  
  // For page routes, redirect to signin
  const redirectUrl = new URL('/auth/signin', request.url)
  redirectUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(redirectUrl)
}
```

### 2. Fixed Supabase Client in Middleware (`lib/auth/auth-service.ts`)

**Issue**: The middleware was using `cookies()` from `next/headers`, which doesn't work properly in middleware context. In middleware, we need to use the request object directly.

**Added new function:**
```typescript
// Create Supabase client for middleware using request cookies
function createSupabaseMiddlewareClient(request: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // Cannot set cookies in middleware during auth check
        },
        remove() {
          // Cannot remove cookies in middleware during auth check
        },
      },
    }
  )
}
```

**Updated authenticate method:**
```typescript
async authenticate(request: NextRequest): Promise<AuthResult> {
  try {
    // Use middleware-compatible client
    const supabaseServer = createSupabaseMiddlewareClient(request)
    // ... rest of the method
```

## Why This Fixes the Issue

1. **JSON Responses for API Routes**: When client-side code makes fetch requests to API routes (e.g., `/api/inspections`, `/api/projects`), it expects JSON responses. Previously, unauthenticated requests were being redirected to the signin page, which returned HTML. This caused the "Unexpected token '<'" error when the client tried to parse the HTML as JSON.

2. **Proper Cookie Access in Middleware**: The `cookies()` function from `next/headers` is designed for Route Handlers and Server Components, not middleware. In middleware, we must use `request.cookies` directly to access cookies. This fixes the "fetch failed" errors from Supabase auth client.

## Behavior After Fix

### API Routes (e.g., `/api/inspections`)
- **Unauthenticated**: Returns `401 Unauthorized` with JSON error:
  ```json
  {
    "error": {
      "code": "AUTH_REQUIRED",
      "message": "Authentication required"
    }
  }
  ```
- **Authenticated**: Proceeds normally with user info in headers

### Page Routes (e.g., `/dashboard/manager`)
- **Unauthenticated**: Redirects to `/auth/signin?redirectTo=/dashboard/manager`
- **Authenticated**: Proceeds normally

## Testing

After restarting the dev server, verify:
1. ✓ No more "Unexpected token" JSON parsing errors
2. ✓ No more Supabase "fetch failed" errors
3. ✓ API routes return proper JSON error responses when unauthenticated
4. ✓ Page routes still redirect to signin when unauthenticated
5. ✓ Authenticated requests work normally

## Related Files Modified

- `middleware.ts` - Added JSON error handling for API routes
- `lib/auth/auth-service.ts` - Added middleware-compatible Supabase client creation
