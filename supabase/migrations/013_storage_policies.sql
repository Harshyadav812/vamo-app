-- Set up Storage policies for the project_images bucket
-- We assume the bucket has already been manually created via dashboard 
-- as requested, so we're just adding the RLS policies here.

-- 1. Allow public access to currently stored files
CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'project_images');

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'project_images');

-- 3. Allow users to update their own files (optional, but good practice)
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project_images' AND auth.uid() = owner);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project_images' AND auth.uid() = owner);
