
-- 1. Drop deprecated table
DROP TABLE IF EXISTS public.agent_battery_status CASCADE;

-- 2. Deduplicate then add unique constraint on agent_device_status.agent_id
DELETE FROM public.agent_device_status a
USING public.agent_device_status b
WHERE a.ctid < b.ctid
  AND a.agent_id = b.agent_id;

ALTER TABLE public.agent_device_status
  ADD CONSTRAINT agent_device_status_agent_id_key UNIQUE (agent_id);

-- 3. device_push_tokens table
CREATE TABLE public.device_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, expo_push_token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_push_tokens TO authenticated;
GRANT ALL ON public.device_push_tokens TO service_role;

CREATE INDEX idx_device_push_tokens_agent_id ON public.device_push_tokens(agent_id);

CREATE TRIGGER set_device_push_tokens_updated_at
  BEFORE UPDATE ON public.device_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Trigger helper: invoke send-push edge function via pg_net
CREATE OR REPLACE FUNCTION public.notify_push_supervisor_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text;
BEGIN
  fn_url := 'https://skafzkzjaszxgqryzhjp.supabase.co/functions/v1/send-push';
  PERFORM net.http_post(
    url := fn_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'agent_id', NEW.recipient_id,
      'title', 'New message from supervisor',
      'body', COALESCE(LEFT(NEW.message, 120), 'You have a new message'),
      'data', jsonb_build_object('type', 'supervisor_message', 'id', NEW.id)
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_push_supervisor_message failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_push_supervisor_message
  AFTER INSERT ON public.supervisor_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_push_supervisor_message();

CREATE OR REPLACE FUNCTION public.notify_push_support_ticket_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    fn_url := 'https://skafzkzjaszxgqryzhjp.supabase.co/functions/v1/send-push';
    PERFORM net.http_post(
      url := fn_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'agent_id', NEW.agent_id,
        'title', 'Support ticket updated',
        'body', 'Your ticket status is now: ' || NEW.status,
        'data', jsonb_build_object('type', 'support_ticket', 'id', NEW.id, 'status', NEW.status)
      )
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_push_support_ticket_status failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_push_support_ticket_status
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_push_support_ticket_status();
