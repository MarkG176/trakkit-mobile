

## Supervisor Bottom Nav Redesign

### What changes
The supervisor bottom navigation will be updated to show exactly 4 items in this order:

1. **Dashboard** (Home icon) -> `/supervisor`
2. **Users** (Users icon) -> `/supervisor/users`
3. **Inbox** (Inbox icon) -> `/supervisor/inbox`
4. **Stats** (BarChart3 icon) -> `/supervisor/stats` (new page)

Sales, Rankings, and Settings items will be removed from the nav.

### New Stats Page
A new `StatsPage` will be created at `src/pages/supervisor/StatsPage.tsx` that consolidates key supervisor statistics. This page will include:
- Sales summary data (previously accessed via the Sales nav item)
- Rankings/leaderboard data (previously accessed via the Rankings nav item)
- The page will use the `SupervisorBottomNav` and follow the same layout patterns as other supervisor pages

### Technical Details

**Files to modify:**
- `src/components/supervisor/SupervisorBottomNav.tsx` -- Replace the `navItems` array with the 4 items listed above, using `BarChart3` icon for Stats
- `src/App.tsx` -- Add route for `/supervisor/stats` pointing to the new `StatsPage`

**Files to create:**
- `src/pages/supervisor/StatsPage.tsx` -- New page combining sales overview and rankings into a single stats view with tabs

