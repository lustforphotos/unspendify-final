/*
  # Add Tool Classification System

  1. Schema Changes
    - Add classification fields to `detected_tools` table
      - `marketing_relevance_score` (integer) - 0-100 score for marketing relevance
      - `tool_category` (text) - 'marketing', 'marketing_adjacent', 'other'
      - `classification_confidence` (integer) - 0-100 confidence in classification
      - `classification_source` (text) - 'vendor', 'email_context', 'ownership', 'behavior'
      - `last_classified_at` (timestamptz) - When classification was last updated
    
  2. New Tables
    - `vendor_intelligence`
      - `id` (uuid, primary key)
      - `vendor_name` (text) - Normalized vendor name
      - `default_relevance_score` (integer) - Default marketing relevance (0-100)
      - `category_hint` (text) - Suggested category
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `tool_classification_corrections`
      - `id` (uuid, primary key)
      - `tool_id` (uuid, references detected_tools)
      - `user_id` (uuid, references users)
      - `correction_type` (text) - 'not_marketing', 'belongs_to', 'ignore'
      - `previous_category` (text)
      - `new_category` (text)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on new tables
    - Allow organization members to view and update classifications

  4. Seed Data
    - Insert common vendor intelligence mappings

  5. Important Notes
    - Classification is probabilistic and mutable
    - Never blocks tool detection or memory
    - Used only for alert relevance filtering
*/

-- Add classification fields to detected_tools
ALTER TABLE detected_tools 
  ADD COLUMN IF NOT EXISTS marketing_relevance_score integer DEFAULT 0 CHECK (marketing_relevance_score >= 0 AND marketing_relevance_score <= 100),
  ADD COLUMN IF NOT EXISTS tool_category text DEFAULT 'other' CHECK (tool_category IN ('marketing', 'marketing_adjacent', 'other')),
  ADD COLUMN IF NOT EXISTS classification_confidence integer DEFAULT 0 CHECK (classification_confidence >= 0 AND classification_confidence <= 100),
  ADD COLUMN IF NOT EXISTS classification_source text DEFAULT 'vendor',
  ADD COLUMN IF NOT EXISTS last_classified_at timestamptz DEFAULT now();

-- Create vendor intelligence table
CREATE TABLE IF NOT EXISTS vendor_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text UNIQUE NOT NULL,
  normalized_vendor text NOT NULL,
  default_relevance_score integer NOT NULL DEFAULT 0 CHECK (default_relevance_score >= 0 AND default_relevance_score <= 100),
  category_hint text CHECK (category_hint IN ('marketing', 'marketing_adjacent', 'other', 'infra', 'engineering', 'finance', 'productivity')),
  common_keywords text[], -- Keywords often found in emails
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tool classification corrections table
CREATE TABLE IF NOT EXISTS tool_classification_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES detected_tools(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  correction_type text NOT NULL CHECK (correction_type IN ('not_marketing', 'belongs_to', 'ignore', 'is_marketing')),
  previous_category text,
  new_category text,
  relevance_adjustment integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_classification_corrections ENABLE ROW LEVEL SECURITY;

-- Vendor intelligence is publicly readable
CREATE POLICY "Vendor intelligence is publicly readable"
  ON vendor_intelligence FOR SELECT
  TO authenticated
  USING (true);

-- System can manage vendor intelligence
CREATE POLICY "System can manage vendor intelligence"
  ON vendor_intelligence FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Organization members can view their corrections
CREATE POLICY "Organization members can view corrections"
  ON tool_classification_corrections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM detected_tools dt
      JOIN organization_members om ON om.organization_id = dt.organization_id
      WHERE dt.id = tool_classification_corrections.tool_id
      AND om.user_id = auth.uid()
    )
  );

-- Organization members can insert corrections
CREATE POLICY "Organization members can insert corrections"
  ON tool_classification_corrections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM detected_tools dt
      JOIN organization_members om ON om.organization_id = dt.organization_id
      WHERE dt.id = tool_classification_corrections.tool_id
      AND om.user_id = auth.uid()
    )
  );

