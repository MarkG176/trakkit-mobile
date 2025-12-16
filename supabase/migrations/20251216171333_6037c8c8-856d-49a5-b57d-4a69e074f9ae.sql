-- Add agent_id column to interactions table
ALTER TABLE interactions 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id);

-- Create index for agent_id on interactions
CREATE INDEX IF NOT EXISTS idx_interactions_agent_id ON interactions(agent_id);

-- Add agent_id column to sale_items table
ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id);

-- Create index for agent_id on sale_items
CREATE INDEX IF NOT EXISTS idx_sale_items_agent_id ON sale_items(agent_id);

-- Backfill interactions from survey_responses
UPDATE interactions i
SET agent_id = sr.agent_id
FROM survey_responses sr
WHERE sr.interaction_id = i.id AND i.agent_id IS NULL;

-- Backfill interactions from agent_tasks
UPDATE interactions i
SET agent_id = at.agent_id
FROM agent_tasks at
WHERE at.id = i.task_id AND i.agent_id IS NULL;

-- Backfill interactions from inventory_transactions (for sales)
UPDATE interactions i
SET agent_id = it.agent_id
FROM inventory_transactions it
WHERE i.product_variant_id = it.product_id 
  AND i.interaction_type = 'sale'
  AND i.agent_id IS NULL
  AND it.type = 'sale'
  AND DATE(i.created_at) = DATE(it.created_at);

-- Backfill sale_items from interactions
UPDATE sale_items si
SET agent_id = i.agent_id
FROM interactions i
WHERE i.product_variant_id = si.product_variant_id
  AND DATE(i.created_at) = DATE(si.created_at)
  AND si.agent_id IS NULL;

-- Update the sync_sale_to_sale_items trigger function to include agent_id
CREATE OR REPLACE FUNCTION public.sync_sale_to_sale_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
            NEW.created_at
        );
    END IF;
    
    RETURN NEW;
END;
$function$;