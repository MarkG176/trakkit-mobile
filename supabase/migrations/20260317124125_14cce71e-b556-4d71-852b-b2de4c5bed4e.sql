-- Cleanup previously auto-authorized test signup created before trigger hardening
DELETE FROM public.user_roles
WHERE lower(email) = lower('Projectest105003@gmail');