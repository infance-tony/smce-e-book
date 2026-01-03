
-- Create the increment_download_count function
CREATE OR REPLACE FUNCTION public.increment_download_count(ebook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ebooks 
  SET download_count = COALESCE(download_count, 0) + 1 
  WHERE id = ebook_id;
END;
$$;
