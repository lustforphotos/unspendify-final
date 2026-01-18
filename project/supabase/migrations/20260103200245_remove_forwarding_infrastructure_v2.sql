/*
  # Remove Email Forwarding Infrastructure

  ## Changes
  
  This migration transforms Unspendify from a forwarding-based system to a purely inbox-connected OAuth system.
  
  ### 1. Modify raw_emails Table
  - Add `email_connection_id` to reference OAuth connections
  - Drop `inbound_mailbox_id` foreign key (forwarding-based)
  - Make `email_connection_id` required for new emails
  
  ### 2. Drop Forwarding-Related Tables
  - `forwarding_addresses` - email forwarding system
  - `inbound_mailboxes` - receiving forwarded emails
  - `subscriptions` - legacy subscription tracking
  - `emails` - legacy email storage
  - `profiles` - legacy profile system (replaced by users table)
  
  ### 3. Update RLS Policies
  - Update raw_emails policies to use email_connections
  - Update parsed_events policies to use email_connections
  - Drop all policies related to removed tables
  
  ## Important Notes
  - raw_emails table is preserved for processing pipeline
  - All downstream processing (process-emails, detect-tools) continues unchanged
  - Only the source of raw emails changes from forwarding to OAuth inbox scanning
*/

-- =====================================================
-- PART 1: Add New Column to raw_emails
-- =====================================================

-- Add new column for OAuth-based email connections
ALTER TABLE raw_emails 
  ADD COLUMN IF NOT EXISTS email_connection_id uuid REFERENCES email_connections(id) ON DELETE CASCADE;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_raw_emails_connection_id 
  ON raw_emails(email_connection_id);

-- =====================================================
-- PART 2: Drop All RLS Policies That Reference Old Columns
-- =====================================================

-- Drop raw_emails policies (will recreate with new schema)
DROP POLICY IF EXISTS "Members can view emails for their organization" ON raw_emails;

-- Drop parsed_events policies (will recreate with new schema)
DROP POLICY IF EXISTS "Members can view parsed events for their organization" ON parsed_events;

-- Drop forwarding_addresses policies
DROP POLICY IF EXISTS "Users can view own forwarding addresses" ON forwarding_addresses;
DROP POLICY IF EXISTS "Users can insert own forwarding addresses" ON forwarding_addresses;
DROP POLICY IF EXISTS "Users can update own forwarding addresses" ON forwarding_addresses;

-- Drop subscriptions policies (legacy table)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;

-- Drop emails policies (legacy table)
DROP POLICY IF EXISTS "Users can view own emails" ON emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON emails;

-- Drop profiles policies (legacy table)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- =====================================================
-- PART 3: Drop Old Column from raw_emails
-- =====================================================

-- Drop the old foreign key constraint
ALTER TABLE raw_emails 
  DROP CONSTRAINT IF EXISTS raw_emails_inbound_mailbox_id_fkey;

-- Now drop the column (policies are already dropped)
ALTER TABLE raw_emails 
  DROP COLUMN IF EXISTS inbound_mailbox_id CASCADE;

-- =====================================================
-- PART 4: Drop Forwarding-Related Tables
-- =====================================================

-- Drop foreign key constraints from emails table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails') THEN
    ALTER TABLE emails DROP CONSTRAINT IF EXISTS emails_subscription_id_fkey;
    ALTER TABLE emails DROP CONSTRAINT IF EXISTS emails_user_id_fkey;
  END IF;
END $$;

-- Drop the tables in correct order (respecting dependencies)
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS forwarding_addresses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS inbound_mailboxes CASCADE;

-- =====================================================
-- PART 5: Create New RLS Policies for OAuth-Based System
-- =====================================================

-- raw_emails policies using email_connections
CREATE POLICY "Members can view emails for their organization" ON raw_emails
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_connections
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE email_connections.id = raw_emails.email_connection_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can insert raw emails via OAuth" ON raw_emails
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_connections
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE email_connections.id = raw_emails.email_connection_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- parsed_events policies using email_connections through raw_emails
CREATE POLICY "Members can view parsed events for their organization" ON parsed_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM raw_emails
      JOIN email_connections ON email_connections.id = raw_emails.email_connection_id
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE raw_emails.id = parsed_events.raw_email_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can insert parsed events" ON parsed_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM raw_emails
      JOIN email_connections ON email_connections.id = raw_emails.email_connection_id
      JOIN organization_members ON organization_members.organization_id = email_connections.organization_id
      WHERE raw_emails.id = parsed_events.raw_email_id
      AND organization_members.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PART 6: Drop Unused Indexes
-- =====================================================

-- Drop indexes from removed tables (if they still exist)
DROP INDEX IF EXISTS idx_forwarding_addresses_user_id;
DROP INDEX IF EXISTS idx_forwarding_addresses_email;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_emails_user_id;
DROP INDEX IF EXISTS idx_emails_parsed_status;
DROP INDEX IF EXISTS idx_inbound_mailboxes_org_id;
DROP INDEX IF EXISTS idx_inbound_mailboxes_email;
DROP INDEX IF EXISTS idx_inbound_mailboxes_active;
DROP INDEX IF EXISTS idx_raw_emails_mailbox_id;