-- Add fields to user_roles table for agent management
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS role_title TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_rating ON public.user_roles(rating DESC);