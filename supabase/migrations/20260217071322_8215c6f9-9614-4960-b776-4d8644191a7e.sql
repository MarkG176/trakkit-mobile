-- Backfill store_id on set_location entries by matching to closest store based on assigned coordinates
UPDATE public.agent_status_log asl
SET store_id = closest.store_id
FROM (
  SELECT DISTINCT ON (asl2.id)
    asl2.id AS log_id,
    s.id AS store_id
  FROM public.agent_status_log asl2
  JOIN public.stores s
    ON s.store_lat IS NOT NULL AND s.store_long IS NOT NULL
  WHERE asl2.status = 'set_location'
    AND asl2.store_id IS NULL
    AND asl2.assigned_location_lat IS NOT NULL
    AND asl2.assigned_location_lng IS NOT NULL
  ORDER BY asl2.id,
    (asl2.assigned_location_lat - s.store_lat)^2 + (asl2.assigned_location_lng - s.store_long)^2
) closest
WHERE asl.id = closest.log_id;