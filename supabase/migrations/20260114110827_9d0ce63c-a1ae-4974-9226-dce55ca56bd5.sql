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