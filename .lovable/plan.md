## Problem

Adding an agent from the supervisor mobile UI (`UsersPage.tsx`) calls the `create-user` edge function and fails with the Supabase client error:

> "Edge Function returned a non-2xx status code"

(displayed loosely as "2XX status code error").

## Root Cause

`supabase/functions/create-user/index.ts` checks whether the invitee already exists with:

```ts
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
const existingUser = existingUsers?.users?.find(
  u => u.email?.toLowerCase() === email.toLowerCase()
);
```

`auth.admin.listUsers()` is **paginated** and returns only the first page (default 50, max 1000). The project currently has **520 auth users**, so most existing accounts are not found by this scan.

When the email actually does exist in `auth.users` but is missing from page 1, the function falls into the "create new user" branch and `auth.admin.createUser` throws:

> "A user with this email address has already been registered"

That throw is caught by the outer `catch` and returned as HTTP 500, which the browser surfaces as the "non-2xx" error toast in `UsersPage.handleInviteUser`.

The same bug also makes the function unreliable for re-inviting any existing agent (re-assigning workspace, team, inventory) — it randomly succeeds depending on auth user ordering.

## Fix

Edit `supabase/functions/create-user/index.ts`:

1. Replace the unpaginated `listUsers()` call with a direct lookup. Use the admin email lookup (paginated `listUsers({ page, perPage: 1000 })` loop, or the filter form `listUsers({ filter: \`email.eq.\${email}\` })` which only returns matches). Preferred: loop pages until found or no more results.
2. Wrap the existing-user / create-user branch in a single try and, if `createUser` returns the "already registered" error, fall back to a final paginated lookup before failing — defensive against race conditions.
3. Return a clearer JSON error (still 500) so the toast shows the underlying message instead of the generic wrapper.

No other files need changes. No database migration required. No new secrets.

## Verification

- Re-invite an email already present in `auth.users` from supervisor mobile → success toast, user appears in workspace immediately.
- Invite a brand-new email → unchanged behaviour, OTP flow continues to work.
- Existing flows that depend on `userId` returned from the function (team assignment dialog in `UsersPage.tsx`) keep working since the response shape is unchanged.
