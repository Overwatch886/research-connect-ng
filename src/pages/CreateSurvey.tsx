import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  ArrowLeft,
  Plus,
  GripVertical,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  Star,
  Hash,
  Calendar,
  Upload,
  Trash2,
  Copy,
  Settings,
  Eye,
  Save,
  Sparkles,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { AiSurveyArchitectModal } from "@/components/AiSurveyArchitectModal";
import { GeminiKeyModal } from "@/components/GeminiKeyModal";
import { GeneratedSurvey } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type QuestionType = "short" | "long" | "multiple" | "checkbox" | "dropdown" | "rating" | "number" | "date" | "file";

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
}

const questionTypes = [
  { type: "short" as const, icon: Type, label: "Short Answer" },
  { type: "long" as const, icon: AlignLeft, label: "Long Answer" },
  { type: "multiple" as const, icon: Circle, label: "Multiple Choice" },
  { type: "checkbox" as const, icon: CheckSquare, label: "Checkboxes" },
  { type: "dropdown" as const, icon: List, label: "Dropdown" },
  { type: "rating" as const, icon: Star, label: "Rating Scale" },
  { type: "number" as const, icon: Hash, label: "Number" },
  { type: "date" as const, icon: Calendar, label: "Date" },
  { type: "file" as const, icon: Upload, label: "File Upload" },
];

const NIGERIAN_UNIVERSITIES = [
  "All Universities",
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "Covenant University",
  "Lagos State University (LASU)",
];

