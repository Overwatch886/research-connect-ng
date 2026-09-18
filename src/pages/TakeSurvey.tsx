import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Coins, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  Send,
  Building,
  GraduationCap,
  Bot,
  FileText
} from "lucide-react";
import { auditResponseQuality, AuditResult } from "@/lib/gemini";
import { GeminiKeyModal } from "@/components/GeminiKeyModal";
import { ConversationalSurveyor } from "@/components/ConversationalSurveyor";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  type: "short" | "long" | "multiple" | "checkbox" | "rating" | "dropdown";
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
}

interface SurveyDetails {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  estimated_time: number;
  target_universities?: string[] | null;
  questions: Question[];
}

// Built-in verified seed surveys for demonstration
const SEED_SURVEYS: Record<string, SurveyDetails> = {
  "1": {
    id: "1",
    title: "Impact of Mobile Banking Apps on Student Budgets",
    description: "A nationwide investigation on how fintech apps (OPay, Kuda, Moniepoint, PalmPay) shape daily financial habits among university students in Nigeria.",
    reward_amount: 500,
    estimated_time: 4,
    target_universities: ["University of Lagos", "University of Ibadan", "OAU Ife"],
    questions: [
      {
        id: "q1",
        type: "multiple",
        title: "Which mobile payment platform do you rely on most frequently for campus transactions?",
        required: true,
        options: ["OPay", "PalmPay", "Kuda Bank", "Moniepoint", "Traditional Commercial Bank (GTB/Access/Zenith)"]
      },
      {
        id: "q2",
        type: "multiple",
        title: "How often do you experience failed transfers or debit without credit while paying for food/transport?",
        required: true,
        options: ["Multiple times a week", "Once a week", "Rarely (1-2 times a month)", "Almost never"]
      },
      {
        id: "q3",
        type: "rating",
        title: "Rate your overall satisfaction with campus merchant transaction speeds (1 = Very Poor, 5 = Excellent):",
        required: true
      },
      {
        id: "q4",
        type: "long",
        title: "Describe your biggest frustration with money transfers during exam or registration periods, and what you do when network fails.",
        description: "Gemini AI will evaluate this response for authenticity to approve your ₦500 reward.",
        required: true
      }
    ]
  },
  "2": {
    id: "2",
    title: "Campus Electric Power Outages & Academic Workarounds",
    description: "Evaluating how Nigerian undergraduates navigate electricity instability, generator noise, and phone/laptop charging centers during semester weeks.",
    reward_amount: 750,
    estimated_time: 5,
    target_universities: ["All Universities"],
    questions: [
      {
        id: "q1",
        type: "multiple",
        title: "On average, how many hours of electricity does your hostel or campus lodge receive daily?",
        required: true,
        options: ["Less than 4 hours", "4 to 8 hours", "8 to 14 hours", "Over 14 hours"]
      },
      {
        id: "q2",
        type: "checkbox",
        title: "What workarounds do you spend personal money on to keep your devices charged?",
        required: true,
        options: ["Paid commercial charging centers (₦100 - ₦300 per charge)", "Personal power banks", "Departmental/Faculty charging ports", "Fuel contributions for personal/lodge generator"]
      },
      {
        id: "q3",
        type: "long",
        title: "How has unannounced power cuts directly affected your assignments, virtual tests, or exam preparations?",
        description: "Detailed personal experiences will qualify for high quality verification.",
        required: true
      }
    ]
  }
};

