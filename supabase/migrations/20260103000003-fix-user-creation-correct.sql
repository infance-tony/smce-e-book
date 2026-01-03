-- ================================================================
-- FIX USER CREATION - Correct Version for Your Database
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- ================================================================
-- 1. CREATE PROFILE CREATION TRIGGER - MATCHES YOUR TABLE STRUCTURE
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
BEGIN
  -- Extract full name from metadata or generate from email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    -- Generate name from email (before @)
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );
  
  -- Create profile with your actual table structure
  BEGIN
    INSERT INTO public.profiles (
      id,               -- Generate new UUID for primary key
      user_id,
      full_name,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(), -- Generate UUID for id (primary key)
      NEW.id,           -- auth.users.id goes into user_id column
      user_full_name,
      true,             -- Set user as active by default
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log detailed error but don't fail user creation
    RAISE WARNING 'Profile creation failed for user: %. Error: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    -- Don't raise exception - allow user creation to succeed
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 2. RECREATE TRIGGER
-- ================================================================

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 3. GRANT PROPER PERMISSIONS
-- ================================================================

-- Ensure trigger has permission to insert into profiles
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ================================================================
-- 4. TEST THE FIX
-- ================================================================

-- Create a test function to verify the setup
CREATE OR REPLACE FUNCTION public.test_user_creation_correct()
RETURNS text AS $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_name text := 'Test User';
  result text := '';
BEGIN
  result := result || 'Testing Profile Creation Fix...' || E'\n';
  result := result || '================================' || E'\n';
  
  -- Check profiles table structure
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    result := result || '✅ user_id column exists' || E'\n';
  ELSE
    result := result || '❌ user_id column missing!' || E'\n';
  END IF;
  
  -- Test profile creation with minimal data
  BEGIN
    INSERT INTO public.profiles (id, user_id, full_name, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), test_user_id, test_name, true, NOW(), NOW());
    
    result := result || '✅ Profile insert successful' || E'\n';
    
    -- Cleanup
    DELETE FROM public.profiles WHERE user_id = test_user_id;
    result := result || '✅ Test cleanup complete' || E'\n';
    
  EXCEPTION WHEN OTHERS THEN
    result := result || '❌ Profile insert FAILED: ' || SQLERRM || E'\n';
    result := result || '   SQLSTATE: ' || SQLSTATE || E'\n';
  END;
  
  -- Check trigger status
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    result := result || '✅ Trigger exists and is active' || E'\n';
  ELSE
    result := result || '❌ Trigger is missing!' || E'\n';
  END IF;
  
  result := result || '================================' || E'\n';
  result := result || 'Fix Status: Ready for testing!' || E'\n';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT public.test_user_creation_correct();

-- ================================================================
-- 5. SHOW CURRENT PROFILES TABLE STRUCTURE
-- ================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'USER CREATION FIX DEPLOYED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. Created trigger matching your table structure';
  RAISE NOTICE '2. Uses user_id column (not id)';
  RAISE NOTICE '3. Sets is_active = true by default';
  RAISE NOTICE '4. Added robust error handling';
  RAISE NOTICE '5. Granted proper permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Try creating a user in Supabase Auth now!';
  RAISE NOTICE '========================================';
END $$;
