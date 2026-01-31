

# Add Dedicated Fields to `daily_stock_reports` Table

## Overview
The current `daily_stock_reports` table uses a single `stock_level` field with a check constraint that only allows `available`, `low_stock`, or `unavailable`. This works for morning reports but causes evening reports to fail (since they store sales quantities, not stock levels).

This plan adds dedicated fields so both report types can store their data properly in the same table.

---

## Database Changes

### New Columns to Add

| Column | Type | Purpose |
|--------|------|---------|
| `quantity_sold` | `INTEGER` | Stores the number of units sold (evening report) |

### Modifications

| Change | Details |
|--------|---------|
| Make `stock_level` nullable | Allow evening reports to skip this field |
| Remove/Update check constraint | Allow `stock_level` to be `NULL` for evening reports |

### Migration SQL

```sql
-- Make stock_level nullable for evening reports
ALTER TABLE public.daily_stock_reports 
  ALTER COLUMN stock_level DROP NOT NULL;

-- Add quantity_sold column for evening reports
ALTER TABLE public.daily_stock_reports 
  ADD COLUMN quantity_sold INTEGER DEFAULT NULL;

-- Update check constraint to allow NULL stock_level
ALTER TABLE public.daily_stock_reports 
  DROP CONSTRAINT IF EXISTS daily_stock_reports_stock_level_check;

ALTER TABLE public.daily_stock_reports 
  ADD CONSTRAINT daily_stock_reports_stock_level_check 
  CHECK (stock_level IS NULL OR stock_level IN ('available', 'low_stock', 'unavailable'));
```

---

## Code Changes

### File: `src/components/attendance/StockReportDialog.tsx`

Update the `handleSubmit` function to use the new field structure:

**Morning Report Insert:**
```typescript
const reports = inventory.map((item) => ({
  agent_id: user.id,
  product_variant_id: item.product_variant_id,
  stock_level: stockLevels[item.product_variant_id],  // Required for morning
  quantity_sold: null,  // Not used for morning
  report_type: "morning",
  work_date: today,
  workspace_id: currentWorkspaceId,
}));
```

**Evening Report Insert:**
```typescript
const reports = inventory.map((item) => ({
  agent_id: user.id,
  product_variant_id: item.product_variant_id,
  stock_level: null,  // Not used for evening
  quantity_sold: salesData[item.product_variant_id] || 0,  // Required for evening
  report_type: "evening",
  work_date: today,
  workspace_id: currentWorkspaceId,
}));
```

---

## Data Flow Summary

```text
┌─────────────────────────────────────────────────────────────┐
│                    daily_stock_reports                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MORNING REPORT                  EVENING REPORT              │
│  ─────────────                  ──────────────               │
│  report_type: "morning"         report_type: "evening"       │
│  stock_level: "available" |     stock_level: NULL            │
│               "low_stock" |     quantity_sold: 5             │
│               "unavailable"                                  │
│  quantity_sold: NULL                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

1. **Apply database migration** - Add `quantity_sold` column and update constraints
2. **Update StockReportDialog** - Modify submit logic to use appropriate fields per report type
3. **Types auto-update** - Supabase types will regenerate automatically after migration

