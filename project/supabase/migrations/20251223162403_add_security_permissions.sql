/*
  # Security and Permissions Model

  ## Overview
  Defines the permission model for Unspendify with organization isolation,
  role-based access, and notification preferences.

  ## Permission Model

  ### Organization Isolation
  - Users can only access data from organizations they belong to
  - All queries are scoped by organization_id through RLS policies
  - No cross-organization data visibility

  ### Roles

  **Admin:**
  - Manage organization settings (name, billing)
  - Invite and remove team members
  - Assign member roles (promote/demote)
  - Assign tool owners
  - View all subscriptions and alerts

  **Member:**
  - View all subscriptions in their organization
  - View renewal alerts
  - Update subscription notes/tags
  - Cannot assign owners
  - Cannot manage team members

  ### Tool Owner Assignment
  - Only admins can assign owners to subscriptions
  - Members can view who owns what
  - Tool owners receive targeted renewal alerts for their tools

  ### Alert Distribution
  - Admins receive all alerts by default
  - Tool owners receive alerts for their assigned tools
  - Members can opt-in to specific alert types via preferences
  - Weekly digest goes to all active users (configurable)

  ## Changes
  1. Add notification_preferences table for user alert settings
  2. Update tool_ownership policies to admin-only for INSERT
  3. Add helper function to check if user is admin
*/

-- =====================================================
-- HELPER FUNCTION: is_admin
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = org_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TABLE: notification_preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Alert types
  receive_new_subscription_alerts boolean DEFAULT false NOT NULL,
  receive_renewal_alerts boolean DEFAULT false NOT NULL,
  receive_trial_ending_alerts boolean DEFAULT false NOT NULL,
  receive_weekly_digest boolean DEFAULT true NOT NULL,
  
  -- Owned tools always receive alerts regardless of these settings
  only_owned_tools boolean DEFAULT false NOT NULL,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_org 
  ON notification_preferences(user_id, organization_id);

-- =====================================================
-- RLS: notification_preferences
-- =====================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = notification_preferences.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- UPDATE: tool_ownership policies
-- =====================================================
-- Only admins can assign tool owners

DROP POLICY IF EXISTS "Members can assign tool ownership in their organization" ON tool_ownership;

CREATE POLICY "Admins can assign tool ownership"
  ON tool_ownership FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Members can update tool ownership in their organization" ON tool_ownership;

CREATE POLICY "Admins can update tool ownership"
  ON tool_ownership FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Members can delete tool ownership in their organization" ON tool_ownership;

CREATE POLICY "Admins can delete tool ownership"
  ON tool_ownership FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );
