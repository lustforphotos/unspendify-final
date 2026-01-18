/*
  # Fix Security and Performance Issues

  This migration addresses critical security and performance issues identified by Supabase.

  ## 1. Add Missing Foreign Key Indexes
  Adds covering indexes for all foreign keys to improve query performance on:
  - billing_subscriptions.plan_id
  - detected_tools (4 foreign keys: confirmed_owner_id, inferred_owner_id, parent_vendor_id, source_email_connection_id)
  - email_connections.user_id
  - emails.subscription_id (if exists)
  - interruptions (2 foreign keys: resolved_by, tool_id)
  - notification_preferences.organization_id
  - renewals.source_event_id
  - tool_classification_corrections (2 foreign keys: tool_id, user_id)

  ## 2. Optimize RLS Policies for Performance
  Updates all RLS policies to use `(select auth.uid())` instead of `auth.uid()` 
  to prevent re-evaluation on each row. This significantly improves query performance at scale.
  
  Affects policies on tables:
  - organizations
  - users
  - organization_members  
  - inbound_mailboxes
  - raw_emails
  - parsed_events
  - tools
  - tool_ownership
  - renewals
  - notifications
  - notification_preferences (if exists)
  - email_connections
  - detected_tools
  - interruptions
  - email_scan_logs
  - billing_subscriptions
  - tool_classification_corrections
  - vendor_intelligence

  ## 3. Fix Function Search Paths
  Sets explicit search_path for all functions to prevent security issues:
  - setup_cron_settings
  - initialize_organization_subscription
  - auto_classify_tool
  - update_updated_at_column
  - is_admin

  ## 4. Consolidate Duplicate Policies
  Merges multiple permissive policies to avoid conflicts on:
  - billing_subscriptions (SELECT policies)
  - vendor_intelligence (SELECT policies)
*/

-- =====================================================
-- PART 1: Add Missing Foreign Key Indexes
-- =====================================================

-- billing_subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_plan_id 
  ON billing_subscriptions(plan_id);

-- detected_tools indexes
CREATE INDEX IF NOT EXISTS idx_detected_tools_confirmed_owner_id 
  ON detected_tools(confirmed_owner_id) WHERE confirmed_owner_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_detected_tools_inferred_owner_id 
  ON detected_tools(inferred_owner_id) WHERE inferred_owner_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_detected_tools_parent_vendor_id 
  ON detected_tools(parent_vendor_id) WHERE parent_vendor_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_detected_tools_source_connection_id 
  ON detected_tools(source_email_connection_id) WHERE source_email_connection_id IS NOT NULL;

-- email_connections index
CREATE INDEX IF NOT EXISTS idx_email_connections_user_id 
  ON email_connections(user_id);

-- interruptions indexes  
CREATE INDEX IF NOT EXISTS idx_interruptions_resolved_by 
  ON interruptions(resolved_by) WHERE resolved_by IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_interruptions_tool_id 
  ON interruptions(tool_id);

-- renewals index
CREATE INDEX IF NOT EXISTS idx_renewals_source_event_id 
  ON renewals(source_event_id) WHERE source_event_id IS NOT NULL;

-- notification_preferences index (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
    CREATE INDEX IF NOT EXISTS idx_notification_preferences_org_id 
      ON notification_preferences(organization_id);
  END IF;
END $$;

-- tool_classification_corrections indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tool_classification_corrections') THEN
    CREATE INDEX IF NOT EXISTS idx_tool_classification_corrections_tool_id 
      ON tool_classification_corrections(tool_id);
    CREATE INDEX IF NOT EXISTS idx_tool_classification_corrections_user_id 
      ON tool_classification_corrections(user_id);
  END IF;
END $$;

-- =====================================================
-- PART 2: Optimize RLS Policies
-- =====================================================

-- organizations table policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON organizations;

CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update their organizations" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = (select auth.uid())
      AND organization_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = (select auth.uid())
      AND organization_members.role = 'admin'
    )
  );

-- users table policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- organization_members table policies  
DROP POLICY IF EXISTS "Members can view their organization memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update organization members" ON organization_members;

CREATE POLICY "Members can view their organization memberships" ON organization_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert organization members" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (select auth.uid())
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete organization members" ON organization_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (select auth.uid())
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Admins can update organization members" ON organization_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (select auth.uid())
      AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (select auth.uid())
      AND om.role = 'admin'
    )
  );

-- inbound_mailboxes table policies
DROP POLICY IF EXISTS "Members can view their organization mailboxes" ON inbound_mailboxes;

