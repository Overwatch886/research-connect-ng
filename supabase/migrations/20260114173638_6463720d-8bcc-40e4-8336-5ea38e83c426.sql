-- 1. Create app_role enum type
CREATE TYPE public.app_role AS ENUM ('researcher', 'participant');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create policy - users can only view their own roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies = role changes only via trigger or admin

-- 5. Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::app_role
FROM public.profiles
WHERE role IN ('researcher', 'participant')
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Create trigger function to prevent role changes on profiles table
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role cannot be changed directly. Use the user_roles table.';
  END IF;
  RETURN NEW;
END;
$$;

-- 8. Add trigger to profiles table
CREATE TRIGGER prevent_role_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- 9. Update handle_new_user to also insert into user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
BEGIN
  -- Validate and sanitize role - only allow 'researcher' or 'participant'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'researcher');
  IF user_role NOT IN ('researcher', 'participant') THEN
    user_role := 'researcher';
  END IF;
  
  -- Sanitize full_name - trim, limit length, provide default
  user_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User');
  -- Limit to 100 characters
  user_full_name := LEFT(user_full_name, 100);
  
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    user_role
  );
  
  -- Also insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);
  
  RETURN NEW;
END;
$$;