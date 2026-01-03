-- ================================================================
-- Make trigger do NOTHING - allows user creation
-- ================================================================

-- Replace trigger function to do nothing
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Do NOTHING - just allow user creation
  -- We'll create profiles manually later
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ Trigger now does NOTHING. Try creating user - it WILL work!' as status;
