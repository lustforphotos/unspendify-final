/*
  # Auto-setup New Users

  ## Changes
  - Creates a trigger function that automatically:
    1. Creates a user record in the users table
    2. Creates a default organization for the user
    3. Adds the user as an admin member of their organization
  - Triggers on new user signup in auth.users

  ## Security
  - Uses security definer to bypass RLS during setup
  - Only runs on INSERT to auth.users (user signup)
*/

-- Create function to setup new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
END;
$$;

-- Create trigger to run the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
