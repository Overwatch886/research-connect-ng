import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Check, Loader2, Wand2, HelpCircle, RefreshCw } from "lucide-react";
import {
  generateClarificationQuestions,
  generateSurveyFromClarifications,
  ClarificationQuestion,
  GeneratedSurvey,
} from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface AiSurveyArchitectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySurvey: (survey: GeneratedSurvey) => void;
}

const SAMPLE_PROMPTS = [
  "Campus Cashless & Fintech Adoption at UNILAG",
  "Impact of Food Price Inflation on Student Nutrition at UI",
  "Electricity Outages & Academic Performance in Hostels",
  "Freelancing and Side-Hustles Among Nigerian Undergrads",
];

export const AiSurveyArchitectModal = ({
  open,
  onOpenChange,
  onApplySurvey,
}: AiSurveyArchitectModalProps) => {
  const [step, setStep] = useState<"topic" | "clarifying" | "generating" | "review">("topic");
  const [topic, setTopic] = useState("");
  const [clarifications, setClarifications] = useState<ClarificationQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [generatedSurvey, setGeneratedSurvey] = useState<GeneratedSurvey | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStartConsultation = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter your research goal or study topic.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStep("clarifying");
    try {
      const questions = await generateClarificationQuestions(topic.trim());
      setClarifications(questions);
      // Pre-select first option for ease
      const initial: Record<string, string> = {};
      questions.forEach((q) => {
        if (q.options?.length) {
          initial[q.id] = q.options[0];
        }
      });
      setSelectedAnswers(initial);
    } catch (err) {
      toast({
        title: "Architect Error",
        description: "Could not generate clarification questions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeGeneration = async () => {
    setLoading(true);
    setStep("generating");
    try {
      const survey = await generateSurveyFromClarifications(topic.trim(), selectedAnswers);
      setGeneratedSurvey(survey);
      setStep("review");
    } catch (err) {
      toast({
        title: "Generation Error",
        description: "Failed to generate survey questions.",
        variant: "destructive",
      });
      setStep("clarifying");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedSurvey) {
      onApplySurvey(generatedSurvey);
      toast({
        title: "Survey Populated!",
        description: `Generated ${generatedSurvey.questions.length} questions tailored for Nigerian respondents.`,
      });
      onOpenChange(false);
      // Reset modal state
      setStep("topic");
      setTopic("");
      setGeneratedSurvey(null);
    }
  };

  const handleReset = () => {
    setStep("topic");
    setTopic("");
    setClarifications([]);
    setSelectedAnswers({});
    setGeneratedSurvey(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Gemini 2.0 AI Survey Architect</DialogTitle>
              <DialogDescription className="text-xs">
                Consultative AI that calibrates your research questions for Nigerian demographics.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* STEP 1: TOPIC INPUT */}
          {step === "topic" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="study-topic" className="text-sm font-semibold">
                  What do you want to research or survey?
                </Label>
                <Input
                  id="study-topic"
                  placeholder="e.g. Mobile money app friction among UNILAG hostel students..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="text-sm py-2"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setTopic(prompt)}
                      className="text-xs px-2.5 py-1.5 rounded-md border bg-muted/50 hover:bg-primary/10 hover:border-primary/50 text-left transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CLARIFICATION INTERVIEW */}
          {step === "clarifying" && (
            <div className="space-y-5">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm font-medium">Gemini 2.0 Flash is formulating clarification questions...</p>
                  <p className="text-xs text-muted-foreground">Calibrating academic & demographic nuances</p>
                </div>
              ) : (
                <>
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Answer these 3 quick questions to help Gemini fine-tune the methodology:
                    </span>
                  </div>

                  {clarifications.map((q, idx) => (
                    <div key={q.id} className="space-y-2 p-3 rounded-lg border bg-card/60">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <Label className="text-sm font-medium">{q.question}</Label>
                      </div>
                      {q.description && (
                        <p className="text-xs text-muted-foreground pl-7">{q.description}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7 pt-1">
                        {q.options.map((opt) => {
                          const isSelected = selectedAnswers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt }))
                              }
                              className={`text-xs p-2.5 rounded-lg border text-left transition-all flex items-start justify-between gap-2 ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-medium shadow-sm ring-1 ring-indigo-600"
                                  : "border-border hover:bg-muted/60"
                              }`}
                            >
                              <span>{opt}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* STEP 2.5: GENERATING STATE */}
          {step === "generating" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-base font-semibold">Architecting Your Survey Schema...</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Gemini is composing high-impact questions, Likert scales, and anti-fraud filters.
              </p>
            </div>
          )}

          {/* STEP 3: REVIEW AND APPLY */}
          {step === "review" && generatedSurvey && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                  ✨ Survey Schema Generated ({generatedSurvey.questions.length} questions)
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Est. ₦{generatedSurvey.recommended_reward} reward / {generatedSurvey.estimated_time} mins
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">{generatedSurvey.title}</h4>
                <p className="text-xs text-muted-foreground">{generatedSurvey.description}</p>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Questions Overview
                </Label>
                {generatedSurvey.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-2.5 rounded-md border text-xs bg-muted/30 flex items-start gap-2">
                    <span className="font-bold text-muted-foreground">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{q.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] uppercase font-semibold">
                          {q.type}
                        </span>
                        {q.options && (
                          <span className="text-muted-foreground text-[11px]">
                            {q.options.length} choices
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t flex items-center justify-between sm:justify-between w-full">
          {step === "topic" && (
            <div className="flex justify-end w-full">
              <Button
                onClick={handleStartConsultation}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                disabled={loading || !topic.trim()}
              >
                <span>Consult Architect</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === "clarifying" && !loading && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep("topic")}>
                Back
              </Button>
              <Button
                onClick={handleFinalizeGeneration}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <span>Generate Questions</span>
                <Wand2 className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Start Over
              </Button>
              <Button
                onClick={handleApply}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply to Survey Form</span>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
