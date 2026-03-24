INSERT INTO storage.buckets (id, name, public)
VALUES ('store_images', 'store_images', true)
ON CONFLICT (id) DO NOTHING;