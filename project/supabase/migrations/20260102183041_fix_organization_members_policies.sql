/*
  # Fix Organization Members RLS Policies

  ## Changes
  - Drop existing organization_members policies that cause infinite recursion
  - Create new simplified policies that avoid circular references:
    - SELECT: Users can only see records where they are the user_id (direct check)
    - INSERT: Temporarily allow authenticated users (will be replaced with proper admin checks later)
    - UPDATE: Only allow users to update their own membership
    - DELETE: Only allow users to delete their own membership

  ## Security Notes
  - These simplified policies prevent infinite recursion
  - Production deployments should add admin checks via security definer functions
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view their organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update organization members" ON organization_members;

-- Create new simplified policies that avoid recursion

-- SELECT: Users can see their own memberships
CREATE POLICY "Users can view own organization memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Allow authenticated users to create memberships
-- Note: In production, this should be restricted to admins via a security definer function
CREATE POLICY "Authenticated users can create organization memberships"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own membership
CREATE POLICY "Users can update own organization membership"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only delete their own membership
CREATE POLICY "Users can delete own organization membership"
  ON organization_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
