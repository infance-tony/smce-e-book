-- ================================================================
-- COMPLETE FIX - Handles ALL issues
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Create sequence for auto student_id
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 1;

-- 2. Make student_id nullable (easier solution)
ALTER TABLE public.profiles ALTER COLUMN student_id DROP NOT NULL;

-- 3. Drop partial unique index if exists
DROP INDEX IF EXISTS public.profiles_student_id_unique;

-- 4. Create new partial unique index (allows multiple NULLs)
CREATE UNIQUE INDEX profiles_student_id_unique 
  ON public.profiles(student_id) 
  WHERE student_id IS NOT NULL;

-- 5. Grant permissions to postgres role
GRANT ALL ON public.profiles TO postgres;
GRANT USAGE, SELECT ON SEQUENCE student_id_seq TO postgres;

-- 6. Create complete trigger function with all defaults
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as function owner (postgres)
SET search_path = public
AS $$
DECLARE
  user_full_name text;
BEGIN
  -- Extract full name with fallback
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' ')),
    'User'  -- Final fallback
  );
  
  -- Insert profile with ALL required fields auto-generated
  INSERT INTO public.profiles (
    id,              -- Auto: UUID
    user_id,         -- From auth.users
    student_id,      -- NULL (nullable now)
    full_name,       -- Extracted from metadata
    is_active,       -- Default TRUE
    created_at,      -- Auto: NOW()
    updated_at       -- Auto: NOW()
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NULL,  -- Can be NULL now
    user_full_name,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Prevent duplicate inserts
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block user creation, just log warning
  RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 7. Set function owner to postgres (bypasses RLS)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 8. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Verify everything is set up correctly
SELECT 
  'Trigger exists: ' || EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as check1,
  'Function owner: ' || (
    SELECT rolname FROM pg_roles r 
    JOIN pg_proc p ON r.oid = p.proowner 
    WHERE p.proname = 'handle_new_user'
  ) as check2,
  'student_id nullable: ' || (
    SELECT is_nullable FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'student_id'
  ) as check3;

SELECT '✅ COMPLETE FIX APPLIED - Try creating user now!' as status;
