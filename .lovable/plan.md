

## Fix: TS2589 Build Error in RecordSale.tsx

### Problem
Line 315 in `RecordSale.tsx` triggers a TypeScript error: "Type instantiation is excessively deep and possibly infinite." This happens because the Supabase `.select('team_id, teams(project_id)')` chain on the `team_members` table produces deeply nested generic types that TypeScript cannot resolve.

### Solution
Cast the Supabase query result to break the deep type chain, similar to how the insert on line 338 already uses `as any`.

### Technical Details

**File: `src/pages/RecordSale.tsx`**

Change the team data query (around line 315) from:

```typescript
const { data: teamData } = await supabase
  .from('team_members')
  .select('team_id, teams(project_id)')
  .eq('user_id', user.id)
  .limit(1)
  .maybeSingle();
```

To:

```typescript
const { data: teamData } = await supabase
  .from('team_members')
  .select('team_id, teams(project_id)')
  .eq('user_id', user.id)
  .limit(1)
  .maybeSingle() as any;
```

Then simplify the subsequent type assertion (line 321) since `teamData` is already `any`:

```typescript
projectId = teamData?.teams?.project_id || null;
```

This is a one-line change that resolves the build error with no behavioral impact.

