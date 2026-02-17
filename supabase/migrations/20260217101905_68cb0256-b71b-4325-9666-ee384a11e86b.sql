
-- Backfill project_id in customer_purchases from agent's team assignment
UPDATE customer_purchases cp
SET project_id = t.project_id
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
WHERE cp.agent_id = tm.agent_id
  AND cp.project_id IS NULL
  AND t.project_id IS NOT NULL;
