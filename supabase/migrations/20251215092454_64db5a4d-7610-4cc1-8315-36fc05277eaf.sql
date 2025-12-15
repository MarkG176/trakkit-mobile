-- Add store_id column to giveaways table to link giveaways to stores
ALTER TABLE public.giveaways 
ADD COLUMN store_id uuid REFERENCES public.stores(id);