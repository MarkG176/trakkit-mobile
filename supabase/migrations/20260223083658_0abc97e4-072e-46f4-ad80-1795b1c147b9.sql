
-- Add is_deleted column for soft delete
ALTER TABLE public.support_tickets ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;

-- Allow agents and supervisors to update (for soft delete)
CREATE POLICY "Agents can update their own tickets"
ON public.support_tickets
FOR UPDATE
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Supervisors can update workspace tickets"
ON public.support_tickets
FOR UPDATE
USING (workspace_id = get_user_workspace_id() AND is_supervisor());
