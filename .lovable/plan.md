

## First-Time Workspace Onboarding Flow

### What It Does
When a user enters a workspace for the first time, they see a multi-step onboarding dialog:

1. **Language picker** — Choose English or Kiswahili (sets app language)
2. **Team name** — "You're part of the **[Workspace Name]** team"
3. **Experience check** — "Have you used TraKKiT for [team_type] projects before?" Yes/No
4. **Component guide** — Regardless of answer, show a brief explanation of each visible component for their team type, with a link to "View full docs" → opens `https://trakkit.darajatech.com/docs` in a new tab

No tour overlay. No page navigation. Just a clean dialog sequence.

### Instore Component Descriptions

| Component | Description |
|-----------|-------------|
| Record Attendance | Check in and out by taking a selfie |
| Set Location | Select which store you're at today |
| Routes | View and search your assigned stores |
| Reports | Log customer feedback and competitor activity |
| Work Hours | Track your daily work time |
| Chat | Message your supervisor |

### Persistence
- `localStorage` key: `onboarded_{workspaceId}` — set on completion
- Switching workspaces triggers a new onboarding if key is missing

### Help/FAQ Link Update
- `HelpFAQDialog` "Visit Help Center" and the help icon link → `https://trakkit.darajatech.com/docs` (external, new tab)
- Update `HelpSupport.tsx` "Visit Help Center" button similarly

### Files
- **Create**: `src/components/onboarding/WorkspaceOnboarding.tsx` — multi-step dialog component
- **Modify**: `src/pages/Dashboard.tsx` — mount `<WorkspaceOnboarding />`
- **Modify**: `src/components/profile/HelpFAQDialog.tsx` — add docs link
- **Modify**: `src/pages/HelpSupport.tsx` — update Help Center URL

### No Swahili translation of pages
Language selection only affects the `useLanguage` context for existing translated keys. Page content stays in English.

