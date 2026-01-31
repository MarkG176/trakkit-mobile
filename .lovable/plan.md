

# Plan: Change Evening Report Behavior and Hide Reports Page for Wholesale

## Overview
This plan modifies the evening stock report flow for wholesale team types. Instead of submitting to `daily_stock_reports`, the evening report will:
1. Display the sales summary (already tracked in `daily_sales_tracking`)
2. Show a notes input that submits to the `notes` table
3. Hide the Reports page from navigation when `team_type` is `wholesale`

---

## Current Behavior

```text
Evening Check-Out Flow (Wholesale):
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│   Check Out     │ --> │  StockReportDialog   │ --> │ daily_stock_reports│
│   (Selfie)      │     │  (Evening)           │     │    (INSERT)        │
└─────────────────┘     └──────────────────────┘     └────────────────────┘
```

---

## New Behavior

```text
Evening Check-Out Flow (Wholesale):
┌─────────────────┐     ┌──────────────────────────────────────┐     
│   Check Out     │ --> │  EveningReportDialog                 │
│   (Selfie)      │     │  ┌────────────────────────────────┐  │
└─────────────────┘     │  │ Sales Summary (read-only)      │  │
                        │  │ from daily_sales_tracking      │  │
                        │  └────────────────────────────────┘  │
                        │  ┌────────────────────────────────┐  │
                        │  │ Notes Input                    │  │ --> notes table
                        │  │ (textarea)                     │  │     (INSERT)
                        │  └────────────────────────────────┘  │
                        └──────────────────────────────────────┘
```

---

## Implementation Steps

### 1. Create New Evening Report Dialog Component

**File:** `src/components/attendance/EveningReportDialog.tsx`

Create a new dialog that:
- Fetches and displays today's sales summary from `daily_sales_tracking` (read-only)
- Provides a notes textarea for the agent to add daily notes
- On submit, saves notes to the `notes` table (same as Reports page)
- Does NOT submit to `daily_stock_reports`

**Key Fields:**
| Data | Source | Action |
|------|--------|--------|
| Sales Summary | `daily_sales_tracking` | Display only (read-only) |
| Notes | User input | Submit to `notes` table |

### 2. Update RecordAttendanceForm to Use New Dialog for Evening

**File:** `src/components/attendance/RecordAttendanceForm.tsx`

Modify the check-out flow for wholesale:
- Morning check-in: Keep using `StockReportDialog` (morning report to `daily_stock_reports`)
- Evening check-out: Switch to new `EveningReportDialog`

Changes:
- Add state for `showEveningReport`
- Import and render `EveningReportDialog`
- Update the conditional logic after successful check-out

### 3. Update BottomNavigation to Hide Reports for Wholesale

**File:** `src/components/BottomNavigation.tsx`

Modify to:
- Accept `currentTeamType` prop from `useWorkspace`
- Filter out the "Reports" nav item when `currentTeamType === 'wholesale'`

### 4. Update MobileLayout to Pass Team Type

**File:** `src/components/MobileLayout.tsx`

Modify to:
- Use `useWorkspace` hook to get `currentTeamType`
- Pass it down to `BottomNavigation`

---

## Technical Details

### EveningReportDialog Component Structure

```text
Dialog
├── DialogHeader
│   └── Title: "Evening Report"
│
├── Sales Summary Section (read-only)
│   └── List of products with quantities sold today
│       (fetched from daily_sales_tracking, grouped by product)
│
├── Notes Section
│   └── Textarea for daily notes
│
└── DialogFooter
    └── Submit button (saves notes to `notes` table)
```

### Notes Table Insert (Same as Reports Page)

```typescript
await supabase
  .from('notes')
  .insert({
    agent_id: user.id,
    workspace_id: currentWorkspaceId,
    content: notes,
    note_type: 'daily_report'  // Optional: categorize as daily report
  });
```

### Navigation Filter Logic

```typescript
// In BottomNavigation
const filteredNavItems = navItems.filter(item => {
  if (item.id === 'reports' && currentTeamType === 'wholesale') {
    return false;
  }
  return true;
});
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/attendance/EveningReportDialog.tsx` | Create | New dialog for evening check-out with sales summary + notes |
| `src/components/attendance/RecordAttendanceForm.tsx` | Modify | Use EveningReportDialog for evening check-out |
| `src/components/BottomNavigation.tsx` | Modify | Hide Reports tab for wholesale team_type |
| `src/components/MobileLayout.tsx` | Modify | Pass team_type to BottomNavigation |

---

## Data Flow Summary

```text
Morning Check-In (Wholesale)
─────────────────────────────
StockReportDialog → daily_stock_reports (stock levels)

Evening Check-Out (Wholesale - NEW)
───────────────────────────────────
EveningReportDialog:
  1. READ: daily_sales_tracking → Display sales summary
  2. WRITE: notes table → Save agent's daily notes
  
Navigation (Wholesale)
──────────────────────
Reports page hidden from bottom nav when team_type = 'wholesale'
```

