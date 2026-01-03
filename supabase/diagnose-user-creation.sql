-- ================================================================
-- DIAGNOSE USER CREATION FAILURE
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. CHECK TRIGGER EXISTS AND IS ACTIVE
SELECT 
  '=== TRIGGER STATUS ===' as check_type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. CHECK FUNCTION EXISTS AND OWNER
SELECT
  '=== FUNCTION DETAILS ===' as check_type,
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 3. CHECK ALL CONSTRAINTS ON PROFILES
SELECT
  '=== PROFILES CONSTRAINTS ===' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' AND tc.table_schema = 'public'
ORDER BY tc.constraint_type;

-- 4. CHECK WHICH COLUMNS ARE NOT NULLABLE
SELECT
  '=== NOT NULL COLUMNS ===' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND is_nullable = 'NO';

-- 5. TEST DIRECT INSERT AS IF TRIGGER DID IT
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING EXACT TRIGGER BEHAVIOR';
  RAISE NOTICE '========================================';
  
  BEGIN
    INSERT INTO public.profiles (
      id,
      user_id,
      full_name,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      test_user_id,
      'Test User',
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Insert successful - trigger should work!';
    DELETE FROM public.profiles WHERE user_id = test_user_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Insert FAILED with error:';
    RAISE NOTICE 'Error Message: %', SQLERRM;
    RAISE NOTICE 'SQL State: %', SQLSTATE;
    RAISE NOTICE 'Error Detail: %', SQLERRM;
  END;
END $$;

-- 6. CHECK IF STUDENT_ID HAS UNIQUE CONSTRAINT
SELECT
  '=== STUDENT_ID CONSTRAINT ===' as check_type,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND constraint_name LIKE '%student_id%';

-- 7. TRY TO INSERT WITH NULL STUDENT_ID
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTING WITH NULL STUDENT_ID';
  RAISE NOTICE '========================================';
  
  BEGIN
    INSERT INTO public.profiles (
      id,
      user_id,
      student_id,  -- Explicitly NULL
      full_name,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      test_user_id,
      NULL,  -- NULL student_id
      'Test User',
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Insert with NULL student_id successful!';
    DELETE FROM public.profiles WHERE user_id = test_user_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Insert with NULL student_id FAILED:';
    RAISE NOTICE '%', SQLERRM;
  END;
END $$;
