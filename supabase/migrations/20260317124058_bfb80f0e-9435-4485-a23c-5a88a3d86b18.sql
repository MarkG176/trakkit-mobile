-- Security hardening: do not auto-provision user_roles on auth signup.
-- Access must come from explicit provisioning flows (e.g., create-user edge function).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Intentionally no-op: prevents self-signup OAuth users from being auto-authorized.
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Never block auth user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$function$;