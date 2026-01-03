-- ================================================================
-- COMPLETE DATABASE OVERVIEW - Run in Supabase SQL Editor
-- ================================================================

-- 1. LIST ALL TABLES
SELECT 
  '=== ALL TABLES ===' as info,
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. DETAILED TABLE STRUCTURES
SELECT 
  '=== PROFILES TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== DEPARTMENTS TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'departments' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== EBOOKS TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ebooks' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== SEMESTERS TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'semesters' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== SUBJECTS TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subjects' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== COMMON_SUBJECTS TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'common_subjects' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== STUDENT_ACADEMIC_INFO TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_academic_info' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  '=== USER_ROLES TABLE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ALL FOREIGN KEY RELATIONSHIPS
SELECT 
  '=== FOREIGN KEYS ===' as info,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. ALL PRIMARY KEYS AND UNIQUE CONSTRAINTS
SELECT
  '=== PRIMARY KEYS & UNIQUE CONSTRAINTS ===' as info,
  tc.table_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type;

-- 5. ALL TRIGGERS
SELECT
  '=== TRIGGERS ===' as info,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 6. ALL CUSTOM FUNCTIONS
SELECT
  '=== CUSTOM FUNCTIONS ===' as info,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- 7. ROW COUNTS FOR EACH TABLE
SELECT 
  '=== TABLE ROW COUNTS ===' as info,
  'profiles' as table_name,
  count(*) as row_count
FROM profiles
UNION ALL
SELECT '', 'departments', count(*) FROM departments
UNION ALL
SELECT '', 'semesters', count(*) FROM semesters
UNION ALL
SELECT '', 'subjects', count(*) FROM subjects
UNION ALL
SELECT '', 'common_subjects', count(*) FROM common_subjects
UNION ALL
SELECT '', 'ebooks', count(*) FROM ebooks
UNION ALL
SELECT '', 'student_academic_info', count(*) FROM student_academic_info
UNION ALL
SELECT '', 'user_roles', count(*) FROM user_roles;

-- 8. SAMPLE DATA FROM KEY TABLES
SELECT 
  '=== SAMPLE: PROFILES (first 5) ===' as info,
  id,
  user_id,
  full_name,
  student_id,
  is_active
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  '=== SAMPLE: DEPARTMENTS ===' as info,
  id,
  name,
  code
FROM departments
ORDER BY name;

SELECT 
  '=== SAMPLE: EBOOKS (first 5) ===' as info,
  id,
  title,
  subject_id,
  file_path
FROM ebooks
ORDER BY created_at DESC
LIMIT 5;

-- 9. CHECK AUTHENTICATION TRIGGER STATUS
SELECT
  '=== AUTH TRIGGER STATUS ===' as info,
  trigger_name,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 10. RLS (ROW LEVEL SECURITY) POLICIES
SELECT
  '=== RLS POLICIES ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
