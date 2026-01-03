-- ================================================================
-- COMPLETE SYSTEM DIAGNOSTIC
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. Check if trigger is firing at all
SELECT '=== TRIGGER LOGS ===' as check_name, * 
FROM public.trigger_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check current users
SELECT '=== EXISTING USERS ===' as check_name, 
  id, email, created_at, 
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
ORDER BY created_at DESC;

-- 3. Check existing profiles
SELECT '=== EXISTING PROFILES ===' as check_name,
  id, user_id, full_name, student_id, is_active, created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 4. Check if there are orphaned users (no profile)
SELECT '=== USERS WITHOUT PROFILES ===' as check_name,
  u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- 5. Check all constraints on profiles
SELECT '=== ALL CONSTRAINTS ===' as check_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 6. Verify trigger exists and is active
SELECT '=== TRIGGER STATUS ===' as check_name,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 7. Check function definition
SELECT '=== FUNCTION OWNER ===' as check_name,
  routine_name,
  routine_schema,
  security_type,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 8. Test direct profile creation
DO $$
DECLARE
  test_uuid uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles (
    id, user_id, student_id, full_name, is_active, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), test_uuid, NULL, 'Test User', true, NOW(), NOW()
  );
  
  RAISE NOTICE '✅ Direct profile insert works!';
  DELETE FROM public.profiles WHERE user_id = test_uuid;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Direct profile insert failed: %', SQLERRM;
END $$;

SELECT 'Diagnostic complete!' as status;
