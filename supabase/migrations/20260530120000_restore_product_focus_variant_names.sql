-- Reverse 20260530062108: restore product_focus tokens as product_variants.name
-- instead of aggregated products.name values.
WITH exploded AS (
  SELECT pp.id AS plan_id,
         pp.workspace_id,
         TRIM(v.product_name) AS product_name
  FROM public.project_plans pp
  CROSS JOIN LATERAL unnest(string_to_array(pp.product_focus, ',')) AS v(product_name)
  WHERE pp.product_focus IS NOT NULL AND pp.product_focus <> ''
),
matched AS (
  SELECT DISTINCT e.plan_id, TRIM(pv.name) AS variant_name
  FROM exploded e
  JOIN public.products p
    ON TRIM(p.name) = e.product_name
  JOIN public.product_variants pv
    ON pv.product_id = p.id
   AND pv.workspace_id = e.workspace_id
),
aggregated AS (
  SELECT plan_id, string_agg(DISTINCT TRIM(variant_name), ', ' ORDER BY TRIM(variant_name)) AS new_focus
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
