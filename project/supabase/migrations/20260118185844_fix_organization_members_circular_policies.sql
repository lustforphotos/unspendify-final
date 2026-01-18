/*
  # Fix Organization Members Circular RLS Policies

  ## Problem
  The organization_members table has RLS policies that cause infinite recursion:
  - "Members can view their organization memberships" queries organization_members FROM WITHIN organization_members
  - "Admins can insert/update/delete" all have the same circular reference
  
  This causes 500 errors when trying to query the table.

  ## Solution
  Drop the circular policies and keep only the simple, direct policies that avoid recursion:
  - SELECT: Users can see their own memberships (direct user_id check)
  - INSERT: Users can create their own memberships (direct user_id check)
  - UPDATE: Users can update their own memberships (direct user_id check)
  - DELETE: Users can delete their own memberships (direct user_id check)

  ## Security Notes
  - These policies prevent infinite recursion by using direct column comparisons
  - Users can only manage their own membership records
  - Admin functionality should be handled via security definer functions if needed
*/

-- Drop the circular/recursive policies that cause 500 errors
DROP POLICY IF EXISTS "Members can view their organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update organization members" ON organization_members;

-- The following simple policies should already exist from the earlier migration
-- But we'll recreate them to be sure

DROP POLICY IF EXISTS "Users can view own organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Authenticated users can create organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can update own organization membership" ON organization_members;
DROP POLICY IF EXISTS "Users can delete own organization membership" ON organization_members;

-- CREATE simple, non-recursive policies

CREATE POLICY "Users can view own organization memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Authenticated users can create organization memberships"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own organization membership"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own organization membership"
  ON organization_members FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
