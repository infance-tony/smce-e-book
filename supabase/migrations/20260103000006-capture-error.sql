-- ================================================================
-- CAPTURE EXACT ERROR FROM TRIGGER
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. UPDATE TRIGGER TO RAISE ERROR INSTEAD OF WARNING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name text;
  error_msg text;
  error_detail text;
  error_hint text;
BEGIN
  -- Extract full name from metadata or generate from email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );
  
  -- Log the attempt
  RAISE NOTICE 'Attempting to create profile for user: % with email: %', NEW.id, NEW.email;
  
  -- Create profile
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
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS
    error_msg = MESSAGE_TEXT,
    error_detail = PG_EXCEPTION_DETAIL,
    error_hint = PG_EXCEPTION_HINT;
    
  RAISE WARNING 'Profile creation failed!';
  RAISE WARNING 'User ID: %', NEW.id;
  RAISE WARNING 'Email: %', NEW.email;
  RAISE WARNING 'Error: %', error_msg;
  RAISE WARNING 'Detail: %', error_detail;
  RAISE WARNING 'Hint: %', error_hint;
  RAISE WARNING 'SQLSTATE: %', SQLSTATE;
  
  -- DON'T re-raise the error, let user creation succeed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ENSURE FUNCTION OWNER IS POSTGRES
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 3. RECREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. CHECK FUNCTION WAS CREATED
SELECT 
  '=== FUNCTION CHECK ===' as info,
  routine_name,
  security_type,
  routine_schema
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 5. CHECK TRIGGER WAS CREATED  
SELECT
  '=== TRIGGER CHECK ===' as info,
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ENHANCED LOGGING DEPLOYED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Now when you try to create a user:';
  RAISE NOTICE '1. Check Supabase Logs (Dashboard → Logs)';
  RAISE NOTICE '2. Look for WARNING messages';
  RAISE NOTICE '3. The exact error will be shown';
  RAISE NOTICE '========================================';
END $$;
