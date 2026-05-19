# Remove team_type / project_type — drive UI from active_components CRM codes

The Trakkit project wizard already stores per-project component selections in `project_plans.mobile_components` keyed by CRM codes (`CRM-0010`, `CRM-0034`, …). DB triggers copy that jsonb into `user_workspaces.active_components`, and `workspaceService` already loads it. This plan rewires the mobile app to consume CRM codes exclusively and removes every reference to `team_type` and `project_type`.

## 1. New shared catalog

Add `src/data/mobileComponentsCatalog.ts` mirroring the wizard project so codes/types stay in sync:
- `MOBILE_COMPONENTS` list + groups
- `DEFAULT_MOBILE_COMPONENTS` (all true)
- `mergeWithDefaults(stored)` — sparse jsonb merge

## 2. Rewrite `useProjectComponents`

- Replace `ProjectComponentFlags` (`enable_*`) with a `useComponent(code)` style hook backed by CRM codes.
- New shape: `{ isEnabled(code: string): boolean, codes: Record<string, boolean>, isLoaded }`.
- Source: `userWorkspaces.find(w => w.workspace_id === currentWorkspaceId)?.active_components`, merged with `DEFAULT_MOBILE_COMPONENTS`.
- Keep export name `useProjectComponents` to minimise diffs.

## 3. Replace nav gating

`BottomNavigation`:
- Drop `currentTeamType` prop and all `teamType === "wholesale" / "seeding" / "instore" / …` branches.
- Each `NavItem` gets a `code` (CRM page code). Visible iff `isEnabled(code)` or `alwaysShow`.
- Dashboard/Profile/Chat keep `alwaysShow`.

`MobileLayout`: stop passing `currentTeamType`.

`SupervisorBottomNav`: each tab maps to a supervisor page code; gate identically.

## 4. Replace page/feature gating

Every file that branches on `currentTeamType` is rewritten to call `isEnabled('CRM-XXXX')` for the specific dialog/section it gates:

| File | team_type branch today | New gate |
|---|---|---|
| `Dashboard.tsx` | `isSeeding`/`isInstore` hide QuickActions | `isEnabled('CRM-0051')` (Quick Actions card) |
| `RecordAttendanceForm.tsx` | wholesale → stock dialog; seeding → seeding evening; instore → morning/closing | `isEnabled('CRM-0022')`, `'CRM-0024'`, `'CRM-0021'`, `'CRM-0020'`, `'CRM-0019'`, `'CRM-0023'` |
| `StoreSuccessDialog.tsx` | market-research price-report enablement | `isEnabled('CRM-0025')` |
| `Reports.tsx` / `Routes.tsx` / `RecordSale.tsx` / `Profile.tsx` / `supervisor/StatsPage.tsx` | wholesale/seeding/instore/survey branches | corresponding CRM codes per branch |
| `useSalesForm.tsx` | wholesale photo requirement | `isEnabled('CRM-0055')` (Store Success / sale photo) — or introduce a dedicated `CRM-0034P` later if needed |
| `TopBar.tsx` | team-type label | drop label, show workspace name only |
| `WorkspaceOnboarding.tsx` / `TourOverlay.tsx` | team-type-keyed copy | use generic copy keyed off enabled actions |
| `ProfileHeader.tsx` / `HelpFAQDialog.tsx` | display team_type label | drop the label (workspace name remains) |

Wholesale-only **business logic** that has no matching catalog entry (custom pricing in `useSalesForm`, image metadata tag `team_type: 'wholesale'`) is replaced as follows:
- Custom pricing keeps working — it is keyed on workspace/product in localStorage, not on team_type. The conditional that only enables it for wholesale is removed; pricing override UI shows whenever Record Sale is enabled.
- Drop the `team_type: 'wholesale'` tag in `imageMetadata`; supervisors already see project context via project_id.

## 5. Strip workspace plumbing

`workspaceService.ts`:
- Remove `currentTeamType`, `getCurrentTeamType`, `updateTeamTypeFromWorkspace`.
- Remove `team_type` from the `user_workspaces` select and the `UserWorkspace` interface.
- `getCurrentActiveComponents()` stays.

`useWorkspace.tsx`:
- Remove `currentTeamType` from context and all consumers.
- Add `currentActiveComponents: Record<string, boolean> | null` for convenience.

## 6. Files touched (~20)

- new: `src/data/mobileComponentsCatalog.ts`
- edit: `src/hooks/useProjectComponents.tsx`, `src/hooks/useWorkspace.tsx`, `src/hooks/useSalesForm.tsx`, `src/services/workspaceService.ts`
- edit: `src/components/MobileLayout.tsx`, `BottomNavigation.tsx`, `StoreSuccessDialog.tsx`
- edit: `src/components/supervisor/SupervisorBottomNav.tsx`
- edit: `src/components/attendance/RecordAttendanceForm.tsx`
- edit: `src/components/dashboard/TopBar.tsx`
- edit: `src/components/onboarding/{WorkspaceOnboarding,TourOverlay}.tsx`
- edit: `src/components/profile/{ProfileHeader,HelpFAQDialog}.tsx`
- edit: `src/pages/{Dashboard,Reports,Routes,RecordSale,Profile}.tsx`
- edit: `src/pages/supervisor/StatsPage.tsx`

## 7. Out of scope

- No DB migration. `team_type` and `project_type` columns stay in the DB (other systems / supervisor analytics may read them); we only stop the mobile app from reading or branching on them.
- No changes to `project_plans`, triggers, or backfill — already done.
- No new flags added to the wizard. If a behavior currently relies on team_type and has no matching CRM code, it is gated by the closest existing code (documented above) and called out for follow-up.

## Risks / follow-ups

- Wholesale "mandatory sale photo" no longer enforced separately from Store Success dialog. If you want it as its own toggle, we'll need a new catalog code (e.g. `CRM-0034P`) added in the wizard project.
- Profile/onboarding copy becomes generic; team-type-flavored wording is lost.
- Supervisor analytics that group by team_type are untouched (they read DB directly).
