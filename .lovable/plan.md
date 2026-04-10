

## Plan: Skip Unavailable Products in Morning Stock Count

**Problem**: Products marked as "unavailable" or "not_sold" in the Stock Availability report still appear in the Morning Stock Count dialog, requiring agents to count items that aren't present.

**Solution**: Pass the stock levels from the Stock Availability report to the Morning Stock Count dialog, and filter out products marked "unavailable" or "not_sold".

### Changes

**1. `src/components/attendance/InstoreMorningStockCountDialog.tsx`**
- Add a new prop `stockLevels?: Record<string, string>` to accept availability data from the parent
- After fetching products, filter out any whose `product_variant_id` has a stock level of `"unavailable"` or `"not_sold"`
- Products marked `"available"` or `"low_stock"` (or not in the map) will still appear for counting

**2. `src/components/attendance/RecordAttendanceForm.tsx`**
- Capture `onStockLevelsChange` from the `StockReportDialog` into component state (add `useState` for stock levels)
- Pass the captured stock levels to `InstoreMorningStockCountDialog` as a new `stockLevels` prop

### Flow After Change

```text
Stock Availability Report
  ├─ Product A: Available     → appears in Stock Count
  ├─ Product B: Low Stock     → appears in Stock Count
  ├─ Product C: Unavailable   → HIDDEN from Stock Count
  └─ Product D: Not Sold      → HIDDEN from Stock Count
```

This is a small, two-file change with no database modifications.

