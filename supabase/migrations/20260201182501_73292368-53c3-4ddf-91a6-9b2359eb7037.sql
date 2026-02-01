-- Create storage bucket for sale photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('sale-photos', 'sale-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for sale-photos bucket
CREATE POLICY "Authenticated users can upload sale photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sale-photos');

CREATE POLICY "Sale photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sale-photos');

CREATE POLICY "Users can update their own sale photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sale-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own sale photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sale-photos' AND auth.uid()::text = (storage.foldername(name))[1]);