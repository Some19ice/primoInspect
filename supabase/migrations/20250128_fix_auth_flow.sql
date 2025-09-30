-- Fix Authentication Flow
-- Ensures profiles are created automatically for new users

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar, is_active, created_at, updated_at, last_login_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'INSPECTOR'),
    NEW.raw_user_meta_data->>'avatar',
    true,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    avatar = COALESCE(EXCLUDED.avatar, profiles.avatar),
    updated_at = NOW(),
    last_login_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile on user metadata change
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if metadata actually changed
  IF NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
    UPDATE public.profiles SET
      name = COALESCE(NEW.raw_user_meta_data->>'name', profiles.name),
      role = COALESCE(NEW.raw_user_meta_data->>'role', profiles.role),
      avatar = COALESCE(NEW.raw_user_meta_data->>'avatar', profiles.avatar),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  -- Update last login time on any auth change
  UPDATE public.profiles SET
    last_login_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile when user metadata changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_metadata_update();

-- Create some demo auth users and profiles for testing
-- Note: These would normally be created through Supabase Auth UI or signup process

-- Update RLS policies to be more permissive for profile creation
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'service_role' OR
    -- Allow profile creation during signup process
    true
  );

-- Allow users to update their own profile or system updates
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    auth.role() = 'service_role'
  ) WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'service_role'
  );

-- Create demo user credentials for testing
-- These are just examples - in production, users would sign up normally

INSERT INTO public.profiles (id, email, name, role, is_active, created_at, updated_at, last_login_at) VALUES
  -- Demo users with predictable UUIDs for testing
  ('00000000-0000-0000-0000-000000000001', 'executive@demo.com', 'Demo Executive', 'EXECUTIVE', true, NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'manager@demo.com', 'Demo Manager', 'PROJECT_MANAGER', true, NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'inspector@demo.com', 'Demo Inspector', 'INSPECTOR', true, NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;