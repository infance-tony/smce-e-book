-- ================================================================
-- Make ALL columns nullable except id and user_id
-- Run this in Supabase SQL Editor
-- ================================================================

-- Make all these columns nullable
ALTER TABLE public.profiles ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN avatar_url DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN is_active DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN academic_year DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN updated_at DROP NOT NULL;

SELECT '✅ All columns are now nullable - Try creating user!' as status;
