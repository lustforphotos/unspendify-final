/*
  # Rename token fields to remove "_encrypted" suffix

  1. Changes
    - Rename `access_token_encrypted` to `access_token`
    - Rename `refresh_token_encrypted` to `refresh_token`
    
  2. Security Note
    - These fields are not actually encrypted, just stored as plain text
    - Renaming to reflect actual implementation
    - In production, consider using Supabase Vault for true encryption
*/

DO $$
BEGIN
  -- Rename access_token_encrypted to access_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_connections' AND column_name = 'access_token_encrypted'
  ) THEN
    ALTER TABLE email_connections RENAME COLUMN access_token_encrypted TO access_token;
  END IF;

  -- Rename refresh_token_encrypted to refresh_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_connections' AND column_name = 'refresh_token_encrypted'
  ) THEN
    ALTER TABLE email_connections RENAME COLUMN refresh_token_encrypted TO refresh_token;
  END IF;
END $$;
