-- Update RLS policies to include workspace filtering

-- Update giveaways table policies
DROP POLICY IF EXISTS "Agents can view their own giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Supervisors can view all giveaways" ON public.giveaways;

CREATE POLICY "Agents can view their own giveaways in their workspaces"
ON public.giveaways
FOR SELECT
USING (
  agent_id = auth.uid() 
  AND NOT is_deleted
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Supervisors can view giveaways in their workspaces"
ON public.giveaways
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
  AND NOT is_deleted
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

-- Update agent_actions table policies
DROP POLICY IF EXISTS "Agents can view their own actions" ON public.agent_actions;
DROP POLICY IF EXISTS "Supervisors can view all actions" ON public.agent_actions;

CREATE POLICY "Agents can view their own actions in their workspaces"
ON public.agent_actions
FOR SELECT
USING (
  agent_id = auth.uid()
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Supervisors can view actions in their workspaces"
ON public.agent_actions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

-- Update sales table policies (if they exist)
DROP POLICY IF EXISTS "Agents can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Supervisors can view all sales" ON public.sales;

CREATE POLICY "Agents can view their own sales in their workspaces"
ON public.sales
FOR SELECT
USING (
  agent_id = auth.uid()
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Supervisors can view sales in their workspaces"
ON public.sales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

-- Update inventory_transactions table policies
DROP POLICY IF EXISTS "Agents can view their own inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Supervisors can view all inventory transactions" ON public.inventory_transactions;

CREATE POLICY "Agents can view their own inventory transactions in their workspaces"
ON public.inventory_transactions
FOR SELECT
USING (
  agent_id = auth.uid()
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Supervisors can view inventory transactions in their workspaces"
ON public.inventory_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

-- Update products table policies
DROP POLICY IF EXISTS "Agents can view all products" ON public.products;
DROP POLICY IF EXISTS "Supervisors can manage products" ON public.products;

CREATE POLICY "Agents can view products in their workspaces"
ON public.products
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Supervisors can manage products in their workspaces"
ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);
