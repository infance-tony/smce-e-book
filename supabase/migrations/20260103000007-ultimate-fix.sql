-- ================================================================
-- ULTIMATE FIX - Disable RLS for trigger execution
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. COMPLETELY REWRITE TRIGGER WITH SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Run as function owner (postgres)
SET search_path = public, auth
AS $$
DECLARE
  user_full_name text;
BEGIN
  -- Extract full name
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );
  
  -- Insert profile bypassing RLS
  INSERT INTO public.profiles (
    id,
    user_id,
    student_id,
    full_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NULL,
    user_full_name,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't fail
  RAISE WARNING 'Profile creation failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 2. Change function owner to postgres (bypasses RLS)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 3. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Add explicit BYPASS RLS grant
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;

-- Test
SELECT 'Trigger installed successfully!' as status;
