-- Remove NOT NULL constraint from student_id
ALTER TABLE public.profiles ALTER COLUMN student_id DROP NOT NULL;