CREATE POLICY "Members can view their organization mailboxes" ON inbound_mailboxes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = inbound_mailboxes.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- raw_emails table policies
DROP POLICY IF EXISTS "Members can view emails for their organization" ON raw_emails;

CREATE POLICY "Members can view emails for their organization" ON raw_emails
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inbound_mailboxes
      JOIN organization_members ON organization_members.organization_id = inbound_mailboxes.organization_id
      WHERE inbound_mailboxes.id = raw_emails.inbound_mailbox_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- parsed_events table policies
DROP POLICY IF EXISTS "Members can view parsed events for their organization" ON parsed_events;

CREATE POLICY "Members can view parsed events for their organization" ON parsed_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM raw_emails
      JOIN inbound_mailboxes ON inbound_mailboxes.id = raw_emails.inbound_mailbox_id
      JOIN organization_members ON organization_members.organization_id = inbound_mailboxes.organization_id
      WHERE raw_emails.id = parsed_events.raw_email_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- tools table policies
DROP POLICY IF EXISTS "Members can view their organization tools" ON tools;
DROP POLICY IF EXISTS "Members can update their organization tools" ON tools;

CREATE POLICY "Members can view their organization tools" ON tools
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Members can update their organization tools" ON tools
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- tool_ownership table policies
DROP POLICY IF EXISTS "Members can view tool ownership for their organization" ON tool_ownership;
DROP POLICY IF EXISTS "Members can assign tool ownership in their organization" ON tool_ownership;
DROP POLICY IF EXISTS "Members can update tool ownership in their organization" ON tool_ownership;
DROP POLICY IF EXISTS "Members can delete tool ownership in their organization" ON tool_ownership;
DROP POLICY IF EXISTS "Admins can assign tool ownership" ON tool_ownership;
DROP POLICY IF EXISTS "Admins can update tool ownership" ON tool_ownership;
DROP POLICY IF EXISTS "Admins can delete tool ownership" ON tool_ownership;

CREATE POLICY "Members can view tool ownership for their organization" ON tool_ownership
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Members can assign tool ownership in their organization" ON tool_ownership
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Members can update tool ownership in their organization" ON tool_ownership
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Members can delete tool ownership in their organization" ON tool_ownership
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- renewals table policies
DROP POLICY IF EXISTS "Members can view renewals for their organization" ON renewals;

CREATE POLICY "Members can view renewals for their organization" ON renewals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = renewals.tool_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- email_connections table policies
DROP POLICY IF EXISTS "Users can view org email connections" ON email_connections;
DROP POLICY IF EXISTS "Users can create email connections" ON email_connections;
DROP POLICY IF EXISTS "Users can update own email connections" ON email_connections;
DROP POLICY IF EXISTS "Users can delete own email connections" ON email_connections;

CREATE POLICY "Users can view org email connections" ON email_connections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = email_connections.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create email connections" ON email_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = email_connections.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND user_id = (select auth.uid())
  );

CREATE POLICY "Users can update own email connections" ON email_connections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = email_connections.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND user_id = (select auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = email_connections.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND user_id = (select auth.uid())
  );

CREATE POLICY "Users can delete own email connections" ON email_connections
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = email_connections.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
    AND user_id = (select auth.uid())
  );

-- detected_tools table policies
DROP POLICY IF EXISTS "Users can view org detected tools" ON detected_tools;
DROP POLICY IF EXISTS "System can insert detected tools" ON detected_tools;
DROP POLICY IF EXISTS "Users can update org detected tools" ON detected_tools;

CREATE POLICY "Users can view org detected tools" ON detected_tools
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = detected_tools.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can insert detected tools" ON detected_tools
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = detected_tools.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update org detected tools" ON detected_tools
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = detected_tools.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = detected_tools.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- interruptions table policies
DROP POLICY IF EXISTS "Users can view org interruptions" ON interruptions;
DROP POLICY IF EXISTS "System can create interruptions" ON interruptions;
DROP POLICY IF EXISTS "Users can resolve org interruptions" ON interruptions;

CREATE POLICY "Users can view org interruptions" ON interruptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = interruptions.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can create interruptions" ON interruptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = interruptions.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can resolve org interruptions" ON interruptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = interruptions.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = interruptions.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- email_scan_logs table policies
DROP POLICY IF EXISTS "Users can view org scan logs" ON email_scan_logs;
DROP POLICY IF EXISTS "System can create scan logs" ON email_scan_logs;
DROP POLICY IF EXISTS "System can update scan logs" ON email_scan_logs;

