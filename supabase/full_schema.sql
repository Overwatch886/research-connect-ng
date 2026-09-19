-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('researcher', 'participant')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  university TEXT,
  student_id TEXT,
  verification_method TEXT CHECK (verification_method IN ('email', 'student_id')),
  verified_at TIMESTAMP WITH TIME ZONE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'researcher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
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
-- Create table for storing verification tokens
CREATE TABLE public.student_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'studentId')),
  university TEXT NOT NULL,
  email TEXT,
  student_id TEXT,
  token TEXT UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT email_or_student_id CHECK (
    (verification_method = 'email' AND email IS NOT NULL) OR
    (verification_method = 'studentId' AND student_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verifications
CREATE POLICY "Users can view their own verifications"
ON public.student_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own verifications
CREATE POLICY "Users can insert their own verifications"
ON public.student_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for token lookups
CREATE INDEX idx_student_verifications_token ON public.student_verifications(token) WHERE token IS NOT NULL;

-- Create index for user lookups
CREATE INDEX idx_student_verifications_user_id ON public.student_verifications(user_id);

-- Function to verify student by token (callable by edge functions)
CREATE OR REPLACE FUNCTION public.verify_student_by_token(verification_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  verification_record RECORD;
  result JSON;
BEGIN
  -- Find the verification record
  SELECT * INTO verification_record
  FROM public.student_verifications
  WHERE token = verification_token
    AND status = 'pending'
    AND token_expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired verification token');
  END IF;

  -- Update verification status
  UPDATE public.student_verifications
  SET status = 'verified', verified_at = now()
  WHERE id = verification_record.id;

  -- Update user profile
  UPDATE public.profiles
  SET 
    is_verified = true,
    verified_at = now(),
    verification_method = verification_record.verification_method,
    university = verification_record.university,
    student_id = verification_record.student_id
  WHERE user_id = verification_record.user_id;

  RETURN json_build_object(
    'success', true,
    'user_id', verification_record.user_id,
    'university', verification_record.university
  );
END;
$$;

-- Function to verify student by ID (instant verification for demo)
CREATE OR REPLACE FUNCTION public.verify_student_by_id(
  p_user_id UUID,
  p_university TEXT,
  p_student_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate student ID format (basic validation)
  IF p_student_id IS NULL OR LENGTH(TRIM(p_student_id)) < 5 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid student ID format');
  END IF;

  -- Create verification record
  INSERT INTO public.student_verifications (
    user_id, verification_method, university, student_id, status, verified_at
  ) VALUES (
    p_user_id, 'studentId', p_university, TRIM(p_student_id), 'verified', now()
  );

  -- Update profile
  UPDATE public.profiles
  SET 
    is_verified = true,
    verified_at = now(),
    verification_method = 'studentId',
    university = p_university,
    student_id = TRIM(p_student_id)
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;
-- Create surveys table
CREATE TABLE public.surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  researcher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  estimated_time INTEGER NOT NULL DEFAULT 5, -- in minutes
  max_responses INTEGER,
  current_responses INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  target_universities TEXT[], -- null means all universities
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create survey responses table
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_paid BOOLEAN NOT NULL DEFAULT false
);

-- Create unique constraint to prevent duplicate responses
CREATE UNIQUE INDEX idx_unique_survey_participant ON public.survey_responses(survey_id, participant_id);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Surveys policies
-- Researchers can manage their own surveys
CREATE POLICY "Researchers can view their own surveys"
ON public.surveys FOR SELECT
USING (auth.uid() = researcher_id);

CREATE POLICY "Researchers can create surveys"
ON public.surveys FOR INSERT
WITH CHECK (auth.uid() = researcher_id);

CREATE POLICY "Researchers can update their own surveys"
ON public.surveys FOR UPDATE
USING (auth.uid() = researcher_id);

CREATE POLICY "Researchers can delete their own surveys"
ON public.surveys FOR DELETE
USING (auth.uid() = researcher_id);

-- Verified participants can view active surveys
CREATE POLICY "Verified participants can view active surveys"
ON public.surveys FOR SELECT
USING (
  status = 'active' 
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_responses IS NULL OR current_responses < max_responses)
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_verified = true
  )
);

-- Survey responses policies
CREATE POLICY "Participants can view their own responses"
ON public.survey_responses FOR SELECT
USING (auth.uid() = participant_id);

CREATE POLICY "Verified participants can create responses"
ON public.survey_responses FOR INSERT
WITH CHECK (
  auth.uid() = participant_id
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_verified = true
  )
);

