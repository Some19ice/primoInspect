-- Temporarily make profiles more accessible during auth flow
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- Create more permissive policies for profiles
CREATE POLICY "Authenticated users can access profiles" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow service role to manage profiles
CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');
