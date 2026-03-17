

## Problem

Google's OAuth account picker is controlled by Google — we cannot filter which accounts appear. However, we **can** validate the user's email after OAuth completes and before granting access.

Currently, the magic link flow checks `check_email_exists` RPC before sending the link. The Google OAuth flow has no such check — any Google account can sign in and land on the home page.

## Approach

After the Google OAuth redirect completes in `AuthCallback.tsx`, we already have the session established. We need to:

1. **After `setSession` succeeds**, get the user's email from the session
2. **Call `check_email_exists` RPC** with that email
3. **If the email is NOT in `user_roles`**: sign the user out immediately, then redirect to `/login?error=account_not_found`
4. **If it exists**: proceed to home page as normal

This mirrors the existing magic link guard but happens post-authentication rather than pre-authentication (since we can't intercept Google's picker).

## Changes

### 1. `src/pages/AuthCallback.tsx`
After successfully setting the session:
- Get user email from `supabase.auth.getUser()`
- Call `check_email_exists` RPC
- If not found: `supabase.auth.signOut()` then redirect to `/login?error=account_not_found`
- If found: navigate to `/`

### 2. `src/pages/Login.tsx`
Add an error message mapping for the new `account_not_found` error param:
- `"Account not found. Please contact your administrator."`

This keeps the same UX pattern as the magic link restriction — unauthorized users see a clear "contact your admin" message.

