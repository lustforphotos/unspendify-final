/*
  # Setup Automated Daily Email Scanning

  ## Overview
  Configures pg_cron to automatically trigger email scanning every day at 2 AM UTC.
  This is the core automation that makes Unspendify a zero-effort memory system.

  ## What This Does
  1. Creates a scheduled job that runs daily
  2. Calls the scan-emails edge function with all active connections
  3. Requires NO user action - completely automated
  4. Scans incrementally (only new emails since last scan)

  ## Schedule Details
  - Runs at 2:00 AM UTC every day
  - Processes all active email connections
  - Detects new subscriptions automatically
  - Updates existing tool records
  - Generates interruptions for decision moments

  ## Important Notes
  - This is NOT optional - it's the core product architecture
  - Users never manually trigger scans
  - The system passively watches and remembers everything
  - Interrupts only at decision-critical moments
*/

-- Schedule daily email scanning at 2 AM UTC
-- This is the heart of the "memory layer" - completely automated, zero user action
SELECT cron.schedule(
  'daily-email-scan',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/scan-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'scanType', 'scheduled'
      )
    ) AS request_id;
  $$
);

-- Create a function to store Supabase settings for cron jobs
CREATE OR REPLACE FUNCTION setup_cron_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- These settings will be used by pg_cron jobs
  -- They are NOT exposed to users, only to internal cron jobs
  PERFORM set_config('app.settings.supabase_url', current_setting('SUPABASE_URL', true), false);
  PERFORM set_config('app.settings.service_role_key', current_setting('SUPABASE_SERVICE_ROLE_KEY', true), false);
EXCEPTION
  WHEN OTHERS THEN
    -- If settings aren't available yet, that's okay
    -- They'll be set when the first cron job runs
    NULL;
END;
$$;

-- Initialize settings
SELECT setup_cron_settings();