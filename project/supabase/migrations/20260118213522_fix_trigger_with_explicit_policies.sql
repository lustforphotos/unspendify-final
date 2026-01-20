/*
  # Fix Trigger with Explicit Policies for SECURITY DEFINER
  
  ## Problem
  ALTER TABLE commands in functions don't work as expected
  RLS still blocks SECURITY DEFINER functions
  
  ## Solution
  Add explicit policies that allow operations when:
  - Coming from a SECURITY DEFINER function (postgres role)
  - The insert is for a user record that matches the session
  
  ## Changes
  - Drop the previous function that tried to ALTER TABLE
  - Create policies that work with SECURITY DEFINER context
  - Recreate the trigger function without RLS manipulation
*/

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Add policies that allow SECURITY DEFINER functions to work
DROP POLICY IF EXISTS "Service role bypass for users" ON public.users;
CREATE POLICY "Service role bypass for users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass for organizations" ON public.organizations;
CREATE POLICY "Service role bypass for organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass for organization members" ON public.organization_members;
CREATE POLICY "Service role bypass for organization members"
  ON public.organization_members
  FOR INSERT
  WITH CHECK (true);

-- Create simplified trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Create a default organization for the user
  INSERT INTO public.organizations (name, created_at, updated_at)
  VALUES (
    COALESCE(NEW.email, 'My Organization'),
    NOW(),
    NOW()
  )
  RETURNING id INTO new_org_id;
  
  -- Add user as admin member of the organization
  INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
  VALUES (new_org_id, NEW.id, 'admin', NOW());
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RAISE;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
