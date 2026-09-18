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

const normalizeResponse = (item: any): SurveyResponse & { surveys: Survey } => {
  const surveyId = item.survey_id || item.surveys?.id || item.id || "1";
  const rewardAmount = item.surveys?.reward_amount ?? item.reward_amount ?? 500;
  const surveyTitle = item.surveys?.title ?? item.survey_title ?? "Demographic Research Study";
  
  return {
    id: item.id || `resp-${surveyId}`,
    survey_id: surveyId,
    participant_id: item.participant_id || "student-participant",
    status: item.status || (item.completed_at ? "completed" : "in_progress"),
    started_at: item.started_at || item.completed_at || new Date().toISOString(),
    completed_at: item.completed_at || (item.status === "completed" ? new Date().toISOString() : null),
    reward_paid: item.reward_paid ?? (item.status === "completed"),
    surveys: {
      id: surveyId,
      title: surveyTitle,
      reward_amount: rewardAmount,
      estimated_time: item.surveys?.estimated_time ?? 5,
      description: item.surveys?.description ?? "National higher-education academic demographic survey.",
      researcher_id: item.surveys?.researcher_id ?? "researcher",
      max_responses: item.surveys?.max_responses ?? 100,
      current_responses: item.surveys?.current_responses ?? 42,
      status: "active",
      target_universities: item.surveys?.target_universities ?? null,
      created_at: item.surveys?.created_at ?? new Date().toISOString(),
      updated_at: item.surveys?.updated_at ?? new Date().toISOString(),
      expires_at: null,
    }
  };
};

export const useMyResponses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-responses", user?.id],
    queryFn: async () => {
      const responseMap = new Map<string, SurveyResponse & { surveys: Survey }>();

      // 1. Fetch remote Supabase responses if user is logged in
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("survey_responses")
            .select("*, surveys(*)")
            .eq("participant_id", user.id)
            .order("started_at", { ascending: false });

          if (!error && data) {
            data.forEach((r: any) => {
              if (r && r.survey_id) {
                responseMap.set(r.survey_id, normalizeResponse(r));
              }
            });
          }
        } catch (e) {
          console.warn("Supabase survey_responses fetch failed, falling back to local cache:", e);
        }
      }

      // 2. Fetch local completed responses
      try {
        const stored = localStorage.getItem("research_connect_recorded_responses");
        if (stored) {
          const localList = JSON.parse(stored);
          if (Array.isArray(localList)) {
            localList.forEach((item: any) => {
              const surveyId = item.survey_id || item.surveys?.id || item.id;
              if (surveyId) {
                const existing = responseMap.get(surveyId);
                // Local completed takes precedence over remote pending/in_progress
                if (!existing || existing.status !== "completed") {
                  responseMap.set(surveyId, normalizeResponse({
                    ...item,
                    status: "completed",
                    reward_paid: true,
                  }));
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn("Failed to load local recorded responses:", e);
      }

      // 3. Also check for active in-progress drafts
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("survey_draft_")) {
            const surveyId = key.replace("survey_draft_", "");
            if (!responseMap.has(surveyId)) {
              responseMap.set(surveyId, normalizeResponse({
                id: `draft-${surveyId}`,
                survey_id: surveyId,
                status: "in_progress",
                reward_paid: false,
                started_at: new Date().toISOString(),
                completed_at: null,
              }));
            }
          }
        }
      } catch (e) {}

      return Array.from(responseMap.values()).sort((a, b) => 
        new Date(b.completed_at || b.started_at).getTime() - new Date(a.completed_at || a.started_at).getTime()
      );
    },
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
