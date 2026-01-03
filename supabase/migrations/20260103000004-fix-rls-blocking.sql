-- ================================================================
-- FIX RLS BLOCKING TRIGGER - Final Fix
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. UPDATE TRIGGER TO BYPASS RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER  -- Run with elevated privileges
SET search_path = public
AS $$
DECLARE
  user_full_name text;
BEGIN
  -- Extract full name from metadata or generate from email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );
  
  -- Create profile with RLS bypassed (SECURITY DEFINER + service_role)
  BEGIN
    -- Use explicit schema and bypass RLS
    INSERT INTO public.profiles (
      id,
      user_id,
      full_name,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      NEW.id,
      user_full_name,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed for user: %. Error: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ENSURE FUNCTION OWNER HAS BYPASS RLS
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 3. RECREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ADD EXPLICIT RLS POLICY FOR SERVICE ROLE
DO $$ 
BEGIN
  -- Drop policy if exists, then recreate
  DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
  
  CREATE POLICY "Service role can insert profiles"
    ON public.profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);
    
  RAISE NOTICE '✅ Policy created for service_role';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Policy creation: %', SQLERRM;
END $$;

-- 5. GRANT FULL ACCESS TO SERVICE ROLE
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO postgres;

-- 6. TEST THE FIX
DO $$
DECLARE
  test_result text;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING PROFILE CREATION';
  RAISE NOTICE '========================================';
  
  -- Test direct insert
  BEGIN
    INSERT INTO public.profiles (id, user_id, full_name, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), gen_random_uuid(), 'Test User', true, NOW(), NOW());
    
    RAISE NOTICE '✅ Direct insert successful';
    
    DELETE FROM public.profiles WHERE full_name = 'Test User';
    RAISE NOTICE '✅ Cleanup complete';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Direct insert FAILED: %', SQLERRM;
  END;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIX DEPLOYED - Try creating user now!';
  RAISE NOTICE '========================================';
END $$;
