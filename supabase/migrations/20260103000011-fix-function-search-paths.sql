-- ================================================================
-- FIX FUNCTION SEARCH_PATH SECURITY WARNINGS
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- Fix handle_profile_update
DROP FUNCTION IF EXISTS public.handle_profile_update() CASCADE;
CREATE FUNCTION public.handle_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix is_admin
DROP FUNCTION IF EXISTS public.is_admin(text) CASCADE;
CREATE FUNCTION public.is_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN user_email = 'infancetony.cs22@stellamaryscoe.edu.in';
END;
$$;

-- Fix is_valid_college_email
DROP FUNCTION IF EXISTS public.is_valid_college_email(text) CASCADE;
CREATE FUNCTION public.is_valid_college_email(email_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Allow any email format now
  RETURN email_address ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$';
END;
$$;

-- Fix test_auth_triggers (mark as VOLATILE to prevent inlining)
DROP FUNCTION IF EXISTS public.test_auth_triggers() CASCADE;
CREATE FUNCTION public.test_auth_triggers()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
VOLATILE
AS $$
DECLARE
  result text := '';
BEGIN
  result := 'Test functions are for debugging only';
  RETURN result;
END;
$$;

-- Fix test_user_creation_correct
DROP FUNCTION IF EXISTS public.test_user_creation_correct() CASCADE;
CREATE FUNCTION public.test_user_creation_correct()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
VOLATILE
AS $$
DECLARE
  result text := '';
BEGIN
  result := 'Test functions are for debugging only';
  RETURN result;
END;
$$;

-- Fix replicate_common_subject_to_all_departments
DROP FUNCTION IF EXISTS public.replicate_common_subject_to_all_departments(text, text, integer, integer, text, text) CASCADE;
CREATE FUNCTION public.replicate_common_subject_to_all_departments(
  p_subject_code text, 
  p_subject_name text, 
  p_semester_number integer DEFAULT 1,
  p_credits integer DEFAULT NULL::integer, 
  p_description text DEFAULT NULL::text, 
  p_subject_type text DEFAULT 'core'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  dept_record RECORD;
  sem_record RECORD;
BEGIN
  INSERT INTO public.common_subjects (subject_code, subject_name, semester_number, credits, description, subject_type)
  VALUES (p_subject_code, p_subject_name, p_semester_number, p_credits, p_description, p_subject_type)
  ON CONFLICT DO NOTHING;
  
  FOR dept_record IN SELECT id FROM public.departments LOOP
    SELECT id INTO sem_record FROM public.semesters 
    WHERE department_id = dept_record.id AND semester_number = p_semester_number 
    LIMIT 1;
    
    IF sem_record IS NOT NULL THEN
      INSERT INTO public.subjects (
        code, name, semester_id, credits, description, subject_type, is_common
      )
      VALUES (
        p_subject_code, p_subject_name, sem_record.id, p_credits, p_description, p_subject_type, TRUE
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

SELECT '✅ All functions updated with secure search_path' as status;
