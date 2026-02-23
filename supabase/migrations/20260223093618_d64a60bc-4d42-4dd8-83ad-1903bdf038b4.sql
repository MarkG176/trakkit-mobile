
-- Add image_url and location columns to supervisor_messages
ALTER TABLE public.supervisor_messages 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS location_lat numeric,
ADD COLUMN IF NOT EXISTS location_lng numeric,
ADD COLUMN IF NOT EXISTS location_label text;

-- Drop and recreate the INSERT policy to also allow agents to send messages
DROP POLICY IF EXISTS "Supervisors can send messages" ON public.supervisor_messages;
CREATE POLICY "Authenticated users can send messages"
ON public.supervisor_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Allow agents to also view messages they sent
CREATE POLICY "Senders can view their sent messages"
ON public.supervisor_messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() AND NOT is_deleted);
