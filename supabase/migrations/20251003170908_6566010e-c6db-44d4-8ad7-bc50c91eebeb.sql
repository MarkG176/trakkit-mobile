-- Fix storage policies for agent-selfies bucket
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Agents can upload their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view their own selfies" ON storage.objects;

-- Create proper policies for agent-selfies bucket
CREATE POLICY "Allow authenticated users to upload selfies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-selfies');

CREATE POLICY "Allow authenticated users to read selfies"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'agent-selfies');

CREATE POLICY "Allow users to update their own selfies"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'agent-selfies' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'agent-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own selfies"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'agent-selfies' AND auth.uid()::text = (storage.foldername(name))[1]);