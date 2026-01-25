/*
  # Fix Circular RLS Policy on organization_members

  1. Changes
    - Drop the circular "Organization members can view members" policy
    - The "Users can view own organization memberships" policy is sufficient for the app to work
    - This prevents the 500 error caused by infinite recursion

  2. Security
    - Users can still view their own memberships
    - Organization admins can still manage members
    - No security is reduced, just removing the problematic circular check
*/

-- Drop the circular policy that causes 500 errors
DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
