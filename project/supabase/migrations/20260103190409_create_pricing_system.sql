/*
  # Create Pricing System

  1. New Tables
    - `plans`
      - `id` (text, primary key) - Plan identifier (free, starter, growth)
      - `name` (text) - Display name
      - `price_usd` (integer) - Price in cents
      - `tool_limit` (integer) - Maximum tools tracked
      - `inbox_limit` (integer) - Maximum inbox connections (0 = unlimited)
      - `scan_months` (integer) - Historical scan depth
      - `created_at` (timestamptz) - Creation timestamp
    
    - `billing_subscriptions`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `plan_id` (text, references plans)
      - `stripe_customer_id` (text) - Stripe customer ID
      - `stripe_subscription_id` (text) - Stripe subscription ID
      - `status` (text) - Subscription status (active, canceled, past_due, etc.)
      - `current_period_end` (timestamptz) - Current billing period end
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Plans table: publicly readable
    - Billing subscriptions table: organization members can read their subscription

  3. Seed Data
    - Insert three plans: free, starter, growth

  4. Important Notes
    - Tool limits apply to visibility and alerts, NOT detection
    - inbox_limit of 0 means unlimited
    - All organizations start on free plan by default
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_usd integer NOT NULL DEFAULT 0,
  tool_limit integer NOT NULL,
  inbox_limit integer NOT NULL,
  scan_months integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create billing_subscriptions table
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  plan_id text REFERENCES plans(id) NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable (no auth required)
CREATE POLICY "Plans are publicly readable"
  ON plans FOR SELECT
  TO public
  USING (true);

-- Billing subscriptions: organization members can read their subscription
CREATE POLICY "Organization members can view subscription"
  ON billing_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = billing_subscriptions.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Billing subscriptions: system can insert/update (for webhooks and initial setup)
CREATE POLICY "System can manage subscriptions"
  ON billing_subscriptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed plans data
INSERT INTO plans (id, name, price_usd, tool_limit, inbox_limit, scan_months) VALUES
  ('free', 'Free', 0, 5, 1, 3),
  ('starter', 'Starter', 1900, 15, 2, 12),
  ('growth', 'Growth', 4900, 50, 0, 24)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_usd = EXCLUDED.price_usd,
  tool_limit = EXCLUDED.tool_limit,
  inbox_limit = EXCLUDED.inbox_limit,
  scan_months = EXCLUDED.scan_months;

-- Create function to initialize subscription for new organizations
CREATE OR REPLACE FUNCTION initialize_organization_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO billing_subscriptions (organization_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create free subscription for new organizations
DROP TRIGGER IF EXISTS on_organization_created_init_subscription ON organizations;
CREATE TRIGGER on_organization_created_init_subscription
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION initialize_organization_subscription();

-- Backfill subscriptions for existing organizations
INSERT INTO billing_subscriptions (organization_id, plan_id, status)
SELECT id, 'free', 'active'
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM billing_subscriptions)
ON CONFLICT (organization_id) DO NOTHING;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_billing_subscriptions_updated_at ON billing_subscriptions;
CREATE TRIGGER update_billing_subscriptions_updated_at
  BEFORE UPDATE ON billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