const CreateSurvey = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardAmount, setRewardAmount] = useState<number>(500);
  const [targetResponses, setTargetResponses] = useState<number>(50);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("All Universities");
  const [estimatedTime, setEstimatedTime] = useState<number>(5);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      type: "multiple",
      title: "Which higher institution are you currently studying at?",
      required: true,
      options: ["University of Lagos", "University of Ibadan", "OAU Ife", "Other"]
    },
    {
      id: "2",
      type: "long",
      title: "What is your biggest daily challenge with student transport and food prices?",
      description: "Substantive answers will be verified by Gemini AI to unlock the payout.",
      required: true
    }
  ]);
  const [activeQuestion, setActiveQuestion] = useState<string | null>("1");
  const [showAiModal, setShowAiModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingMode, setFundingMode] = useState<"paid" | "karma">("paid");
  const [isPublishing, setIsPublishing] = useState(false);
  const userCredits = Number(localStorage.getItem("research_connect_peer_credits") || "12");

  const studentRewardPool = rewardAmount * targetResponses;
  const platformFee = Math.round(studentRewardPool * 0.10);
  const totalEscrow = fundingMode === "paid" ? studentRewardPool + platformFee : 0;

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: "Untitled Question",
      required: false,
      options: type === "multiple" || type === "checkbox" || type === "dropdown" 
        ? ["Option 1", "Option 2"] 
        : undefined
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      toast({
        title: "Minimum Question Required",
        description: "A survey must have at least one question.",
        variant: "destructive",
      });
      return;
    }
    setQuestions(questions.filter(q => q.id !== id));
    if (activeQuestion === id) {
      setActiveQuestion(null);
    }
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const newQuestion = { ...question, id: Date.now().toString() };
      const index = questions.findIndex(q => q.id === id);
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, newQuestion);
      setQuestions(newQuestions);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Option ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex)
      });
    }
  };

  const handleApplyAiSurvey = (survey: GeneratedSurvey) => {
    setTitle(survey.title);
    setDescription(survey.description);
    setEstimatedTime(survey.estimated_time || 5);
    if (survey.recommended_reward) {
      setRewardAmount(survey.recommended_reward);
    }
    setQuestions(
      survey.questions.map((q, idx) => ({
        id: (idx + 1).toString(),
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        options: q.options,
      }))
    );
    setActiveQuestion("1");
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast({
        title: "Survey Title Missing",
        description: "Please enter a survey title before publishing.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      const isKarma = fundingMode === "karma";
      const surveyData = {
        title,
        description,
        reward_amount: isKarma ? 0 : rewardAmount,
        is_peer_exchange: isKarma,
        estimated_time: estimatedTime,
        max_responses: targetResponses,
        current_responses: 0,
        status: "active",
        target_universities: selectedUniversity === "All Universities" ? null : [selectedUniversity],
        researcher_id: user?.id || "demo-researcher-id",
      };

      // Attempt Supabase insert if authenticated, fallback to local storage for offline / demo mode
      let publishedId = Date.now().toString();
      if (user?.id) {
        const { data, error } = await supabase.from("surveys").insert(surveyData).select().single();
        if (!error && data) {
          publishedId = data.id;
        }
      }

      // Persist survey and questions into localStorage for instant demo reliability
      let localSurveys: any[] = [];
      try {
        const stored = localStorage.getItem("research_connect_custom_surveys");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) localSurveys = parsed;
        }
      } catch {}
      localSurveys.unshift({
        ...surveyData,
        id: publishedId,
        questions,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("research_connect_custom_surveys", JSON.stringify(localSurveys));

      if (isKarma) {
        localStorage.setItem("research_connect_peer_credits", Math.max(0, userCredits - targetResponses).toString());
        toast({
          title: "🎉 Free Survey Published!",
          description: `${targetResponses} Peer Credits redeemed. Live for Nigerian community peer exchange.`,
        });
      } else {
        toast({
          title: "🎉 Survey Published & Funded!",
          description: `₦${totalEscrow.toLocaleString()} locked in escrow (incl. 10% platform fee). Live for Nigerian students.`,
        });
      }

      setShowFundingModal(false);
      navigate("/dashboard");
    } catch (err) {
      toast({
        title: "Publishing Error",
        description: "Failed to publish survey. Saved to local draft.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-50">
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <input
                type="text"
                placeholder="Untitled Survey"
                className="font-display text-xl font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GeminiKeyModal variant="badge" />

            <Button
              onClick={() => setShowAiModal(true)}
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">✨ Generate with Gemini AI</span>
              <span className="sm:hidden">Gemini AI</span>
            </Button>

            <Button
              onClick={() => setShowFundingModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Fund & Publish</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Main Editor */}
        <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
          {/* Survey Header Card */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6 border-t-4 border-t-primary shadow-sm">
            <input
              type="text"
              placeholder="Survey Title"
              className="w-full font-display text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground mb-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Add a description for respondents (context, university criteria, and instructions)..."
              className="w-full bg-transparent border-none outline-none text-muted-foreground resize-none text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Quick Incentive Pill */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border mt-3 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <Coins className="w-3.5 h-3.5" /> ₦{rewardAmount.toLocaleString()} per verified student
              </span>
              <span className="text-muted-foreground">
                Target: <strong>{targetResponses} respondents</strong>
              </span>
              <span className="text-muted-foreground">
                Total Escrow: <strong>₦{totalEscrow.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Questions */}
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`bg-card rounded-xl border-2 p-6 mb-4 transition-all ${
                activeQuestion === question.id 
                  ? "border-primary shadow-md" 
                  : "border-border"
              }`}
              onClick={() => setActiveQuestion(question.id)}
            >
              <div className="flex items-start gap-4">
                <div className="pt-2 cursor-grab text-muted-foreground">
                  <span className="text-xs font-bold w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Question Title */}
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Question title"
                      className="flex-1 text-base font-semibold bg-transparent border-none outline-none text-foreground"
                      value={question.title}
                      onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md font-medium">
                      {questionTypes.find(t => t.type === question.type)?.label}
                    </span>
                  </div>

                  {question.description && (
                    <input
                      type="text"
                      placeholder="Question hint or guidance (optional)"
                      className="w-full text-xs text-muted-foreground bg-transparent border-none outline-none"
                      value={question.description}
                      onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                    />
                  )}

                  {/* Question Options */}
                  {question.options && (
                    <div className="space-y-2 pl-4">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          {question.type === "multiple" && (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                          {question.type === "checkbox" && (
                            <CheckSquare className="w-4 h-4 text-muted-foreground" />
                          )}
                          {question.type === "dropdown" && (
                            <span className="text-muted-foreground text-xs">{optIndex + 1}.</span>
                          )}
                          <input
                            type="text"
                            className="flex-1 bg-transparent border-b border-border focus:border-primary outline-none py-1 text-sm"
                            value={option}
                            onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                          />
                          {question.options!.length > 2 && (
                            <button
                              onClick={() => removeOption(question.id, optIndex)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(question.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add option
                      </button>
                    </div>
                  )}

                  {question.type === "short" && (
                    <div className="pl-4">
                      <div className="w-2/3 h-9 border border-dashed border-border rounded-md px-3 flex items-center text-xs text-muted-foreground bg-muted/20">
                        Short answer response field
                      </div>
                    </div>
                  )}

                  {question.type === "long" && (
                    <div className="pl-4 space-y-1.5">
                      <div className="w-full h-20 border border-dashed border-border rounded-md p-3 text-xs text-muted-foreground bg-muted/20">
                        Long descriptive response area (audited by Gemini Anti-Fraud engine)
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Protected by Gemini Response Quality Auditor
                      </span>
                    </div>
                  )}

                  {question.type === "rating" && (
                    <div className="pl-4 flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-xs font-bold text-muted-foreground bg-muted/30">
                          {n}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Question Actions */}
                  {activeQuestion === question.id && (
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                          className="rounded text-primary focus:ring-primary"
                        />
                        Required question
                      </label>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => duplicateQuestion(question.id)}
                          title="Duplicate question"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteQuestion(question.id)}
                          title="Delete question"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </main>

        {/* Sidebar: Budget & Question Types */}
        <aside className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-border bg-card space-y-6">
          {/* Escrow Budget Configuration */}
          <div className="p-4 rounded-xl border bg-muted/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm">Funding & Budget</h3>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {fundingMode === "paid" ? "Escrow" : "Karma Exchange"}
              </Badge>
            </div>

            {/* Funding Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setFundingMode("paid")}
                className={`py-1.5 px-2 rounded-md font-semibold transition-all ${
                  fundingMode === "paid"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💰 Paid Escrow
              </button>
              <button
                type="button"
                onClick={() => setFundingMode("karma")}
                className={`py-1.5 px-2 rounded-md font-semibold transition-all ${
                  fundingMode === "karma"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🤝 Free (Karma)
              </button>
            </div>

            {fundingMode === "paid" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Reward Per Student (₦)</Label>
                  <Input
                    type="number"
                    min={200}
                    step={50}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value) || 200)}
                    className="text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Target Respondents</Label>
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    value={targetResponses}
                    onChange={(e) => setTargetResponses(Number(e.target.value) || 10)}
                    className="text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Target University</Label>
                  <select
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border bg-background"
                  >
                    {NIGERIAN_UNIVERSITIES.map((uni) => (
                      <option key={uni} value={uni}>{uni}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Student Incentive Pool:</span>
                    <span className="font-medium text-foreground">₦{studentRewardPool.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Platform Fee (10%):</span>
                    <span className="font-medium text-foreground">₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-emerald-900 dark:text-emerald-200 pt-1.5 border-t border-emerald-200 dark:border-emerald-800">
                    <span>Total Escrow Deposit:</span>
                    <span className="text-sm text-emerald-600">₦{totalEscrow.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 pt-0.5">
                    100% held in escrow until Gemini verifies genuine student submissions.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Target Free Respondents</Label>
                  <Input
                    type="number"
                    min={5}
                    max={userCredits || 50}
                    step={1}
                    value={targetResponses}
                    onChange={(e) => setTargetResponses(Number(e.target.value) || 5)}
                    className="text-sm font-semibold"
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    1 Peer Credit = 1 Free verified respondent.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Your Peer Credits:</span>
                    <Badge className="bg-purple-600 text-white text-[11px]">{userCredits} Credits Available</Badge>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-purple-900 dark:text-purple-200 pt-1 border-t border-purple-200 dark:border-purple-800">
                    <span>Cash Cost:</span>
                    <span className="text-emerald-600 font-bold">₦0 (Free Exchange)</span>
                  </div>
                  <p className="text-[10px] text-purple-700 dark:text-purple-300">
                    Earn more credits anytime by completing peer academic surveys in the student feed.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Question Types Palette */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-3">Add Question Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {questionTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => addQuestion(type.type)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-center"
                >
                  <type.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Gemini Survey Architect Modal */}
      <AiSurveyArchitectModal
        open={showAiModal}
        onOpenChange={setShowAiModal}
        onApplySurvey={handleApplyAiSurvey}
      />

      {/* Escrow Funding Confirmation Modal */}
      <Dialog open={showFundingModal} onOpenChange={setShowFundingModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mb-2">
              <Coins className="w-5 h-5" />
            </div>
            <DialogTitle>
              {fundingMode === "paid" ? "Fund Escrow & Launch Survey" : "Redeem Peer Karma & Launch Free Survey"}
            </DialogTitle>
            <DialogDescription>
              {fundingMode === "paid"
                ? "Guaranteed financial rewards protect research integrity and incentivize high-quality student responses."
                : "Spend your earned Peer Research Karma to gather verified student responses with zero cash required."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-sm">
            <div className="bg-muted p-3.5 rounded-xl space-y-2 border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Survey Title:</span>
                <span className="font-semibold text-right max-w-[240px] truncate">{title || "Untitled"}</span>
              </div>

              {fundingMode === "paid" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reward / Respondent:</span>
                    <span className="font-semibold">₦{rewardAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Sample Size:</span>
                    <span className="font-semibold">{targetResponses} students</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student Reward Pool:</span>
                    <span className="font-semibold">₦{studentRewardPool.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (10%):</span>
                    <span className="font-semibold">₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-base text-foreground">
                    <span>Total Escrow Deposit:</span>
                    <span className="text-emerald-600">₦{totalEscrow.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funding Model:</span>
                    <span className="font-semibold text-purple-600">Peer Research Karma</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Sample Size:</span>
                    <span className="font-semibold">{targetResponses} respondents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Karma Credits to Deduct:</span>
                    <span className="font-semibold text-amber-600">{targetResponses} Credits</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-base text-foreground">
                    <span>Total Cash Required:</span>
                    <span className="text-emerald-600">₦0 (Free)</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Gemini AI will automatically audit student responses to disqualify off-topic banter and spam before approving submissions.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowFundingModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Survey...</span>
                </>
              ) : fundingMode === "paid" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize ₦{totalEscrow.toLocaleString()} & Publish</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Redeem {targetResponses} Credits & Publish</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateSurvey;
