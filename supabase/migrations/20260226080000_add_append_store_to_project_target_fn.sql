-- Create a function to safely append a store UUID to project_plans.target_stores (uuid[]).
-- Using array_append avoids the "COALESCE types uuid and jsonb cannot be matched" error
-- that occurs when PostgREST tries to update a uuid[] column with a JSON array value.
CREATE OR REPLACE FUNCTION public.append_store_to_project_target(
  p_project_id uuid,
  p_store_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.project_plans
  SET target_stores = array_append(COALESCE(target_stores, ARRAY[]::uuid[]), p_store_id)
  WHERE id = p_project_id
    AND (target_stores IS NULL OR NOT (target_stores @> ARRAY[p_store_id]));
END;
$$;
