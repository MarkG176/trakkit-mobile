WITH exploded AS (
  SELECT pp.id AS plan_id,
         pp.workspace_id,
         TRIM(v.variant_name) AS variant_name
  FROM public.project_plans pp
  CROSS JOIN LATERAL unnest(string_to_array(pp.product_focus, ',')) AS v(variant_name)
  WHERE pp.product_focus IS NOT NULL AND pp.product_focus <> ''
),
matched AS (
  SELECT DISTINCT e.plan_id, p.name AS product_name
  FROM exploded e
  JOIN public.product_variants pv
    ON pv.workspace_id = e.workspace_id
   AND TRIM(pv.name) = e.variant_name
  JOIN public.products p
    ON p.id = pv.product_id
),
aggregated AS (
  SELECT plan_id, string_agg(DISTINCT TRIM(product_name), ', ' ORDER BY TRIM(product_name)) AS new_focus
  FROM matched
  GROUP BY plan_id
)
UPDATE public.project_plans pp
SET product_focus = a.new_focus
FROM aggregated a
WHERE pp.id = a.plan_id
  AND a.new_focus IS NOT NULL
  AND a.new_focus <> ''
  AND pp.product_focus IS DISTINCT FROM a.new_focus;