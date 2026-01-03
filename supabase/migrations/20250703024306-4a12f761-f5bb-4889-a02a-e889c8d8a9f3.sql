
-- Add semester_number column to common_subjects table
ALTER TABLE public.common_subjects 
ADD COLUMN IF NOT EXISTS semester_number integer NOT NULL DEFAULT 1;

-- Update existing common subjects to have semester_number = 1 for backward compatibility
UPDATE public.common_subjects 
SET semester_number = 1 
WHERE semester_number IS NULL;

-- Update the replicate_common_subject_to_all_departments function to accept semester parameter
CREATE OR REPLACE FUNCTION public.replicate_common_subject_to_all_departments(
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
AS $$
DECLARE
  dept_record RECORD;
  sem_record RECORD;
BEGIN
  -- Insert into common_subjects table with semester number
  INSERT INTO public.common_subjects (subject_code, subject_name, semester_number, credits, description, subject_type)
  VALUES (p_subject_code, p_subject_name, p_semester_number, p_credits, p_description, p_subject_type)
  ON CONFLICT DO NOTHING;
  
  -- Loop through all departments and add the common subject to the specified semester
  FOR dept_record IN SELECT id FROM public.departments LOOP
    -- Get the specified semester for this department
    SELECT id INTO sem_record FROM public.semesters 
    WHERE department_id = dept_record.id AND semester_number = p_semester_number 
    LIMIT 1;
    
    IF sem_record IS NOT NULL THEN
      -- Insert subject for this department's specified semester
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

-- Update the trigger function to use the stored semester number
CREATE OR REPLACE FUNCTION public.add_common_subjects_to_new_department()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  common_subject_record RECORD;
  target_semester_id UUID;
BEGIN
  -- Add all existing common subjects to this new department
  FOR common_subject_record IN SELECT * FROM public.common_subjects LOOP
    -- Get the target semester for this department based on the common subject's semester_number
    SELECT id INTO target_semester_id FROM public.semesters 
    WHERE department_id = NEW.id AND semester_number = common_subject_record.semester_number 
    LIMIT 1;
    
    IF target_semester_id IS NOT NULL THEN
      INSERT INTO public.subjects (
        code, name, semester_id, credits, description, subject_type, is_common
      )
      VALUES (
        common_subject_record.subject_code,
        common_subject_record.subject_name,
        target_semester_id,
        common_subject_record.credits,
        common_subject_record.description,
        common_subject_record.subject_type,
        TRUE
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;
