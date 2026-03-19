
-- Create the sale-recordings storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sale-recordings', 'sale-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload recordings
CREATE POLICY "Authenticated users can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sale-recordings');

-- Allow authenticated users to read recordings
CREATE POLICY "Authenticated users can read recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'sale-recordings');

-- Allow users to delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sale-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
