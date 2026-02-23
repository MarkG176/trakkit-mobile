

## Fix: Supervisor Inbox "Send Message" Button Stays Greyed Out

### Root Cause

The recipient selector uses a **Popover** component inside a **Dialog**. Both components render via portals (rendered outside the DOM tree into `document.body`). The Dialog's overlay intercepts all clicks, preventing the Popover dropdown from being clickable. This means:

1. User clicks "Select agent..." -- the Popover opens
2. The Popover content renders in a portal, but the Dialog's modal overlay sits on top
3. Clicking any agent in the dropdown is blocked by the overlay
4. `selectedRecipient` stays `null`, so the Send button remains disabled

### Solution

Replace the Popover-based recipient selector with a simple inline dropdown that renders within the Dialog's DOM tree (no portal). This avoids z-index/portal conflicts entirely.

### Technical Changes

**File: `src/pages/supervisor/InboxPage.tsx`**

- Remove the `Popover`, `PopoverTrigger`, and `PopoverContent` imports (if unused elsewhere in the file)
- Replace the Popover-based recipient selector (lines 352-388) with a simple inline expandable div:
  - A button toggles `recipientOpen` state
  - When open, render a bordered div below the button containing the search input and member list
  - Clicking a member sets `selectedRecipient` and closes the list
- This keeps all elements within the Dialog's DOM, avoiding portal stacking issues

No database changes needed. No new dependencies required.

