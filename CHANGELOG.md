# Trakkit Mobile — Application Updates by Month

> Summary of meaningful feature work and fixes derived from the git history (Sept 2025 → June 2026). Routine Lovable auto-commits ("Changes", "Preceding changes", "Save plan", "Initial plan", revert churn) are excluded so each month reflects actual product changes.

## September 2025 — Project Foundation
- Created the initial mobile application structure (Vite + React + shadcn/ts).
- Built the core dashboard and page scaffolding, plus the login page.
- Connected the app to Supabase (initial integration).
- Added Sales, Survey, and Giveaway pages; redesigned the **Record Sale** page.
- Pushed reports into Supabase; added performance cards with labels.
- Set up magic-link login redirects for agents and supervisors.

## October 2025 — Core Field-Agent Features (largest build month)
- **Attendance & location:** check-in/check-out, GPS location fetching, distance calculation (incl. Google Maps API), in-range (500m) checks, "Set Location" geolocation form.
- **Camera:** camera button/icon in the top bar and nav, camera refactors and fixes.
- **PWA:** installation option and prompts.
- **Routes & Dashboard:** refactored Dashboard into a Routes page; sales tracking form; products on reports page; agent status logging.
- **Notes & uploads:** notes + image upload on reports (later moved to a Supabase Notes section), RLS policy fixes.
- **Workspaces:** workspace switching, context switcher, infinite-loop/login-redirect fixes.
- **Giveaways & inventory:** Supabase giveaways table, SKU display on Inventory, contact field on stores.
- **Surveys:** survey template loading/rendering fixes, interaction-type cleanup.
- **Supervisor:** added supervisor pages/dashboard, supervisor mobile view, agent-activity filtering by workspace.
- Store creation success dialog; favicon/app icon updates.

## November 2025 — Auth & Iteration
- Added auth callback handling.
- General Lovable iteration commits (no major standalone features).

## December 2025 — Iteration
- Heavy Lovable iteration period; primarily incremental "Changes" with no distinct feature labels.

## January 2026 — Supervisor & Workspace Data
- Connected supervisor views to workspace-scoped data.
- Fixed day-plan workspace copy.
- Continued iteration on dashboard/workspace behavior.

## February 2026 — Reports, Teams & Data Integrity
- Fixed profile stats data sources.
- Evening/Seeding report dialogs: notes handling, decoupled notes from image upload, better error surfacing, workspace_id filtering of sales data.
- Added logout button to the agent TopBar; team label badge on agent profile.
- Add Store form fixes (COALESCE uuid/jsonb error; added `is_active` column to `team_members`).

## March 2026 — Surveys, Localization & Field Workflows (major month)
- **Give Products flow:** added customer name, phone, feedback text + star rating; pass `project_id` to giveaways.
- **Localization:** added full Swahili language support with a toggle.
- **Audio:** real audio recording integrated into Surveys (inline recorder, project-folder uploads, `sale-recordings` bucket).
- **Surveys/Market Research:** segment surveys by project/workspace, fix double-submit, restrict `survey_campaign` UI, hide reports/inventory for survey teams.
- **Instore:** instore closing report, restricted instore layout/UI constraints.
- **Stock & Pricing:** connect stock reports to stores, Pepsi stock auto-load, **Price Report** feature with SKU and unit fields.
- **Photos:** replaced engagement with photo uploads; photos in Store dialog; image captions.
- **Auth/Security:** Google sign-in option, hardened OAuth allowlist/guard, `useAuth` provider fix.
- **Location:** background location tracker; exclude specific user from tracking.
- **Geography:** Country dropdown + searchable county dropdown filtered by project country.
- Build version badge; store image uploads to a storage bucket.

## April 2026 — Onboarding, Activity Logging & Team Management (major month)
- **Auth:** switched to OTP login, removed magic-link references.
- **Onboarding:** onboarding flow + workspace dialog, Instore Quick Guide / tour overlay, HelpFAQ tailored per team type, no-team dialog handling.
- **Instore:** morning stock count dialog, deduplicated morning stock, hide daily sales/sales card for instore.
- **Activity logging:** added an activity-logging system and utility.
- **Supervisor:** supervisor activity feed, agent-activity map page + hook, fixed supervisor map rendering/height, agent detail sheets.
- **Team management:** standalone team management, TeamManagementDialog, dashboard team filter, show all agent submissions, display team title on profile.
- **Products:** `formatProductName` utility, SKU-first display, multi-line product name wrapping.
- PWA cache limit adjustment; populate store country on creation.

## May 2026 — Reporting Suite & Pricing (major month)
- **Reports:** Morning/Evening reports, full Reports page, manual reports fallback, removed manual trigger for morning/evening reports, mobile report fixes, stats.
- **Pricing/Currency:** custom currency support, custom unit pricing, price reports.
- **Inventory:** wholesale product-focus inventory, hide count/amount on instore activities, stock reports on store success dialog.
- **Workspaces/Teams:** supervisor workspace view, quicker workspace setting, team-assign bug fix, removed team false flags, automatic county/country fill.
- **UX:** custom loading + full custom layout, aesthetic/workspace fixes, permissions card, permission requests, report image live capture, product focus fix.

## June 2026 — Offline Support
- Introduced **Offline Support**, followed by **Offline V2** and **Offline V3** iterations.

---

### High-level trajectory
1. **Sep–Oct 2025:** Stand up the app — auth, dashboard, sales, location/camera, PWA, supervisor basics.
2. **Nov 2025–Feb 2026:** Stabilize workspaces, reporting, and team/profile data.
3. **Mar–Apr 2026:** Feature expansion — surveys/audio, localization, onboarding, activity logging, team management, security.
4. **May 2026:** Mature the reporting and pricing suite.
5. **Jun 2026:** Offline capability.
