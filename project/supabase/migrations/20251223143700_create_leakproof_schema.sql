/*
  # Unspendify Database Schema

  ## Overview
  Complete schema for Unspendify B2B SaaS subscription management platform.
  Designed for multi-tenancy, immutable email records, and auditable detection pipeline.

  ## Tables Created

  1. **organizations** - Tenant workspaces
     - id, name, created_at, updated_at

  2. **users** - User profiles (extends auth.users)
     - id (references auth.users), email, created_at, updated_at

  3. **organization_members** - User-organization membership with roles
     - id, organization_id, user_id, role (admin/member), created_at

  4. **inbound_mailboxes** - Unique email addresses per organization
     - id, organization_id, email_address, is_active, created_at

  5. **raw_emails** - Immutable email storage
     - id, inbound_mailbox_id, from_address, subject, raw_body, received_at, checksum, created_at

  6. **parsed_events** - Extracted subscription events from emails
     - id, raw_email_id, vendor_name, amount, currency, billing_cycle, event_type, 
       detected_renewal_date, confidence_score, created_at

  7. **tools** - Detected subscriptions/tools
     - id, organization_id, vendor_name, current_amount, billing_cycle, status,
       first_detected_at, last_event_id, created_at, updated_at

  8. **tool_ownership** - Assignment of tools to team members
     - id, tool_id, owner_user_id, assigned_at

  9. **renewals** - Upcoming renewal dates
     - id, tool_id, renewal_date, amount, source_event_id, created_at

  10. **notifications** - Alert queue for reminders
      - id, organization_id, tool_id, user_id, type, scheduled_for, sent_at, status

  ## Security
  - RLS enabled on all tables
  - Policies enforce organization-based access control
  - Users can only access data from their organizations

  ## Notes
  - users table references Supabase auth.users for authentication
  - raw_emails are immutable (no UPDATE policy)
  - All timestamps use timestamptz for timezone awareness
  - Enums provide type safety for status fields
*/

-- Create enums for type safety
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly', 'unknown');
CREATE TYPE event_type AS ENUM ('trial_start', 'renewal', 'invoice', 'cancellation', 'price_change');
CREATE TYPE tool_status AS ENUM ('active', 'trial', 'cancelled');
CREATE TYPE notification_type AS ENUM ('renewal_alert', 'trial_alert', 'owner_missing');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- =====================================================
-- TABLE: organizations
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- =====================================================
-- TABLE: users
-- =====================================================
-- Links to Supabase auth.users, stores profile data
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- TABLE: organization_members
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(organization_id, role);

-- =====================================================
-- TABLE: inbound_mailboxes
-- =====================================================
CREATE TABLE IF NOT EXISTS inbound_mailboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_address text UNIQUE NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inbound_mailboxes_org_id ON inbound_mailboxes(organization_id);
CREATE INDEX IF NOT EXISTS idx_inbound_mailboxes_email ON inbound_mailboxes(email_address);
CREATE INDEX IF NOT EXISTS idx_inbound_mailboxes_active ON inbound_mailboxes(is_active) WHERE is_active = true;

-- =====================================================
-- TABLE: raw_emails (immutable)
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbound_mailbox_id uuid NOT NULL REFERENCES inbound_mailboxes(id) ON DELETE CASCADE,
  from_address text NOT NULL,
  subject text NOT NULL,
  raw_body text NOT NULL,
  received_at timestamptz NOT NULL,
  checksum text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_emails_mailbox_id ON raw_emails(inbound_mailbox_id);
CREATE INDEX IF NOT EXISTS idx_raw_emails_from_address ON raw_emails(from_address);
CREATE INDEX IF NOT EXISTS idx_raw_emails_received_at ON raw_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_emails_checksum ON raw_emails(checksum);

