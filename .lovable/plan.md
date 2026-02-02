
# Plan: Remove Record Sale Option from Inventory Page

## Overview
Remove the "Record a Sale" button from the Inventory page's product detail view. This button currently appears when a user clicks on an inventory item to view its details.

## Changes Required

### File: `src/pages/Inventory.tsx`

**What to remove:**
- Remove the "Record a Sale" button (lines 85-88) from the Actions section in the product detail view
- Remove the unused `ShoppingCart` icon import since it will no longer be used

**Before:**
```tsx
{/* Actions */}
<div className="space-y-3">
  <Button className="w-full h-12">
    <ShoppingCart size={20} className="mr-2" />
    Record a Sale
  </Button>
  <Button variant="outline" className="w-full h-12">
    <Gift size={20} className="mr-2" />
    Record a Giveaway
  </Button>
</div>
```

**After:**
```tsx
{/* Actions */}
<div className="space-y-3">
  <Button variant="outline" className="w-full h-12">
    <Gift size={20} className="mr-2" />
    Record a Giveaway
  </Button>
</div>
```

## Technical Details
- The `ShoppingCart` icon import will be removed from the imports at line 4
- Only the "Record a Giveaway" button will remain in the actions section
- No other files are affected by this change

## Impact
- Users will no longer see the "Record a Sale" option when viewing product details in the Inventory page
- Sales recording functionality remains available through the dedicated Record Sale page (`/record-sale`)
