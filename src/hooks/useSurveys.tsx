import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Survey {
  id: string;
  researcher_id: string;
  title: string;
  description: string | null;
  reward_amount: number;
  estimated_time: number;
  max_responses: number | null;
  current_responses: number;
  status: string;
  target_universities: string[] | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  participant_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  reward_paid: boolean;
}

export const useAvailableSurveys = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["available-surveys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Survey[];
    },
    enabled: !!user,
  });
};

export const useMyResponses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-responses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*, surveys(*)")
        .eq("participant_id", user!.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as (SurveyResponse & { surveys: Survey })[];
    },
    enabled: !!user,
  });
};

export const useStartSurvey = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (surveyId: string) => {
      const { data, error } = await supabase
        .from("survey_responses")
        .insert({
          survey_id: surveyId,
          participant_id: user!.id,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-responses"] });
      queryClient.invalidateQueries({ queryKey: ["available-surveys"] });
    },
  });
};

export const useCompleteSurvey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (responseId: string) => {
      const { data, error } = await supabase
        .from("survey_responses")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", responseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-responses"] });
      queryClient.invalidateQueries({ queryKey: ["available-surveys"] });
    },
  });
};

// Researcher hooks
export const useResearcherSurveys = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["researcher-surveys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("researcher_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Survey[];
    },
    enabled: !!user,
  });
};