-- Seed vendor intelligence data
INSERT INTO vendor_intelligence (vendor_name, normalized_vendor, default_relevance_score, category_hint, common_keywords) VALUES
  -- High marketing relevance (95-100)
  ('HubSpot', 'hubspot', 95, 'marketing', ARRAY['campaign', 'crm', 'marketing', 'leads', 'contacts']),
  ('Google Ads', 'google_ads', 98, 'marketing', ARRAY['ads', 'campaign', 'advertising', 'ppc']),
  ('Mailchimp', 'mailchimp', 95, 'marketing', ARRAY['email', 'campaign', 'newsletter', 'subscribers']),
  ('Marketo', 'marketo', 95, 'marketing', ARRAY['automation', 'campaign', 'leads', 'nurture']),
  ('Salesforce Marketing Cloud', 'salesforce_mc', 95, 'marketing', ARRAY['campaign', 'journey', 'email', 'automation']),
  ('ActiveCampaign', 'activecampaign', 95, 'marketing', ARRAY['automation', 'email', 'crm', 'campaign']),
  ('Klaviyo', 'klaviyo', 95, 'marketing', ARRAY['email', 'sms', 'campaign', 'flows']),
  ('Intercom', 'intercom', 90, 'marketing', ARRAY['messaging', 'engagement', 'campaigns', 'users']),
  ('Segment', 'segment', 85, 'marketing', ARRAY['analytics', 'tracking', 'events', 'data']),
  ('Amplitude', 'amplitude', 85, 'marketing', ARRAY['analytics', 'product', 'events', 'users']),
  ('Mixpanel', 'mixpanel', 85, 'marketing', ARRAY['analytics', 'product', 'events', 'funnels']),
  
  -- Medium-high marketing relevance (70-94)
  ('Salesforce', 'salesforce', 80, 'marketing_adjacent', ARRAY['crm', 'sales', 'opportunities', 'leads']),
  ('LinkedIn Ads', 'linkedin_ads', 90, 'marketing', ARRAY['ads', 'campaign', 'sponsored']),
  ('Facebook Ads', 'facebook_ads', 90, 'marketing', ARRAY['ads', 'campaign', 'advertising']),
  ('Ahrefs', 'ahrefs', 85, 'marketing', ARRAY['seo', 'keywords', 'backlinks', 'rank']),
  ('SEMrush', 'semrush', 85, 'marketing', ARRAY['seo', 'keywords', 'advertising', 'analytics']),
  ('Zapier', 'zapier', 70, 'marketing_adjacent', ARRAY['automation', 'integration', 'workflow']),
  ('Calendly', 'calendly', 70, 'marketing_adjacent', ARRAY['scheduling', 'meetings', 'bookings']),
  
  -- Medium marketing relevance (40-69)
  ('Notion', 'notion', 55, 'productivity', ARRAY['workspace', 'docs', 'wiki', 'collaboration']),
  ('Figma', 'figma', 50, 'productivity', ARRAY['design', 'prototype', 'collaboration']),
  ('Slack', 'slack', 50, 'productivity', ARRAY['messaging', 'chat', 'workspace', 'channels']),
  ('Zoom', 'zoom', 45, 'productivity', ARRAY['meetings', 'video', 'conferencing']),
  ('Google Workspace', 'google_workspace', 50, 'productivity', ARRAY['email', 'docs', 'drive', 'calendar']),
  ('Microsoft 365', 'microsoft_365', 50, 'productivity', ARRAY['email', 'office', 'teams', 'onedrive']),
  ('Dropbox', 'dropbox', 40, 'productivity', ARRAY['storage', 'files', 'sharing']),
  
  -- Low marketing relevance (10-39)
  ('Stripe', 'stripe', 40, 'finance', ARRAY['payment', 'billing', 'invoices', 'transactions']),
  ('AWS', 'aws', 10, 'infra', ARRAY['cloud', 'compute', 'storage', 's3', 'ec2']),
  ('GitHub', 'github', 20, 'engineering', ARRAY['repository', 'code', 'commits', 'actions']),
  ('GitLab', 'gitlab', 20, 'engineering', ARRAY['repository', 'code', 'ci', 'devops']),
  ('Vercel', 'vercel', 15, 'infra', ARRAY['hosting', 'deployment', 'serverless']),
  ('Heroku', 'heroku', 15, 'infra', ARRAY['hosting', 'deployment', 'dyno']),
  ('DigitalOcean', 'digitalocean', 10, 'infra', ARRAY['cloud', 'droplet', 'server', 'hosting']),
  ('MongoDB Atlas', 'mongodb', 10, 'infra', ARRAY['database', 'storage', 'cluster']),
  ('Supabase', 'supabase', 10, 'infra', ARRAY['database', 'backend', 'auth', 'storage']),
  ('Datadog', 'datadog', 15, 'infra', ARRAY['monitoring', 'logs', 'apm', 'infrastructure']),
  ('Sentry', 'sentry', 15, 'engineering', ARRAY['errors', 'monitoring', 'performance', 'tracking']),
  ('PagerDuty', 'pagerduty', 10, 'infra', ARRAY['incident', 'alerts', 'on-call', 'monitoring']),
  ('Jira', 'jira', 30, 'engineering', ARRAY['project', 'tickets', 'issues', 'sprint']),
  ('Linear', 'linear', 30, 'engineering', ARRAY['issues', 'project', 'tickets', 'roadmap']),
  ('Asana', 'asana', 40, 'productivity', ARRAY['project', 'tasks', 'workflow', 'team'])
