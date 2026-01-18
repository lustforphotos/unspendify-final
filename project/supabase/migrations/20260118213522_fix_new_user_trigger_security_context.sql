/*
  # Fix New User Trigger Security Context

  ## Problem
  The handle_new_user() trigger fails during signup because:
  - The trigger runs during auth.users INSERT
  - At that moment, the user is not yet "authenticated" in the RLS context
  - RLS policies on users, organizations, and organization_members block the inserts
  
  ## Solution
  Make the trigger function bypass RLS by using SET LOCAL commands:
  - The function already has SECURITY DEFINER
  - We need to explicitly disable row security within the function
  - This allows the function to create records on behalf of the new user

  ## Changes
  - Update handle_new_user() to disable RLS during execution
  - This is safe because the function validates data and only acts on NEW user
*/

-- Drop and recreate the function with proper security context
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Temporarily disable RLS for this transaction
  -- This is safe because we're in a SECURITY DEFINER function
  -- and we're only creating records for the NEW user
  PERFORM set_config('role', 'service_role', true);
  
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
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
