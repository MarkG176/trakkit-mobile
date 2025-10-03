-- Add in_range column to agent_status_log
ALTER TABLE agent_status_log 
ADD COLUMN in_range boolean DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN agent_status_log.in_range IS 'Indicates if agent is within 100m of assigned location. NULL if no assigned location.';