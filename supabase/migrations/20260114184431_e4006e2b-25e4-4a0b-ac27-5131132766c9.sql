-- Add RLS policies to verification_rate_limits table
-- This table is only accessed by edge functions using the service role
-- Regular users should not have any access to this table

-- Block all access for regular users (edge functions use service role which bypasses RLS)
CREATE POLICY "No public access to rate limits"
ON public.verification_rate_limits
FOR ALL
USING (false)
WITH CHECK (false);