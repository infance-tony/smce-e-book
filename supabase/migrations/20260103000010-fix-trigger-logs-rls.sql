-- ================================================================
-- FIX RLS FOR TRIGGER_LOGS TABLE
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================================

-- 1. Enable RLS on trigger_logs
ALTER TABLE public.trigger_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create restrictive policy - only service_role can access
-- This prevents regular authenticated users from seeing debug logs
CREATE POLICY "Only service_role can access trigger logs"
  ON public.trigger_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Revoke public access
REVOKE ALL ON public.trigger_logs FROM authenticated;
REVOKE ALL ON public.trigger_logs FROM anon;

-- 4. Grant only to service_role and postgres
GRANT ALL ON public.trigger_logs TO service_role;
GRANT ALL ON public.trigger_logs TO postgres;

SELECT '✅ RLS enabled on trigger_logs - only accessible to service_role' as status;
