-- Update survey RLS policy so all authenticated participants can see active surveys
-- regardless of whether their student ID verification is pending or complete.

DROP POLICY IF EXISTS "Verified participants can view active surveys" ON public.surveys;
DROP POLICY IF EXISTS "Anyone can view active surveys" ON public.surveys;
DROP POLICY IF EXISTS "Authenticated users can view active surveys" ON public.surveys;

CREATE POLICY "Authenticated users can view active surveys"
ON public.surveys FOR SELECT
TO authenticated
USING (status = 'active');