ON CONFLICT (vendor_name) DO UPDATE SET
  normalized_vendor = EXCLUDED.normalized_vendor,
  default_relevance_score = EXCLUDED.default_relevance_score,
  category_hint = EXCLUDED.category_hint,
  common_keywords = EXCLUDED.common_keywords,
  updated_at = now();

-- Create function to auto-classify tools based on vendor
CREATE OR REPLACE FUNCTION auto_classify_tool()
RETURNS TRIGGER AS $$
DECLARE
  vendor_intel RECORD;
  relevance_score integer;
  category text;
BEGIN
  -- Look up vendor intelligence
  SELECT * INTO vendor_intel
  FROM vendor_intelligence
  WHERE LOWER(vendor_intelligence.vendor_name) = LOWER(NEW.vendor_name)
     OR LOWER(vendor_intelligence.normalized_vendor) = LOWER(NEW.normalized_vendor)
  LIMIT 1;

  IF FOUND THEN
    relevance_score := vendor_intel.default_relevance_score;
    
    -- Determine category based on score
    IF relevance_score >= 70 THEN
      category := 'marketing';
    ELSIF relevance_score >= 40 THEN
      category := 'marketing_adjacent';
    ELSE
      category := 'other';
    END IF;
    
    NEW.marketing_relevance_score := relevance_score;
    NEW.tool_category := category;
    NEW.classification_confidence := 80; -- High confidence from vendor match
    NEW.classification_source := 'vendor';
    NEW.last_classified_at := now();
  ELSE
    -- Unknown vendor, default to medium relevance
    NEW.marketing_relevance_score := 50;
    NEW.tool_category := 'marketing_adjacent';
    NEW.classification_confidence := 30; -- Low confidence
    NEW.classification_source := 'vendor';
    NEW.last_classified_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-classification on insert
DROP TRIGGER IF EXISTS auto_classify_tool_on_insert ON detected_tools;
CREATE TRIGGER auto_classify_tool_on_insert
  BEFORE INSERT ON detected_tools
  FOR EACH ROW
  EXECUTE FUNCTION auto_classify_tool();

-- Update existing tools with classification
UPDATE detected_tools dt
SET 
  marketing_relevance_score = COALESCE(vi.default_relevance_score, 50),
  tool_category = CASE 
    WHEN COALESCE(vi.default_relevance_score, 50) >= 70 THEN 'marketing'
    WHEN COALESCE(vi.default_relevance_score, 50) >= 40 THEN 'marketing_adjacent'
    ELSE 'other'
  END,
  classification_confidence = CASE 
    WHEN vi.id IS NOT NULL THEN 80
    ELSE 30
  END,
  classification_source = 'vendor',
  last_classified_at = now()
FROM vendor_intelligence vi
WHERE LOWER(vi.vendor_name) = LOWER(dt.vendor_name)
   OR LOWER(vi.normalized_vendor) = LOWER(dt.normalized_vendor);

-- Update tools without vendor match
UPDATE detected_tools
SET 
  marketing_relevance_score = 50,
  tool_category = 'marketing_adjacent',
  classification_confidence = 30,
  classification_source = 'vendor',
  last_classified_at = now()
WHERE marketing_relevance_score = 0;
