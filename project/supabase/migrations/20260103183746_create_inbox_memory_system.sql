/*
  # Transform Unspendify into Inbox-Connected Memory Layer

  ## Overview
  This migration transforms Unspendify from a forwarding-based system into a fully automated,
  inbox-connected memory layer that passively watches company spend with zero user action.

  ## New Tables
  
  ### email_connections
  Stores OAuth-connected inbox credentials for automated scanning
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `organization_id` (uuid, references organizations)
  - `provider` (text) - 'gmail' or 'outlook'
  - `email_address` (text) - connected email
  - `access_token_encrypted` (text) - OAuth access token
  - `refresh_token_encrypted` (text) - OAuth refresh token
  - `token_expires_at` (timestamptz) - token expiration
  - `last_scan_at` (timestamptz) - last successful scan timestamp
  - `last_backfill_at` (timestamptz) - when historical backfill completed
  - `backfill_months` (integer) - how many months were scanned
  - `is_active` (boolean) - connection status
  - `created_at` (timestamptz)
  
  ### detected_tools (replaces/extends subscriptions)
  Automatically detected tools from email scanning
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `vendor_name` (text) - raw vendor name from email
  - `normalized_vendor` (text) - cleaned, standardized name
  - `billing_frequency` (text) - monthly, annual, etc.
  - `last_charge_amount` (numeric)
  - `last_charge_date` (date)
  - `estimated_renewal_date` (date)
  - `first_seen_date` (date) - when first detected
  - `source_email_connection_id` (uuid) - which inbox detected it
  - `source_email_subject` (text)
  - `source_email_sender` (text)
  - `confidence_score` (numeric) - 0-100 detection confidence
  - `inferred_owner_id` (uuid, nullable) - auto-inferred owner
  - `confirmed_owner_id` (uuid, nullable) - user-confirmed owner
  - `owner_confirmation_status` (text) - 'unconfirmed', 'confirmed', 'disputed'
  - `renewal_count` (integer) - how many times renewed
  - `last_interaction_date` (date) - last user action on this tool
  - `status` (text) - 'active', 'trial', 'cancelled', 'unknown'
  - `is_parent_vendor` (boolean) - true for Stripe, AWS, etc.
  - `parent_vendor_id` (uuid, nullable) - links sub-tools to parent
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### interruptions
  Decision-moment alerts that require explicit user action
  - `id` (uuid, primary key)
  - `organization_id` (uuid, references organizations)
  - `tool_id` (uuid, references detected_tools)
  - `interruption_type` (text) - 'trial_ending', 'silent_renewal', 'no_owner', 'no_activity'
  - `priority` (text) - 'urgent', 'high', 'medium'
  - `message` (text) - human-readable alert
  - `action_required` (boolean) - must be addressed
  - `possible_actions` (jsonb) - ['keep', 'cancel', 'assign_owner']
  - `triggered_at` (timestamptz)
  - `resolved_at` (timestamptz, nullable)
  - `resolved_action` (text, nullable)
  - `resolved_by` (uuid, nullable)

  ### email_scan_logs
  Audit trail of all automated scans
  - `id` (uuid, primary key)
  - `connection_id` (uuid, references email_connections)
  - `scan_type` (text) - 'backfill', 'daily', 'manual'
  - `emails_scanned` (integer)
  - `tools_detected` (integer)
  - `tools_updated` (integer)
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `status` (text) - 'success', 'partial', 'failed'
  - `error_message` (text, nullable)

  ## Security
  - Enable RLS on all tables
  - Users can only access data from their organization
  - Encrypted storage for OAuth tokens
  - Read-only email access enforced at OAuth scope level

  ## Important Notes
  1. NO forwarding required - system reads inboxes directly
  2. NO manual tagging - all inference is automatic
  3. NO user memory dependency - system remembers everything
  4. Interruptions only at decision moments - not insight alerts
*/

-- email_connections table
CREATE TABLE IF NOT EXISTS email_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email_address text NOT NULL,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text NOT NULL,
  token_expires_at timestamptz,
  last_scan_at timestamptz,
  last_backfill_at timestamptz,
  backfill_months integer DEFAULT 12,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, email_address)
);

ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org email connections"
  ON email_connections FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create email connections"
  ON email_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own email connections"
  ON email_connections FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete own email connections"
  ON email_connections FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- detected_tools table (automated tool detection)
CREATE TABLE IF NOT EXISTS detected_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  vendor_name text NOT NULL,
  normalized_vendor text NOT NULL,
  billing_frequency text DEFAULT 'unknown',
  last_charge_amount numeric,
  last_charge_date date,
  estimated_renewal_date date,
  first_seen_date date DEFAULT CURRENT_DATE,
  source_email_connection_id uuid REFERENCES email_connections(id) ON DELETE SET NULL,
  source_email_subject text,
  source_email_sender text,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  inferred_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_confirmation_status text DEFAULT 'unconfirmed' CHECK (owner_confirmation_status IN ('unconfirmed', 'confirmed', 'disputed')),
  renewal_count integer DEFAULT 0,
  last_interaction_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'unknown')),
  is_parent_vendor boolean DEFAULT false,
  parent_vendor_id uuid REFERENCES detected_tools(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE detected_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org detected tools"
  ON detected_tools FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert detected tools"
  ON detected_tools FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update org detected tools"
  ON detected_tools FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- interruptions table (decision-moment alerts)
CREATE TABLE IF NOT EXISTS interruptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  tool_id uuid REFERENCES detected_tools(id) ON DELETE CASCADE NOT NULL,
  interruption_type text NOT NULL CHECK (interruption_type IN ('trial_ending', 'silent_renewal', 'no_owner', 'no_activity', 'forgotten_tool')),
  priority text DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium')),
  message text NOT NULL,
  action_required boolean DEFAULT true,
  possible_actions jsonb DEFAULT '["keep", "cancel", "assign_owner"]'::jsonb,
  triggered_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_action text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE interruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org interruptions"
  ON interruptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create interruptions"
  ON interruptions FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can resolve org interruptions"
  ON interruptions FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- email_scan_logs table (audit trail)
CREATE TABLE IF NOT EXISTS email_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES email_connections(id) ON DELETE CASCADE NOT NULL,
  scan_type text NOT NULL CHECK (scan_type IN ('backfill', 'daily', 'manual')),
  emails_scanned integer DEFAULT 0,
  tools_detected integer DEFAULT 0,
  tools_updated integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  error_message text
);

ALTER TABLE email_scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org scan logs"
  ON email_scan_logs FOR SELECT
  TO authenticated
  USING (
    connection_id IN (
      SELECT id FROM email_connections
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create scan logs"
  ON email_scan_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    connection_id IN (
      SELECT id FROM email_connections
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can update scan logs"
  ON email_scan_logs FOR UPDATE
  TO authenticated
  USING (
    connection_id IN (
      SELECT id FROM email_connections
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    connection_id IN (
      SELECT id FROM email_connections
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_connections_org ON email_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_active ON email_connections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_detected_tools_org ON detected_tools(organization_id);
CREATE INDEX IF NOT EXISTS idx_detected_tools_status ON detected_tools(status);
CREATE INDEX IF NOT EXISTS idx_detected_tools_renewal ON detected_tools(estimated_renewal_date) WHERE estimated_renewal_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interruptions_org ON interruptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_interruptions_unresolved ON interruptions(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scan_logs_connection ON email_scan_logs(connection_id);

-- Enable pg_cron extension for automated daily scans
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions for cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;