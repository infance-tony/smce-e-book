-- ================================================================
-- NUCLEAR OPTION - Remove trigger exception handler to see real error
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. UPDATE TRIGGER TO LET ERROR BUBBLE UP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  RAISE NOTICE 'Creating profile for user: % (%)', NEW.id, NEW.email;
  
  -- Insert profile - LET IT FAIL if there's an error
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
  
  RAISE NOTICE 'Profile created successfully!';
  
  RETURN NEW;
END;
$$;

-- 2. Ensure function owner
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 3. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Check for any CHECK constraints that might fail
SELECT
  '=== CHECK CONSTRAINTS ===' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c';

SELECT 'Setup complete - Now try signing up and see the EXACT error!' as status;
