-- ============================================
-- Relay Vision: Row Level Security Migration
-- Purpose: Secure multi-user data isolation
-- Date: 2026-01-30
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own profile (signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- ============================================
-- 2. ZONES TABLE
-- ============================================
-- Enable RLS
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own zones
CREATE POLICY "Users can view own zones"
ON zones FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own zones
CREATE POLICY "Users can insert own zones"
ON zones FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own zones
CREATE POLICY "Users can update own zones"
ON zones FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own zones
CREATE POLICY "Users can delete own zones"
ON zones FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. MISSIONS TABLE
-- ============================================
-- Enable RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- NOTE: If missions has a direct user_id column, use these policies:
-- If missions only has zone_id, see alternative policies below.

-- Policy: Users can view their own missions
CREATE POLICY "Users can view own missions"
ON missions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own missions
CREATE POLICY "Users can insert own missions"
ON missions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own missions
CREATE POLICY "Users can update own missions"
ON missions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own missions
CREATE POLICY "Users can delete own missions"
ON missions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- ALTERNATIVE: If missions uses zone_id only
-- (Uncomment if missions has no user_id column)
-- ============================================
/*
-- Policy: Users can view missions in their zones
CREATE POLICY "Users can view own missions via zone"
ON missions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM zones
    WHERE zones.id = missions.zone_id
    AND zones.user_id = auth.uid()
  )
);

-- Policy: Users can insert missions into their zones
CREATE POLICY "Users can insert missions into own zones"
ON missions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM zones
    WHERE zones.id = zone_id
    AND zones.user_id = auth.uid()
  )
);

-- Policy: Users can update missions in their zones
CREATE POLICY "Users can update missions in own zones"
ON missions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM zones
    WHERE zones.id = missions.zone_id
    AND zones.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM zones
    WHERE zones.id = zone_id
    AND zones.user_id = auth.uid()
  )
);

-- Policy: Users can delete missions in their zones
CREATE POLICY "Users can delete missions in own zones"
ON missions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM zones
    WHERE zones.id = missions.zone_id
    AND zones.user_id = auth.uid()
  )
);
*/

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- List all policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
