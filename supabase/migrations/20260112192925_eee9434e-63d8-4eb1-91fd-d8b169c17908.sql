-- Update handle_new_user function to validate role and sanitize full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;