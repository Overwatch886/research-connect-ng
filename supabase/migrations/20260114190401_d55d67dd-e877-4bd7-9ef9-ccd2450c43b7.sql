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