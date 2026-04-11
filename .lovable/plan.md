

# Plan: Supervisor Dashboard Activity Feed + Agent Check-In Map Page

## Overview

Two features modeled after the [trakkit](/projects/7ac695e3-6f2f-451a-9e85-19427476fa9e) project:

1. **Replace the current supervisor dashboard notification-only log** with a proper agent_status_log activity feed (date-filtered, paginated, with selfie gallery) similar to trakkit's AgentActivityPage.
2. **Add a new "Map" page** to the supervisor navigation showing all agent check-in locations on a Google Map, similar to trakkit's FieldPage (Agents filter mode).

---

## Part 1: Supervisor Dashboard Activity Feed

**Current state**: The dashboard only shows real-time notifications (ephemeral, cleared on refresh). No historical data from `agent_status_log` is displayed.

**Changes**:

### New hook: `src/hooks/useAgentActivity.tsx`
- `useAgentActivities(workspaceId, page, filterDate)` — queries `agent_status_log` for a given date, paginated (50 per page), ordered by timestamp desc. Returns agent name, status, location coords, selfie_url.
- `useGalleryImages(workspaceId, sortOrder, filterDate)` — queries selfie_url from `agent_status_log` for the date, deduped.
- `useMostRecentActivityDate(workspaceId)` — finds the most recent log entry date.

### Modify: `src/pages/SupervisorDashboard.tsx`
- Add a date picker (Calendar popover) defaulting to most recent activity date.
- Replace the current notification-only card list with a two-section layout:
  - **Activity Feed**: Scrollable list of `agent_status_log` entries for the selected date, with agent avatar/initials, status badge, timestamp, location coords, and selfie indicator. Paginated with Previous/Next buttons.
  - **Selfie Gallery**: Grid of check-in selfie thumbnails for the date, clickable to view full size.
- Keep real-time subscriptions to add new entries to the feed when viewing "today".
- Add a search input to filter by agent name.

### Modify: `src/components/supervisor/ActivityCard.tsx`
- Extend to support displaying selfie thumbnails inline and location coordinates.

---

## Part 2: Agent Check-In Map Page

### Install dependency
- `@react-google-maps/api` — React wrapper for Google Maps.

### New page: `src/pages/supervisor/MapPage.tsx`
- Google Map centered on Nairobi (default) showing agent check-in locations from `agent_status_log`.
- Date range filter (start/end date pickers + Today/This Week/This Month shortcuts).
- Fetches check-in data from `agent_status_log` filtered by workspace and date range, showing the **latest location per agent**.
- Markers with agent name labels; clicking opens an InfoWindow with agent name, status, timestamp.
- Auto-fits map bounds to markers.
- Google Maps API key fetched from `VITE_GOOGLE_MAPS_API_KEY` env variable (already used in the project).

### Modify: `src/components/supervisor/SupervisorBottomNav.tsx`
- Add a "Map" nav item with a `MapPin` icon linking to `/supervisor/map`.

### Modify: `src/App.tsx`
- Add route `/supervisor/map` wrapped in `RoleBasedRoute` for supervisors.

---

## Technical Details

- The `agent_status_log` table already has RLS policies allowing supervisors to view all logs.
- Fields used: `agent_id`, `agent_display_name`, `status`, `timestamp`, `location_lat`, `location_lng`, `selfie_url`, `workspace_id`.
- The map page will use the same Google Maps API key pattern already established in `src/services/googleMapsService.ts` (`VITE_GOOGLE_MAPS_API_KEY`).
- No database migrations needed — all data is already in `agent_status_log`.

