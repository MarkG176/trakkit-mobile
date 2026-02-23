
-- Create supervisor_messages table for direct supervisor-to-agent messaging
CREATE TABLE public.supervisor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_name TEXT,
  recipient_id UUID NOT NULL,
  message TEXT NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supervisor_messages ENABLE ROW LEVEL SECURITY;

-- Supervisors can insert messages
CREATE POLICY "Supervisors can send messages"
ON public.supervisor_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid() AND is_supervisor());

-- Supervisors can view messages they sent
CREATE POLICY "Supervisors can view sent messages"
ON public.supervisor_messages
FOR SELECT
USING (sender_id = auth.uid() AND NOT is_deleted);

-- Agents can view messages sent to them
CREATE POLICY "Agents can view their messages"
ON public.supervisor_messages
FOR SELECT
USING (recipient_id = auth.uid() AND NOT is_deleted);

-- Agents can update their own messages (mark as read)
CREATE POLICY "Agents can update their messages"
ON public.supervisor_messages
FOR UPDATE
USING (recipient_id = auth.uid());

-- Supervisors can update messages they sent (soft delete)
CREATE POLICY "Supervisors can update sent messages"
ON public.supervisor_messages
FOR UPDATE
USING (sender_id = auth.uid());

-- Create index for efficient lookups
CREATE INDEX idx_supervisor_messages_recipient ON public.supervisor_messages(recipient_id, is_deleted, created_at DESC);
CREATE INDEX idx_supervisor_messages_workspace ON public.supervisor_messages(workspace_id, is_deleted);
