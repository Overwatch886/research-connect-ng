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