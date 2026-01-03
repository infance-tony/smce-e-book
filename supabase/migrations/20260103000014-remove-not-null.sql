-- ================================================================
-- REAL FIX - Make student_id nullable
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Remove NOT NULL constraint from student_id
ALTER TABLE public.profiles 
ALTER COLUMN student_id DROP NOT NULL;

-- 2. Recreate trigger function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name text;
BEGIN
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );
  
  INSERT INTO public.profiles (
    id, user_id, student_id, full_name, is_active, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), NEW.id, NULL, user_full_name, true, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Set owner to postgres
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 4. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ FIXED - student_id is now nullable. Try creating user!' as status;