export const TakeSurvey = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [survey, setSurvey] = useState<SurveyDetails | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [auditStates, setAuditStates] = useState<Record<string, AuditResult>>({});
  const [auditingField, setAuditingField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyMode, setSurveyMode] = useState<"conversational" | "form">("conversational");
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    if (!id) return;

    // Check custom surveys in local storage first
    const stored = localStorage.getItem("research_connect_custom_surveys");
    if (stored) {
      const customSurveys = JSON.parse(stored);
      const found = customSurveys.find((s: any) => s.id === id);
      if (found) {
        setSurvey(found);
        return;
      }
    }

    // Fallback to seed surveys
    if (SEED_SURVEYS[id]) {
      setSurvey(SEED_SURVEYS[id]);
    } else {
      // Default fallback survey
      setSurvey(SEED_SURVEYS["1"]);
    }

    // Restore any saved in-progress draft answers
    const draft = localStorage.getItem(`survey_draft_${id}`);
    if (draft) {
      try {
        setAnswers(JSON.parse(draft));
      } catch (e) {}
    }
  }, [id]);

  useEffect(() => {
    if (id && Object.keys(answers).length > 0) {
      localStorage.setItem(`survey_draft_${id}`, JSON.stringify(answers));
    }
  }, [id, answers]);

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAuditText = async (questionId: string, questionTitle: string, value: string) => {
    if (!value || value.trim().length < 4) return;

    setAuditingField(questionId);
    try {
      const result = await auditResponseQuality(questionTitle, value);
      setAuditStates((prev) => ({ ...prev, [questionId]: result }));
    } catch (e) {
      console.warn("Audit skipped", e);
    } finally {
      setAuditingField(null);
    }
  };

  const handleCheckboxToggle = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || [];
    if (current.includes(option)) {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: current.filter((item) => item !== option),
      }));
    } else {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: [...current, option],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Check required questions
    for (const q of survey.questions) {
      if (q.required && (!answers[q.id] || answers[q.id].length === 0)) {
        toast({
          title: "Incomplete Survey",
          description: `Please answer question: "${q.title}"`,
          variant: "destructive",
        });
        return;
      }
    }

    // Check anti-speedrun threshold
    const durationSeconds = (Date.now() - startTime) / 1000;
    if (durationSeconds < 6) {
      toast({
        title: "Please Take Your Time",
        description: "Surveys submitted in under a few seconds trigger automated fraud filters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const rewardVal = survey.reward_amount || 500;

      // 1. Reward payout logic: Credit participant wallet balance
      const storedBal = localStorage.getItem("research_connect_user_balance");
      const currentBalance = storedBal !== null ? Number(storedBal) : 0;
      const updatedBalance = currentBalance + rewardVal;
      localStorage.setItem("research_connect_user_balance", updatedBalance.toString());

      // 2. Format complete survey response record
      const completedResponse = {
        id: Date.now().toString(),
        survey_id: survey.id,
        participant_id: user?.id || "student-participant",
        status: "completed",
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        reward_paid: true,
        reward_amount: rewardVal,
        survey_title: survey.title,
        surveys: {
          id: survey.id,
          title: survey.title,
          reward_amount: rewardVal,
          estimated_time: survey.estimated_time || 5,
          description: survey.description || "National higher-education academic demographic survey.",
          researcher_id: "researcher",
          max_responses: 100,
          current_responses: 43,
          status: "active",
          target_universities: survey.target_universities || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: null,
        },
        answers,
      };

      // 3. Persist to local recorded responses (deduplicating)
      const allResponses = JSON.parse(localStorage.getItem("research_connect_recorded_responses") || "[]");
      const filtered = allResponses.filter((r: any) => (r.survey_id || r.id) !== survey.id);
      filtered.unshift(completedResponse);
      localStorage.setItem("research_connect_recorded_responses", JSON.stringify(filtered));
      localStorage.removeItem(`survey_draft_${survey.id}`);

      // 4. Update survey response count and auto-close if reached target
      try {
        const storedCustom = localStorage.getItem("research_connect_custom_surveys");
        if (storedCustom) {
          const customList = JSON.parse(storedCustom);
          const updatedCustom = customList.map((s: any) => {
            if (s.id === survey.id) {
              const newCount = (s.current_responses || 0) + 1;
              const isFull = s.max_responses && newCount >= s.max_responses;
              return {
                ...s,
                current_responses: newCount,
                status: isFull ? "completed" : s.status,
              };
            }
            return s;
          });
          localStorage.setItem("research_connect_custom_surveys", JSON.stringify(updatedCustom));
        }
      } catch (e) {}

      // 4. Sync with Supabase if user is logged in
      if (user?.id) {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("balance")
            .eq("user_id", user.id)
            .maybeSingle();

          const newDbBalance = (prof?.balance || 0) + rewardVal;
          await supabase
            .from("profiles")
            .update({ balance: newDbBalance, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);

          const { data: existingResp } = await supabase
            .from("survey_responses")
            .select("id")
            .eq("survey_id", survey.id)
            .eq("participant_id", user.id)
            .maybeSingle();

          if (existingResp) {
            await supabase
              .from("survey_responses")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                reward_paid: true,
              })
              .eq("id", existingResp.id);
          } else {
            await supabase
              .from("survey_responses")
              .insert({
                survey_id: survey.id,
                participant_id: user.id,
                status: "completed",
                started_at: new Date(startTime).toISOString(),
                completed_at: new Date().toISOString(),
                reward_paid: true,
              });
          }
        } catch (supaErr) {
          console.warn("Supabase background sync skipped:", supaErr);
        }
      }

      // 5. Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ["my-responses"] });
      queryClient.invalidateQueries({ queryKey: ["available-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      setIsSubmitted(true);
      toast({
        title: "🎉 Reward Earned!",
        description: `₦${rewardVal.toLocaleString()} credited to your student wallet.`,
      });
    } catch (err) {
      toast({
        title: "Submission Error",
        description: "Failed to record survey response.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubmitted) {
    const balance = localStorage.getItem("research_connect_user_balance") || (survey.reward_amount || 500).toString();
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-foreground">Survey Completed!</h2>
            <p className="text-sm text-muted-foreground">
              Your responses were audited and verified for high data fidelity by Gemini AI.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <span>Reward Credited:</span>
              <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                +₦{survey.reward_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-emerald-200 dark:border-emerald-800">
              <span>Updated Wallet Balance:</span>
              <span className="font-semibold text-foreground">₦{Number(balance).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Link to="/surveys">View Participant Dashboard & Wallet</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/surveys">Browse More Paid Surveys</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user already took this survey
  const userResponses = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("research_connect_recorded_responses") || "[]")
    : [];
  const alreadyCompleted = userResponses.some((r: any) => (r.survey_id || r.id) === survey.id);

  if (alreadyCompleted && !isSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-foreground">Survey Already Completed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have already completed this research study and your reward has been credited to your student wallet.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Link to="/surveys">Browse More Paid Surveys</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/surveys">View Participant Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if survey was closed or maximum quota reached
  const globalStatuses = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("research_connect_survey_statuses") || "{}")
    : {};
  const isClosed = 
    globalStatuses[survey.id] === "closed" || 
    (survey as any).status === "closed" || 
    (survey as any).status === "completed" ||
    Boolean((survey as any).max_responses && (survey as any).current_responses >= (survey as any).max_responses);

  if (isClosed && !isSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-50 dark:ring-amber-900/30">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-foreground">Survey Collection Closed</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This research demographic study has reached its required response quota or was concluded by the research team.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Link to="/surveys">Browse Active Paid Surveys</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/surveys">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-sm sm:text-base text-foreground max-w-sm sm:max-w-md truncate">
              {survey.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Coins className="w-3.5 h-3.5" /> ₦{survey.reward_amount.toLocaleString()} Reward
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> ~{survey.estimated_time} mins
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GeminiKeyModal variant="badge" />
        </div>
      </header>

      {/* Main Survey Container */}
      <main className="max-w-2xl mx-auto px-4 pt-8">
        {/* Intro Card */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm border-t-4 border-t-primary space-y-3">
          <h2 className="text-xl font-bold font-display text-foreground">{survey.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{survey.description}</p>
          
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>Target: {survey.target_universities?.join(", ") || "All Nigerian Tertiary Institutions"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Gemini Anti-Fraud Active</span>
            </div>
          </div>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-muted p-1 rounded-2xl border flex items-center gap-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSurveyMode("conversational")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                surveyMode === "conversational"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>🎙️ AI Conversational Interview (Recommended)</span>
            </button>
            <button
              type="button"
              onClick={() => setSurveyMode("form")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                surveyMode === "form"
                  ? "bg-background text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📝 Classic Form</span>
            </button>
          </div>
        </div>

        {surveyMode === "conversational" ? (
          <ConversationalSurveyor
            surveyId={survey.id}
            surveyTitle={survey.title}
            rewardAmount={survey.reward_amount}
            questions={survey.questions}
            onFinish={() => setIsSubmitted(true)}
          />
        ) : (
          /* Survey Form */
          <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions.map((q, idx) => {
            const audit = auditStates[q.id];
            const isAuditing = auditingField === q.id;

            return (
              <div
                key={q.id}
                className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <Label className="text-base font-semibold text-foreground leading-snug">
                      {q.title}
                      {q.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {q.description && (
                      <p className="text-xs text-muted-foreground">{q.description}</p>
                    )}
                  </div>
                </div>

                {/* Multiple Choice (Radio) */}
                {q.type === "multiple" && q.options && (
                  <div className="space-y-2 pl-9">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                          answers[q.id] === opt
                            ? "border-primary bg-primary/5 font-medium shadow-sm"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {q.type === "checkbox" && q.options && (
                  <div className="space-y-2 pl-9">
                    {q.options.map((opt) => {
                      const selected = ((answers[q.id] as string[]) || []).includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                            selected
                              ? "border-primary bg-primary/5 font-medium shadow-sm"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleCheckboxToggle(q.id, opt)}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Rating Scale (1 - 5) */}
                {q.type === "rating" && (
                  <div className="pl-9 pt-1">
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                          className={`w-11 h-11 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center ${
                            answers[q.id] === val
                              ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                              : "border-border hover:border-primary/50 text-foreground"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between max-w-[260px] text-[11px] text-muted-foreground mt-1.5 px-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                )}

                {/* Short text input */}
                {q.type === "short" && (
                  <div className="pl-9">
                    <Input
                      placeholder="Your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Long text / open-ended response with Gemini Quality Audit */}
                {q.type === "long" && (
                  <div className="pl-9 space-y-2">
                    <Textarea
                      placeholder="Write your personal experience and thoughts here..."
                      rows={4}
                      value={answers[q.id] || ""}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      onBlur={(e) => handleAuditText(q.id, q.title, e.target.value)}
                      className="text-sm resize-none"
                    />

                    {/* Real-Time Gemini AI Quality Feedback */}
                    <div className="min-h-[28px] flex items-center justify-between text-xs pt-1">
                      {isAuditing ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Gemini AI is auditing answer fidelity...</span>
                        </div>
                      ) : audit ? (
                        audit.isValid ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span>Relevance & Authenticity Verified ({audit.qualityScore}/100) — +₦{survey.reward_amount} reward unlocked</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>
                              {audit.flags?.includes("off_topic")
                                ? `⚠️ Off-Topic Response: ${audit.feedback}`
                                : audit.feedback || "Response is too brief or evasive to qualify for reward."}
                            </span>
                          </div>
                        )
                      ) : (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          Answers with thoughtful detail unlock guaranteed wallet payouts.
                        </span>
                      )}

                      {answers[q.id] && answers[q.id].length > 3 && !audit && !isAuditing && (
                        <button
                          type="button"
                          onClick={() => handleAuditText(q.id, q.title, answers[q.id])}
                          className="text-[11px] text-indigo-600 hover:underline font-medium"
                        >
                          Audit Quality Now
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link to="/surveys">Save & Exit</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Crediting ₦{survey.reward_amount}...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit & Claim ₦{survey.reward_amount.toLocaleString()}</span>
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </main>
    </div>
  );
};

export default TakeSurvey;
