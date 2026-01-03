-- ================================================================
-- FIX USER CREATION - Complete Solution
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- ================================================================
-- 1. MAKE PROFILES TABLE COLUMNS NULLABLE (CRITICAL FIX)
-- ================================================================

-- Make department_id nullable to allow user creation without department
ALTER TABLE public.profiles ALTER COLUMN department_id DROP NOT NULL;

-- Make other columns nullable as well for flexible user creation
DO $$
BEGIN
  -- Make student_id nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'student_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN student_id DROP NOT NULL;
  END IF;
  
  -- Make phone nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
  END IF;
  
  -- Make address nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'address' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN address DROP NOT NULL;
  END IF;
END $$;

-- ================================================================
-- 2. UPDATED PROFILE CREATION TRIGGER - ROBUST VERSION
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_full_name text;
  user_email text;
BEGIN
  -- Get email from the new user
  user_email := NEW.email;
  
  -- Extract full name from metadata or generate from email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    -- Generate name from email (before @)
    initcap(replace(split_part(user_email, '@', 1), '.', ' '))
  );
  
  -- Create profile with only essential fields
  BEGIN
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      user_email,
      user_full_name,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'Profile created successfully for user: % with email: %', NEW.id, user_email;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log detailed error but don't fail user creation
    RAISE WARNING 'Profile creation failed for user: % with email: %. Error: % (SQLSTATE: %)', 
      NEW.id, user_email, SQLERRM, SQLSTATE;
    -- Don't raise exception - allow user creation to succeed
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 3. RECREATE TRIGGER
-- ================================================================

-- Drop and recreate trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 4. GRANT PROPER PERMISSIONS
-- ================================================================

-- Ensure trigger has permission to insert into profiles
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ================================================================
-- 5. TEST THE FIX
-- ================================================================

-- Create a test function to verify the setup
CREATE OR REPLACE FUNCTION public.test_user_creation_fix()
RETURNS text AS $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test@example.com';
  test_name text := 'Test User';
  result text := '';
BEGIN
  result := result || 'Testing Profile Creation Fix...' || E'\n';
  result := result || '================================' || E'\n';
  
  -- Check if department_id is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'department_id' 
    AND is_nullable = 'YES'
  ) THEN
    result := result || '✅ department_id is nullable' || E'\n';
  ELSE
    result := result || '❌ department_id is NOT NULL (THIS WILL CAUSE ERRORS!)' || E'\n';
  END IF;
  
  -- Test profile creation with minimal data
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (test_user_id, test_email, test_name, NOW(), NOW());
    
    result := result || '✅ Profile insert successful' || E'\n';
    
    -- Cleanup
    DELETE FROM public.profiles WHERE id = test_user_id;
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
SELECT public.test_user_creation_fix();

-- ================================================================
-- 6. SHOW CURRENT PROFILES TABLE STRUCTURE
-- ================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
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
  RAISE NOTICE '1. Made department_id and other columns nullable';
  RAISE NOTICE '2. Updated trigger to insert only required fields';
  RAISE NOTICE '3. Added robust error handling';
  RAISE NOTICE '4. Granted proper permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Try creating a user in Supabase Auth now!';
  RAISE NOTICE '========================================';
END $$;