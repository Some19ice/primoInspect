# Inspector Dashboard Testing Guide

## Quick Test Steps

### 1. Test Debug Page First
```
1. Navigate to http://localhost:3000/debug/inspector
2. Check if your user profile loads
3. Click "Test /api/inspections" button
4. Check the console for debug logs
5. Look at the result - should show inspections data
```

### 2. Check Browser Console
Open DevTools (F12 or Cmd+Option+I) and look for:
- `[useRealtimeInspections] Fetching: ...` 
- `[useRealtimeInspections] Response status: ...`
- `[useRealtimeInspections] Received inspections: ...`

### 3. Check for Errors
Common issues:
- **401 Unauthorized** - Authentication cookie not being sent
- **403 Forbidden** - User doesn't have inspector role
- **Empty array** - User has no inspections assigned

### 4. Test Inspector Dashboard
```
1. Navigate to http://localhost:3000/dashboard/inspector
2. Should see stats (Due Today, Completed, etc.)
3. Should see "Today's Schedule" with inspections
4. Should see "Recent Work" section
5. Click on an inspection card - should navigate to detail page
```

### 5. Test Inspection Detail & Execution
```
1. Click any inspection from the dashboard
2. Should see inspection details page
3. If status is DRAFT, should see "Start Inspection" button
4. Click "Start Inspection"
5. Should navigate to /inspections/[id]/execute
6. Should see checklist questions
7. Fill out responses
8. Should be able to save draft and submit
```

## Debug Output

### What You Should See in Console

**Successful Load:**
```
[useRealtimeInspections] Fetching: /api/inspections?userId=xxx&userRole=INSPECTOR
[useRealtimeInspections] Response status: 200
[useRealtimeInspections] Received inspections: 5
```

**Authentication Issue:**
```
[useRealtimeInspections] Fetching: /api/inspections?userId=xxx&userRole=INSPECTOR
[useRealtimeInspections] Response status: 401
[useRealtimeInspections] Error: { error: "Authentication required" }
```

**No Data:**
```
[useRealtimeInspections] Fetching: /api/inspections?userId=xxx&userRole=INSPECTOR
[useRealtimeInspections] Response status: 200
[useRealtimeInspections] Received inspections: 0
```

## Troubleshooting

### Issue: "Authentication required" (401)
**Cause:** Supabase session cookies not being sent
**Fix:** 
1. Make sure you're logged in
2. Check if cookies are set (DevTools > Application > Cookies)
3. Look for `sb-*-auth-token` cookies

### Issue: "Insufficient permissions" (403)
**Cause:** User doesn't have inspector role
**Fix:**
1. Check your user role in the debug page
2. User must have role='INSPECTOR'
3. Update in database if needed

### Issue: Empty dashboard
**Cause:** No inspections assigned to user
**Fix:**
1. Go to /debug/inspector and test the API
2. Check the response - if it returns empty array, user has no inspections
3. Need to create inspections assigned to this user

### Issue: Can't click inspections
**Cause:** Routing issue
**Check:**
1. Look for errors in console
2. Make sure inspection has an `id` field
3. Check if onClick handler is working

## API Endpoints Being Used

### GET /api/inspections
**Query params:**
- `userId` - Current user ID
- `userRole` - User's role (INSPECTOR)

**Expected Response:**
```json
{
  "inspections": [
    {
      "id": "uuid",
      "title": "Inspection Title",
      "status": "DRAFT",
      "priority": "HIGH",
      "due_date": "2025-10-01T12:00:00Z",
      "description": "...",
      "assigned_to": "user-id",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Quick Fixes

### If credentials aren't being sent:
The hooks have been updated to include `credentials: 'include'` in all fetch calls.

### If still not working:
1. Clear browser cache
2. Log out and log back in
3. Check Supabase auth is working:
   ```javascript
   // In browser console
   document.cookie
   // Should show sb-*-auth-token cookies
   ```

### If you see inspections in debug but not in dashboard:
1. Check the console for errors
2. Look for React component errors
3. Make sure `useRealtimeInspections` hook is being called with correct params

## Next Steps After Testing

Once inspector dashboard shows data:
1. Test clicking on inspections
2. Test the execution page (/inspections/[id]/execute)
3. Fill out a checklist
4. Test submission
5. Verify status changes to PENDING
