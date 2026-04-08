

## Fix: Populate Store Country from Project on Creation

### Problem
When a store is created via the "Add New Location" form on the Routes page, the `country` field is not included in the insert payload. The project's country is already fetched and available as `projectCountry`, but it's never passed to the database insert. This causes stores like "Carrefour Valley Arcade" to have `country: null`, which then breaks the country-based filtering in the store selection dropdown.

### Solution

**1. Add `country` to the store insert in `src/pages/Routes.tsx` (~line 245-253)**

Add `country: projectCountry` to the insert object:

```tsx
.insert({
  store_name: newStoreName.trim(),
  county: newStoreCounty.trim(),
  store_lat: currentLocation.latitude,
  store_long: currentLocation.longitude,
  contact: newStoreContact.trim() || null,
  added_by: user?.id || null,
  workspace_id: currentWorkspaceId,
  country: projectCountry,   // <-- add this line
})
```

**2. Backfill existing stores with null country**

Run a data update to set the country for all existing stores that have `country IS NULL`, based on the active project's country in their workspace:

```sql
UPDATE stores s
SET country = pp.country
FROM project_plans pp
WHERE pp.workspace_id = s.workspace_id
  AND pp.status = 'active'
  AND pp.is_deleted = false
  AND s.country IS NULL
  AND pp.country IS NOT NULL;
```

This is a one-time data fix (via the insert/update tool) plus a one-line code change. No schema migrations needed.

