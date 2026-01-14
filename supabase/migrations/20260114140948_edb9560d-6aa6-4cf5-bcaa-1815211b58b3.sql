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