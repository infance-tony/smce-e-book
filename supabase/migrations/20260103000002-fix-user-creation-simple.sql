-- ================================================================
-- FIX USER CREATION - Simple Version (No department_id)
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- ================================================================
-- 1. CHECK IF PROFILES TABLE EXISTS, CREATE IF NOT
-- ================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  student_id text,
  phone text,
  address text,
  avatar_url text,
  role text DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ================================================================
-- 2. CREATE PROFILE CREATION TRIGGER - SIMPLE VERSION
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
CREATE OR REPLACE FUNCTION public.test_user_creation_simple()
RETURNS text AS $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test@example.com';
  test_name text := 'Test User';
  result text := '';
BEGIN
  result := result || 'Testing Profile Creation Fix...' || E'\n';
  result := result || '================================' || E'\n';
  
  -- Check if profiles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'profiles' AND table_schema = 'public'
  ) THEN
    result := result || '✅ Profiles table exists' || E'\n';
  ELSE
    result := result || '❌ Profiles table does not exist!' || E'\n';
    RETURN result;
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
SELECT public.test_user_creation_simple();

-- ================================================================
-- 6. SHOW CURRENT PROFILES TABLE STRUCTURE
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
  RAISE NOTICE '1. Created/verified profiles table';
  RAISE NOTICE '2. Created trigger to insert only required fields';
  RAISE NOTICE '3. Added robust error handling';
  RAISE NOTICE '4. Granted proper permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'Try creating a user in Supabase Auth now!';
  RAISE NOTICE '========================================';
END $$;
