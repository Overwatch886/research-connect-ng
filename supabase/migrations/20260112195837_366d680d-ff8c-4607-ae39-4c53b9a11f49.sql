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