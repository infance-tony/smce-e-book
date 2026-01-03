
-- Create RLS policies for the ebooks storage bucket to allow file uploads
-- This will fix the "403 Unauthorized" error when uploading books from admin panel

-- Policy to allow anyone to upload files to the ebooks bucket
CREATE POLICY "Allow uploads to ebooks bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ebooks');

-- Policy to allow anyone to view files in the ebooks bucket
CREATE POLICY "Allow viewing ebooks bucket files" ON storage.objects
FOR SELECT USING (bucket_id = 'ebooks');

-- Policy to allow updates to files in the ebooks bucket
CREATE POLICY "Allow updates to ebooks bucket files" ON storage.objects
FOR UPDATE USING (bucket_id = 'ebooks');

-- Policy to allow deletion of files in the ebooks bucket (for admin cleanup)
CREATE POLICY "Allow deletion from ebooks bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'ebooks');
