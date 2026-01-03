-- ================================================================
-- Allow Any Email Domain - Remove College Email Restriction
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- ================================================================
-- 1. UPDATE PROFILE CREATION TRIGGER TO ACCEPT ANY EMAIL
-- ================================================================

-- Enhanced function to handle new user signup - ACCEPTS ANY EMAIL
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
    -- Generate name from email (before @)
    initcap(replace(split_part(user_email, '@', 1), '.', ' '))
  );
  
  -- Create profile for ANY email (no domain restriction)
  BEGIN
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name
    )
    VALUES (
      NEW.id,
      user_email,
      user_full_name
    );
    
    -- Log the profile creation
    RAISE LOG 'Profile created for user: % with email: %', NEW.id, user_email;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Profile creation failed for user: % with email: %. Error: %', NEW.id, user_email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 2. ENSURE TRIGGER IS ACTIVE
-- ================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 3. UPDATE EMAIL VALIDATION FUNCTION (OPTIONAL)
-- ================================================================

-- Update email validation to accept any valid email format
CREATE OR REPLACE FUNCTION public.is_valid_college_email(email_address text)
RETURNS boolean AS $$
BEGIN
  -- Accept any valid email format
  RETURN email_address ~ '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================================
-- 4. VERIFY SETUP
-- ================================================================

-- Test the new trigger
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.event_object_table,
  t.action_timing
FROM information_schema.triggers t
WHERE t.trigger_name = 'on_auth_user_created';

-- Check if profiles table is ready
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('id', 'email', 'full_name')
ORDER BY ordinal_position;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '=== EMAIL RESTRICTION REMOVED ===';
  RAISE NOTICE 'Users can now sign up with ANY email domain';
  RAISE NOTICE 'Profile creation trigger updated successfully';
  RAISE NOTICE 'Test user signup now!';
END $$;