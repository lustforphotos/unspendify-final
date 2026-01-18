/*
  # Setup Existing Users

  ## Changes
  - Finds all users in auth.users who don't have corresponding records
  - Creates missing user records, organizations, and memberships
  - Ensures all existing users can access the application

  ## Notes
  - This is a one-time fix for users who signed up before the trigger was created
  - Future users will be automatically set up by the trigger
*/

DO $$
DECLARE
  auth_user RECORD;
  new_org_id uuid;
  user_exists boolean;
BEGIN
  -- Loop through all auth.users
  FOR auth_user IN SELECT id, email FROM auth.users LOOP
    -- Check if user already exists in public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth_user.id) INTO user_exists;
    
    IF NOT user_exists THEN
      -- Insert into users table
      INSERT INTO public.users (id, email, created_at, updated_at)
      VALUES (auth_user.id, auth_user.email, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      -- Create a default organization for the user
      INSERT INTO public.organizations (name, created_at, updated_at)
      VALUES (
        COALESCE(auth_user.email, 'My Organization'),
        NOW(),
        NOW()
      )
      RETURNING id INTO new_org_id;

      -- Add user as admin member of the organization
      INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
      VALUES (new_org_id, auth_user.id, 'admin', NOW());
      
      RAISE NOTICE 'Set up user: %', auth_user.email;
    END IF;
  END LOOP;
END $$;