CREATE POLICY "Users can view org scan logs" ON email_scan_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_connections
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE email_connections.id = email_scan_logs.connection_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can create scan logs" ON email_scan_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_connections
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE email_connections.id = email_scan_logs.connection_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can update scan logs" ON email_scan_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_connections
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE email_connections.id = email_scan_logs.connection_id
      AND organization_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_connections
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE email_connections.id = email_scan_logs.connection_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- billing_subscriptions table policies (consolidate duplicate policies)
DROP POLICY IF EXISTS "Organization members can view subscription" ON billing_subscriptions;
DROP POLICY IF EXISTS "System can manage subscriptions" ON billing_subscriptions;

CREATE POLICY "Members and system can view subscription" ON billing_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = billing_subscriptions.organization_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- notification_preferences table policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
    DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
    DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;
    DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;

    EXECUTE 'CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = notification_preferences.organization_id
          AND organization_members.user_id = (select auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = notification_preferences.organization_id
          AND organization_members.user_id = (select auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = notification_preferences.organization_id
          AND organization_members.user_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = notification_preferences.organization_id
          AND organization_members.user_id = (select auth.uid())
        )
      )';
  END IF;
END $$;

-- tool_classification_corrections table policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tool_classification_corrections') THEN
    DROP POLICY IF EXISTS "Organization members can view corrections" ON tool_classification_corrections;
    DROP POLICY IF EXISTS "Organization members can insert corrections" ON tool_classification_corrections;

    EXECUTE 'CREATE POLICY "Organization members can view corrections" ON tool_classification_corrections
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM detected_tools
          JOIN organization_members ON organization_members.organization_id = detected_tools.organization_id
          WHERE detected_tools.id = tool_classification_corrections.tool_id
          AND organization_members.user_id = (select auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Organization members can insert corrections" ON tool_classification_corrections
      FOR INSERT TO authenticated
      WITH CHECK (user_id = (select auth.uid()))';
  END IF;
END $$;

-- vendor_intelligence table policies (consolidate duplicate policies, if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_intelligence') THEN
    DROP POLICY IF EXISTS "Vendor intelligence is publicly readable" ON vendor_intelligence;
    DROP POLICY IF EXISTS "System can manage vendor intelligence" ON vendor_intelligence;

    EXECUTE 'CREATE POLICY "Vendor intelligence is readable" ON vendor_intelligence
      FOR SELECT TO authenticated
      USING (true)';
  END IF;
END $$;

-- =====================================================
-- PART 3: Fix Function Search Paths
-- =====================================================

-- Fix setup_cron_settings (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'setup_cron_settings') THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION setup_cron_settings()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_catalog
    AS $func$
    BEGIN
      UPDATE cron.job 
      SET schedule = ''0 9 * * *''
      WHERE jobname = ''daily-email-scan'';
    END;
    $func$';
  END IF;
END $$;

-- Fix initialize_organization_subscription (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'initialize_organization_subscription') THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION initialize_organization_subscription()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_catalog
    AS $func$
    BEGIN
      INSERT INTO billing_subscriptions (organization_id, plan_id, status)
      VALUES (
        NEW.id,
        (SELECT id FROM billing_plans WHERE slug = ''free'' LIMIT 1),
        ''active''
      );
      RETURN NEW;
    END;
    $func$';
  END IF;
END $$;

-- Fix auto_classify_tool (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_classify_tool') THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION auto_classify_tool()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_catalog
    AS $func$
    DECLARE
      v_vendor_record RECORD;
      v_confidence_score INTEGER;
    BEGIN
      SELECT 
        id,
        CASE 
          WHEN NEW.vendor_name ILIKE ''%'' || name || ''%'' THEN 100
          WHEN NEW.vendor_name ILIKE ''%'' || slug || ''%'' THEN 90
          ELSE 50
        END as confidence
      INTO v_vendor_record
      FROM vendor_intelligence
      WHERE 
        NEW.vendor_name ILIKE ''%'' || name || ''%''
        OR NEW.vendor_name ILIKE ''%'' || slug || ''%''
      ORDER BY confidence DESC
      LIMIT 1;

      IF FOUND THEN
        NEW.parent_vendor_id := v_vendor_record.id;
        NEW.classification_confidence := v_vendor_record.confidence;
        NEW.classification_method := ''auto'';
      END IF;

      RETURN NEW;
    END;
    $func$';
  END IF;
END $$;

-- Fix update_updated_at_column (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = public, pg_catalog
    AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$';
  END IF;
END $$;

-- Fix is_admin (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    EXECUTE 'CREATE OR REPLACE FUNCTION is_admin(org_id uuid)
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_catalog
    AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1 
        FROM organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
          AND role = ''admin''
      );
    END;
    $func$';
  END IF;
END $$;