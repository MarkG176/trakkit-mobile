
# Add Standalone Team Management

## Problem
Teams can only be created as part of the "invite user" flow. Supervisors should be able to create (and manage) teams independently.

## Solution
Add a "Manage Teams" button to the Users page that opens a dialog where supervisors can:
- View all existing teams
- Create new teams
- Rename teams
- Delete (soft-delete) teams

## Changes

### 1. `src/pages/supervisor/UsersPage.tsx`
- Add a "Manage Teams" icon button in the top bar (next to the invite button)
- Add a new `TeamManagementDialog` that lists all teams with options to create, rename, and delete
- The dialog will:
  - Show all teams with member count
  - Have a "Create Team" input at the top
  - Each team row has rename (pencil icon) and delete (trash icon) actions
  - Delete sets `is_deleted = true` (soft delete already supported by the schema)

### 2. No database changes needed
The `teams` table already supports all required operations and RLS policies allow supervisor access.
