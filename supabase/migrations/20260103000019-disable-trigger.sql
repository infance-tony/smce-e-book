-- ================================================================
-- EMERGENCY FIX - Disable trigger, create user manually
-- ================================================================

-- 1. Disable the problematic trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- 2. Try this: Create a test auth user (Supabase will do this)
-- Then manually create the profile

SELECT '✅ Trigger DISABLED. Now try creating user in Supabase Auth.' as step1;
SELECT 'After user is created, tell me the user_id and I will create profile manually' as step2;
