-- ================================================================
-- Find ALL triggers, webhooks, and constraints causing the issue
-- ================================================================

-- 1. Find ALL triggers on auth.users
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND NOT t.tgisinternal;

-- 2. Check for duplicate student_id values in profiles
SELECT 
  student_id, 
  COUNT(*) as count,
  array_agg(user_id) as user_ids
FROM profiles
WHERE student_id IS NOT NULL
GROUP BY student_id
HAVING COUNT(*) > 1;

-- 3. Check for profiles with NULL student_id
SELECT COUNT(*) as null_student_id_count
FROM profiles
WHERE student_id IS NULL;

-- 4. Check current unique constraint/index on student_id
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexdef LIKE '%student_id%';

-- 5. List all profiles to see what student_id values exist
SELECT 
  id,
  user_id,
  student_id,
  full_name,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;
