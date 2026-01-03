-- ================================================================
-- AUTO-GENERATE STUDENT_ID - Keep NOT NULL constraint
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Create sequence for student_id auto-increment
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 1;

-- 2. Drop and recreate trigger function with auto student_id generation
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name text;
  auto_student_id text;
BEGIN
  -- Extract full name
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    initcap(replace(split_part(NEW.email, '@', 1), '.', ' '))
  );
  
  -- Generate auto student_id like: STU00001, STU00002, etc.
  auto_student_id := 'STU' || LPAD(nextval('student_id_seq')::text, 5, '0');
  
  -- Insert profile with auto-generated student_id
  INSERT INTO public.profiles (
    id, 
    user_id, 
    student_id,    -- Auto-generated!
    full_name, 
    is_active, 
    created_at, 
    updated_at
  )
  VALUES (
    gen_random_uuid(), 
    NEW.id, 
    auto_student_id,  -- STU00001, STU00002...
    user_full_name, 
    true, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Set owner to postgres
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 4. Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Update existing NULL student_ids to auto-generated values
UPDATE public.profiles 
SET student_id = 'STU' || LPAD(nextval('student_id_seq')::text, 5, '0')
WHERE student_id IS NULL;

SELECT '✅ FIXED - student_id auto-generated as STU00001, STU00002, etc.' as status;
