
-- Add is_common flag to subjects table
ALTER TABLE public.subjects ADD COLUMN is_common BOOLEAN DEFAULT FALSE;

-- Create a table to track common subjects across departments
CREATE TABLE public.common_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  credits INTEGER,
  description TEXT,
  subject_type TEXT DEFAULT 'core',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on common_subjects
ALTER TABLE public.common_subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for common_subjects
CREATE POLICY "Admin can manage common subjects" 
  ON public.common_subjects 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Anyone can view common subjects" 
  ON public.common_subjects 
  FOR SELECT 
  USING (true);

-- Create function to replicate common subjects across all departments
CREATE OR REPLACE FUNCTION public.replicate_common_subject_to_all_departments(
  p_subject_code TEXT,
  p_subject_name TEXT,
  p_credits INTEGER DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_subject_type TEXT DEFAULT 'core'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dept_record RECORD;
  sem_record RECORD;
BEGIN
  -- Insert into common_subjects table
  INSERT INTO public.common_subjects (subject_code, subject_name, credits, description, subject_type)
  VALUES (p_subject_code, p_subject_name, p_credits, p_description, p_subject_type)
  ON CONFLICT DO NOTHING;
  
  -- Loop through all departments and their first semester to add the common subject
  FOR dept_record IN SELECT id FROM public.departments LOOP
    -- Get the first semester for this department
    SELECT id INTO sem_record FROM public.semesters 
    WHERE department_id = dept_record.id AND semester_number = 1 
    LIMIT 1;
    
    IF sem_record IS NOT NULL THEN
      -- Insert subject for this department's first semester
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

-- Create function to add common subject to new departments when they are created
CREATE OR REPLACE FUNCTION public.add_common_subjects_to_new_department()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  common_subject_record RECORD;
  first_semester_id UUID;
BEGIN
  -- Get the first semester for the new department
  SELECT id INTO first_semester_id FROM public.semesters 
  WHERE department_id = NEW.id AND semester_number = 1 
  LIMIT 1;
  
  IF first_semester_id IS NOT NULL THEN
    -- Add all existing common subjects to this new department
    FOR common_subject_record IN SELECT * FROM public.common_subjects LOOP
      INSERT INTO public.subjects (
        code, name, semester_id, credits, description, subject_type, is_common
      )
      VALUES (
        common_subject_record.subject_code,
        common_subject_record.subject_name,
        first_semester_id,
        common_subject_record.credits,
        common_subject_record.description,
        common_subject_record.subject_type,
        TRUE
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add common subjects to new departments
CREATE TRIGGER add_common_subjects_after_department_insert
  AFTER INSERT ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.add_common_subjects_to_new_department();

-- Add updated_at trigger for common_subjects
CREATE TRIGGER update_common_subjects_updated_at
  BEFORE UPDATE ON public.common_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
