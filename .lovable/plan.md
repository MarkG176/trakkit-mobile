

## Filter Inventory Page by Workspace

**What this changes:**
The Inventory page currently shows all inventory items assigned to the logged-in agent, regardless of which workspace is selected. After this change, it will only show items belonging to the currently selected workspace.

**How it works:**
The `agent_task_inventory` table does not have a `workspace_id` column, but its linked `product_variants` table does. So we filter by matching `product_variants.workspace_id` to the current workspace.

---

### Technical Details

**File: `src/hooks/useInventory.tsx`**

1. Import `useWorkspace` hook to get `currentWorkspaceId`
2. Add a `.eq('product_variants.workspace_id', currentWorkspaceId)` filter to the existing query (since the query already joins `product_variants`)
3. Add `currentWorkspaceId` to the `useEffect` dependency array so inventory refreshes when the user switches workspaces
4. Skip fetching if `currentWorkspaceId` is not set (similar to the existing `user` check)

This follows the same workspace-filtering pattern used in `useProducts` and other hooks throughout the app.

