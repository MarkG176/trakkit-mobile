-- Create Capwell workspace
INSERT INTO public.workspaces (id, name, description, created_at, updated_at)
VALUES (
  'capwell-workspace-id',
  'Capwell',
  'Capwell instore activation project workspace',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create Capwell instore activation project
INSERT INTO public.projects (
  id,
  name,
  start_date,
  target_areas,
  workspace_id,
  created_at,
  updated_at
)
VALUES (
  'capwell-project-id',
  'Capwell Instore Activation',
  '2024-01-01',
  ARRAY['Nairobi', 'Mombasa', 'Kisumu'],
  'capwell-workspace-id',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create some sample stores for Capwell project
INSERT INTO public.stores (id, store_name, county, store_lat, store_long, products, created_at, updated_at)
VALUES 
  (
    'capwell-store-1',
    'Capwell Langata',
    'Nairobi',
    -1.32415,
    36.78283,
    '[]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'capwell-store-2',
    'Capwell Westlands',
    'Nairobi',
    -1.2654,
    36.8056,
    '[]'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'capwell-store-3',
    'Capwell Mombasa',
    'Mombasa',
    -4.0435,
    39.6682,
    '[]'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create some sample products for Capwell
INSERT INTO public.products (
  id,
  name,
  category,
  description,
  workspace_id,
  created_at
)
VALUES 
  (
    'capwell-product-1',
    'Capwell Detergent',
    'Cleaning',
    'Premium laundry detergent',
    'capwell-workspace-id',
    NOW()
  ),
  (
    'capwell-product-2',
    'Capwell Fabric Softener',
    'Cleaning',
    'Fabric conditioner',
    'capwell-workspace-id',
    NOW()
  ),
  (
    'capwell-product-3',
    'Capwell Dish Soap',
    'Cleaning',
    'Dishwashing liquid',
    'capwell-workspace-id',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Create product variants for Capwell products
INSERT INTO public.product_variants (
  id,
  name,
  price,
  product_id,
  sku,
  created_at
)
VALUES 
  (
    'capwell-variant-1',
    'Capwell Detergent 500ml',
    450.00,
    'capwell-product-1',
    'CAP-DET-500',
    NOW()
  ),
  (
    'capwell-variant-2',
    'Capwell Detergent 1L',
    850.00,
    'capwell-product-1',
    'CAP-DET-1000',
    NOW()
  ),
  (
    'capwell-variant-3',
    'Capwell Fabric Softener 500ml',
    350.00,
    'capwell-product-2',
    'CAP-FS-500',
    NOW()
  ),
  (
    'capwell-variant-4',
    'Capwell Dish Soap 250ml',
    120.00,
    'capwell-product-3',
    'CAP-DS-250',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Update stores to include Capwell products
UPDATE public.stores 
SET products = '["capwell-variant-1", "capwell-variant-2", "capwell-variant-3", "capwell-variant-4"]'::jsonb
WHERE id IN ('capwell-store-1', 'capwell-store-2', 'capwell-store-3');

-- Create sample survey templates for Capwell
INSERT INTO public.survey_templates (
  id,
  title,
  description,
  questions,
  target_department,
  status,
  version,
  workspace_id,
  created_at,
  updated_at
)
VALUES (
  'capwell-survey-1',
  'Capwell Customer Satisfaction Survey',
  'Survey to measure customer satisfaction with Capwell products',
  '[
    {
      "id": "q1",
      "type": "rating",
      "question": "How satisfied are you with Capwell products?",
      "required": true,
      "options": ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"]
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "Which Capwell product do you use most?",
      "required": true,
      "options": ["Detergent", "Fabric Softener", "Dish Soap", "All of them"]
    },
    {
      "id": "q3",
      "type": "text",
      "question": "Any additional feedback about Capwell products?",
      "required": false
    }
  ]'::jsonb,
  'Customer Service',
  'active',
  1,
  'capwell-workspace-id',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample routes for Capwell project
INSERT INTO public.routes (
  id,
  route_name,
  project_id,
  status,
  workspace_id,
  created_at,
  updated_at
)
VALUES 
  (
    'capwell-route-1',
    'Nairobi Central Route',
    'capwell-project-id',
    'active',
    'capwell-workspace-id',
    NOW(),
    NOW()
  ),
  (
    'capwell-route-2',
    'Mombasa Coastal Route',
    'capwell-project-id',
    'active',
    'capwell-workspace-id',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Add comment explaining the setup
COMMENT ON TABLE public.workspaces IS 'Contains workspace data including Capwell workspace for instore activation project';
COMMENT ON TABLE public.projects IS 'Contains project data including Capwell instore activation project';