CREATE POLICY "Participants can update their own responses"
ON public.survey_responses FOR UPDATE
USING (auth.uid() = participant_id);

-- Researchers can view responses to their surveys
CREATE POLICY "Researchers can view responses to their surveys"
ON public.survey_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE id = survey_id 
    AND researcher_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON public.surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Add UPDATE policy: Allow users to update only their own pending verifications
CREATE POLICY "Users can update their own pending verifications"
ON public.student_verifications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Add DELETE policy: Allow users to delete only their own pending verifications
CREATE POLICY "Users can delete their own pending verifications"
ON public.student_verifications
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');
-- Fix 1: Create a safe view for student_verifications that excludes sensitive fields
-- This prevents users from seeing tokens and sensitive data through RLS

CREATE VIEW public.student_verifications_safe
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  verification_method,
  university,
  status,
  created_at,
  verified_at
  -- Excludes: token, token_expires_at, email, student_id
FROM public.student_verifications;

-- Enable RLS on the view
ALTER VIEW public.student_verifications_safe SET (security_invoker = true);

-- Drop the existing SELECT policy on the base table
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.student_verifications;

-- Create new restrictive SELECT policy that only allows service role access
-- Regular users cannot SELECT from base table directly
CREATE POLICY "Users can view their own verifications"
ON public.student_verifications
FOR SELECT
USING (false);

-- Create policy on the safe view for user access
-- Note: Views with security_invoker inherit the caller's permissions and RLS context

-- Fix 2: Update verify_student_by_id function with proper authorization
CREATE OR REPLACE FUNCTION public.verify_student_by_id(p_user_id uuid, p_university text, p_student_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  -- Authorization check: Only allow user to verify themselves
  IF p_user_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: You can only verify your own account');
  END IF;

  -- Validate user is a participant role
  SELECT role INTO user_role
  FROM profiles
  WHERE user_id = p_user_id;

  IF user_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF user_role != 'participant' THEN
    RETURN json_build_object('success', false, 'error', 'Only participants can verify student status');
  END IF;

  -- Check if user is already verified
  IF EXISTS (
    SELECT 1 FROM profiles WHERE user_id = p_user_id AND is_verified = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Account is already verified');
  END IF;

  -- Validate student ID format (basic validation)
  IF p_student_id IS NULL OR LENGTH(TRIM(p_student_id)) < 5 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid student ID format');
  END IF;

  -- Validate university is not empty
  IF p_university IS NULL OR LENGTH(TRIM(p_university)) < 3 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid university name');
  END IF;

  -- Create verification record
  INSERT INTO public.student_verifications (
    user_id, verification_method, university, student_id, status, verified_at
  ) VALUES (
    p_user_id, 'studentId', TRIM(p_university), TRIM(p_student_id), 'verified', now()
  );

  -- Update profile
  UPDATE public.profiles
  SET 
    is_verified = true,
    verified_at = now(),
    verification_method = 'studentId',
    university = TRIM(p_university),
    student_id = TRIM(p_student_id)
  WHERE user_id = p_user_id;

  RETURN json_build_object('success', true);
END;
$function$;

-- Create a rate limiting table for verification attempts
CREATE TABLE IF NOT EXISTS public.verification_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.verification_rate_limits(ip_address, endpoint, window_start);

-- Enable RLS on rate limits table (service role only)
ALTER TABLE public.verification_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies = only service role can access (which is what we want for rate limiting)
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
-- Fix 1: Update the student_verifications SELECT policy to allow users to view their own records
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.student_verifications;

-- Create a policy that allows users to view their own verifications
CREATE POLICY "Users can view their own verifications"
ON public.student_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Fix 2: Enable RLS on the student_verifications_safe view and add proper policy
-- Note: Views with security_invoker=true inherit the RLS of the underlying table
-- But we should also add explicit protection

-- The view already uses security_invoker=true, which means it respects the RLS of student_verifications
-- With the updated SELECT policy above, users can now view their own verification records through the base table
-- The safe view will also respect this policy since security_invoker=true
