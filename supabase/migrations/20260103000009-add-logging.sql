-- ================================================================
-- CREATE LOG TABLE TO DEBUG TRIGGER
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. CREATE A LOG TABLE
CREATE TABLE IF NOT EXISTS public.trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event text,
  error_message text,
  created_at timestamptz DEFAULT NOW()
);

-- 2. UPDATE TRIGGER TO LOG EVERYTHING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_full_name text;
BEGIN
  -- Log trigger fired
  INSERT INTO public.trigger_logs (user_id, email, event)
  VALUES (NEW.id, NEW.email, 'TRIGGER_FIRED');
  
  -- Extract full name
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );
  
  -- Log attempting insert
  INSERT INTO public.trigger_logs (user_id, email, event)
  VALUES (NEW.id, NEW.email, 'ATTEMPTING_PROFILE_INSERT');
  
  -- Insert profile
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
  );
  
  -- Log success
  INSERT INTO public.trigger_logs (user_id, email, event)
  VALUES (NEW.id, NEW.email, 'PROFILE_CREATED_SUCCESS');
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error
  INSERT INTO public.trigger_logs (user_id, email, event, error_message)
  VALUES (NEW.id, NEW.email, 'ERROR', SQLERRM);
  
  -- Don't block user creation
  RETURN NEW;
END;
$$;

-- 3. Ensure function owner
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 4. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Grant access to log table
GRANT ALL ON public.trigger_logs TO postgres;
GRANT ALL ON public.trigger_logs TO service_role;

SELECT 'Trigger with logging installed! Now try signing up and check trigger_logs table' as status;