-- =====================================================
-- TABLE: parsed_events
-- =====================================================
CREATE TABLE IF NOT EXISTS parsed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_email_id uuid NOT NULL REFERENCES raw_emails(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  amount numeric(10, 2),
  currency text DEFAULT 'USD',
  billing_cycle billing_cycle DEFAULT 'unknown',
  event_type event_type NOT NULL,
  detected_renewal_date date,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parsed_events_raw_email_id ON parsed_events(raw_email_id);
CREATE INDEX IF NOT EXISTS idx_parsed_events_vendor_name ON parsed_events(vendor_name);
CREATE INDEX IF NOT EXISTS idx_parsed_events_event_type ON parsed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_parsed_events_renewal_date ON parsed_events(detected_renewal_date) WHERE detected_renewal_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_parsed_events_created_at ON parsed_events(created_at DESC);

-- =====================================================
-- TABLE: tools
-- =====================================================
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_name text NOT NULL,
  current_amount numeric(10, 2),
  billing_cycle billing_cycle DEFAULT 'unknown',
  status tool_status DEFAULT 'active' NOT NULL,
  first_detected_at timestamptz DEFAULT now() NOT NULL,
  last_event_id uuid REFERENCES parsed_events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tools_org_id ON tools(organization_id);
CREATE INDEX IF NOT EXISTS idx_tools_vendor_name ON tools(organization_id, vendor_name);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tools_last_event_id ON tools(last_event_id);

-- =====================================================
-- TABLE: tool_ownership
-- =====================================================
CREATE TABLE IF NOT EXISTS tool_ownership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(tool_id)
);

CREATE INDEX IF NOT EXISTS idx_tool_ownership_tool_id ON tool_ownership(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_ownership_owner_id ON tool_ownership(owner_user_id);

-- =====================================================
-- TABLE: renewals
-- =====================================================
CREATE TABLE IF NOT EXISTS renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  renewal_date date NOT NULL,
  amount numeric(10, 2) NOT NULL,
  source_event_id uuid REFERENCES parsed_events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_renewals_tool_id ON renewals(tool_id);
CREATE INDEX IF NOT EXISTS idx_renewals_date ON renewals(renewal_date);

-- =====================================================
-- TABLE: notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool_id uuid REFERENCES tools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  status notification_status DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tool_id ON notifications(tool_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, scheduled_for);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: organizations
-- =====================================================

CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: users
-- =====================================================

CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES: organization_members
-- =====================================================

CREATE POLICY "Members can view their organization memberships"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert organization members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_members.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete organization members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Admins can update organization members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: inbound_mailboxes
-- =====================================================

CREATE POLICY "Members can view their organization mailboxes"
  ON inbound_mailboxes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = inbound_mailboxes.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: raw_emails
-- =====================================================

CREATE POLICY "Members can view emails for their organization"
  ON raw_emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inbound_mailboxes
      JOIN organization_members ON organization_members.organization_id = inbound_mailboxes.organization_id
      WHERE inbound_mailboxes.id = raw_emails.inbound_mailbox_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: parsed_events
-- =====================================================

CREATE POLICY "Members can view parsed events for their organization"
  ON parsed_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM raw_emails
      JOIN inbound_mailboxes ON inbound_mailboxes.id = raw_emails.inbound_mailbox_id
      JOIN organization_members ON organization_members.organization_id = inbound_mailboxes.organization_id
      WHERE raw_emails.id = parsed_events.raw_email_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: tools
-- =====================================================

CREATE POLICY "Members can view their organization tools"
  ON tools FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their organization tools"
  ON tools FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = tools.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: tool_ownership
-- =====================================================

CREATE POLICY "Members can view tool ownership for their organization"
  ON tool_ownership FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can assign tool ownership in their organization"
  ON tool_ownership FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update tool ownership in their organization"
  ON tool_ownership FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete tool ownership in their organization"
  ON tool_ownership FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = tool_ownership.tool_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: renewals
-- =====================================================

CREATE POLICY "Members can view renewals for their organization"
  ON renewals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tools
      JOIN organization_members ON organization_members.organization_id = tools.organization_id
      WHERE tools.id = renewals.tool_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES: notifications
-- =====================================================

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());