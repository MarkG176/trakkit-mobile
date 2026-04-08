UPDATE stores s
SET country = pp.country
FROM project_plans pp
WHERE pp.workspace_id = s.workspace_id
  AND pp.status = 'active'
  AND (pp.is_deleted = false OR pp.is_deleted IS NULL)
  AND s.country IS NULL
  AND pp.country IS NOT NULL;