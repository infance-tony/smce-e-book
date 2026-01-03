-- ================================================================
-- FIX STUDENT_ID UNIQUE CONSTRAINT ISSUE - Final Solution
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. DROP THE PROBLEMATIC UNIQUE CONSTRAINT
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_student_id_key;

-- 2. RECREATE WITH PARTIAL UNIQUE INDEX (allows multiple NULLs)
CREATE UNIQUE INDEX profiles_student_id_unique 
  ON public.profiles(student_id) 
  WHERE student_id IS NOT NULL;

-- 3. UPDATE TRIGGER TO EXPLICITLY HANDLE STUDENT_ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
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
  
  -- Create profile with RLS bypassed
  BEGIN
    INSERT INTO public.profiles (
      id,
      user_id,
      student_id,    -- Explicitly NULL
      full_name,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NULL,          -- Allow NULL student_id
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

-- 4. ENSURE FUNCTION OWNER HAS BYPASS RLS
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 5. RECREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. TEST THE FIX
DO $$
DECLARE
  test_user_id1 uuid := gen_random_uuid();
  test_user_id2 uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING MULTIPLE NULL STUDENT_IDS';
  RAISE NOTICE '========================================';
  
  BEGIN
    -- Insert first user with NULL student_id
    INSERT INTO public.profiles (id, user_id, student_id, full_name, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), test_user_id1, NULL, 'Test User 1', true, NOW(), NOW());
    
    RAISE NOTICE '✅ First user with NULL student_id inserted';
    
    -- Insert second user with NULL student_id
    INSERT INTO public.profiles (id, user_id, student_id, full_name, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), test_user_id2, NULL, 'Test User 2', true, NOW(), NOW());
    
    RAISE NOTICE '✅ Second user with NULL student_id inserted';
    RAISE NOTICE '✅✅ Multiple NULL student_ids work!';
    
    -- Cleanup
    DELETE FROM public.profiles WHERE user_id IN (test_user_id1, test_user_id2);
    RAISE NOTICE '✅ Cleanup complete';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test FAILED: %', SQLERRM;
  END;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIX DEPLOYED - Try creating user now!';
  RAISE NOTICE '========================================';
END $$;
