
CREATE OR REPLACE FUNCTION public.sync_sale_to_sale_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_product_name TEXT;
    v_variant_name TEXT;
    v_category TEXT;
    v_unit_price NUMERIC;
BEGIN
    -- Only process sale interactions
    IF NEW.interaction_type = 'sale' AND NEW.product_variant_id IS NOT NULL THEN
        -- Get product details
        SELECT 
            p.name,
            pv.name,
            p.category,
            pv.price
        INTO v_product_name, v_variant_name, v_category, v_unit_price
        FROM product_variants pv
        LEFT JOIN products p ON p.id = pv.product_id
        WHERE pv.id = NEW.product_variant_id;

        -- Insert into sale_items
        INSERT INTO sale_items (
            sale_id,
            product_variant_id,
            product_name,
            variant_name,
            category,
            quantity,
            unit_price,
            total_price,
            workspace_id,
            agent_id,
            store_id,
            created_at
        ) VALUES (
            NEW.id,
            NEW.product_variant_id,
            COALESCE(v_product_name, 'Unknown Product'),
            COALESCE(v_variant_name, 'Unknown Variant'),
            v_category,
            COALESCE(NEW.quantity_sold, 1),
            COALESCE(v_unit_price, 0),
            COALESCE(NEW.sale_value, v_unit_price * COALESCE(NEW.quantity_sold, 1), 0),
            NEW.workspace_id,
            NEW.agent_id,
            NEW.store_id,
            NEW.created_at
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Backfill existing sale_items with store_id from interactions
UPDATE public.sale_items si
SET store_id = i.store_id
FROM public.interactions i
WHERE si.sale_id = i.id
  AND si.store_id IS NULL
  AND i.store_id IS NOT NULL;
