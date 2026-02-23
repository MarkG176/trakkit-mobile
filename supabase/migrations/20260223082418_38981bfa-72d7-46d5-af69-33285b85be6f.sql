
-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  agent_name TEXT,
  agent_email TEXT,
  workspace_id UUID REFERENCES public.workspaces(id),
  project_id UUID,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('bug_support', 'inventory_request', 'missing_stats')),
  inventory_issue_type TEXT CHECK (inventory_issue_type IN ('missing_inventory', 'incorrect_inventory_details')),
  message TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auto-populate agent name/email on insert
CREATE OR REPLACE FUNCTION public.populate_support_ticket_agent_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT COALESCE(display_name, email, 'Unknown Agent'), email
  INTO NEW.agent_name, NEW.agent_email
  FROM public.user_roles
  WHERE user_id = NEW.agent_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER populate_support_ticket_agent
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_support_ticket_agent_info();

-- Auto-update updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
