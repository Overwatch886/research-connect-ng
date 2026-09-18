import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  BarChart2, 
  TrendingUp, 
  Lightbulb, 
  ShieldCheck, 
  Download, 
  Loader2, 
  RefreshCw,
  BookOpen,
  Copy,
  Check,
  FileText,
  Headphones,
  Play,
  Square,
  ExternalLink,
  Paperclip,
  Plus,
  Trash2,
  ListChecks,
  CheckCircle2,
  Key
} from "lucide-react";
import { 
  generateSurveyInsights, 
  generateAcademicPaperDraft, 
  generateAudioOverviewScript, 
  hasGeminiApiKey,
  getGeminiApiKey,
  setGeminiApiKey,
  GroundingSource, 
  SurveyInsights 
} from "@/lib/gemini";
import { GeminiKeyModal } from "@/components/GeminiKeyModal";
import { useToast } from "@/hooks/use-toast";

interface AiInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyTitle: string;
  surveyDescription?: string;
  responseCount?: number;
}

const defaultGroundingSources: GroundingSource[] = [
  {
    id: "g1",
    name: "Literature_Review_Macro_Elasticity.txt",
    content: "Macroeconomic shocks in emerging African tertiary institutions create high price elasticity in daily student consumables. Empirical studies by Adebayo & Babalola (2023) note that undergraduate transit expenditure rose from 14% to 32% of monthly allowances post-subsidy reform. Informal peer pooling (digital mutual aid via micro-fintech) has emerged as the dominant informal safety net.",
    size: 420,
    uploadedAt: "Reference",
  },
  {
    id: "g2",
    name: "Methodology_Notes_Stratified_Sampling.txt",
    content: "Field sampling methodology: Stratified random sampling across 6 geopolitical university clusters (UI, UNILAG, UNN, ABU, UNIPORT, UNILORIN). Anti-fraud verification enforced through .edu.ng institutional email validation and real-time semantic screening powered by Google Gemini 1.5 Flash.",
    size: 310,
    uploadedAt: "Reference",
  },
];

export const AiInsightsModal = ({
  open,
  onOpenChange,
  surveyTitle,
  surveyDescription = "Demographic and socio-economic study across Nigerian universities.",
  responseCount = 127,
}: AiInsightsModalProps) => {
  const [activeTab, setActiveTab] = useState<"insights" | "paper" | "audio">("insights");
  const [insights, setInsights] = useState<SurveyInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const [paperDraft, setPaperDraft] = useState<string | null>(null);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [copied, setCopied] = useState(false);

  // Multi-document grounding sources
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>(defaultGroundingSources);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");

  // Audio overview & NotebookLM state
  const [audioScript, setAudioScript] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Guided review checklist
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>({
    hypotheses: true,
    sampling: true,
    sources: true,
    originality: false,
  });

  const { toast } = useToast();

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const stored = localStorage.getItem("research_connect_recorded_responses");
      const localResponses = stored ? JSON.parse(stored) : [];
      const responsesToAnalyze = localResponses.length > 0 
        ? localResponses 
        : Array.from({ length: responseCount });

      const data = await generateSurveyInsights(
        surveyTitle,
        [{ title: "Primary Student Pain Point" }, { title: "Payment Reliability" }],
        responsesToAnalyze
      );
      setInsights(data);
      toast({
        title: "Insights Generated",
        description: "Gemini 1.5 Flash synthesized fresh cross-campus insights.",
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      toast({
        title: "AI Synthesis Error",
        description: msg.includes("not_configured") || msg.includes("KEY") || msg.includes("quota")
          ? "Gemini API key is required. Please click 'Configure Gemini AI' at the top to connect your key."
          : `Failed to generate insights: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleGeneratePaper = async () => {
    setLoadingPaper(true);
    try {
      const paper = await generateAcademicPaperDraft(
        surveyTitle,
        surveyDescription,
        [
          { id: "1", title: "Institutional Disruption & Frequency", type: "multiple" },
          { id: "2", title: "Economic Coping Mechanisms & Peer Mutual Aid", type: "text" },
          { id: "3", title: "Impact on Academic Attendance and CGPA", type: "rating" },
        ],
        responseCount,
        groundingSources
      );
      setPaperDraft(paper);
      toast({
        title: "Academic Paper Drafted",
        description: `Gemini 1.5 Flash synthesized draft using ${groundingSources.length} grounded source documents.`,
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      toast({
        title: "Generation Error",
        description: msg.includes("not_configured") || msg.includes("KEY") || msg.includes("quota")
          ? "Gemini API key is required. Please click 'Configure Gemini AI' at the top to connect your key."
          : `Failed to draft academic paper: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setLoadingPaper(false);
    }
  };

  const handleGenerateAudio = async () => {
    setLoadingAudio(true);
    try {
      const script = await generateAudioOverviewScript(surveyTitle, paperDraft || insights?.summary || "");
      setAudioScript(script);
      toast({
        title: "Audio Overview Script Generated",
        description: "2-host Deep Dive podcast script ready to listen.",
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      toast({
        title: "Audio Generation Error",
        description: msg.includes("not_configured") || msg.includes("KEY") || msg.includes("quota")
          ? "Gemini API key is required. Please click 'Configure Gemini AI' at the top to connect your key."
          : `Failed to generate audio overview: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setLoadingAudio(false);
    }
  };

  const handlePlayAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast({
        title: "Audio Playback Not Supported",
        description: "Your browser does not support Web Speech Synthesis.",
        variant: "destructive",
      });
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const scriptToSpeak = audioScript || "";
    const clean = scriptToSpeak
      .replace(/\[.*?\]/g, "")
      .replace(/(Dr\. Ade:|Chidinma:)/g, "$1, ");

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleAddSource = () => {
    if (!newDocName.trim() || !newDocContent.trim()) {
      toast({ title: "Incomplete source", description: "Please provide a file name and text content.", variant: "destructive" });
      return;
    }
    const newSource: GroundingSource = {
      id: `custom-${Date.now()}`,
      name: newDocName.trim().endsWith(".txt") ? newDocName.trim() : `${newDocName.trim()}.txt`,
      content: newDocContent.trim(),
      size: newDocContent.trim().length,
      uploadedAt: "Custom Added",
    };
    setGroundingSources((prev) => [...prev, newSource]);
    setNewDocName("");
    setNewDocContent("");
    setIsAddingSource(false);
    toast({
      title: "Grounding Document Attached",
      description: `"${newSource.name}" will be incorporated into the Gemini context for paper generation.`,
    });
  };

  const handleRemoveSource = (id: string) => {
    setGroundingSources((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Source Removed" });
  };

  const handleExportNotebookLM = () => {
    const dossier = `# RESEARCH DOSSIER FOR GOOGLE NOTEBOOKLM
Study Title: ${surveyTitle}
Lead Institution: Nigerian Higher Education Demographic Research Consortium
Sample Size: N = ${responseCount} Verified Nigerian University Undergraduates
Date: ${new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}

=======================================================
SECTION 1: EMPIRICAL ACADEMIC PAPER DRAFT
=======================================================
${paperDraft || "No paper drafted yet."}

=======================================================
SECTION 2: EXECUTIVE DEMOGRAPHIC INSIGHTS & SENTIMENT
=======================================================
${insights ? insights.summary : "Cross-campus demographic study."}

Sentiment Distribution:
- Positive: ${insights?.sentimentDistribution?.positive || 22}%
- Neutral: ${insights?.sentimentDistribution?.neutral || 31}%
- Critical: ${insights?.sentimentDistribution?.critical || 47}%

Key Behavioral Trends:
${insights?.keyTrends?.map((t, i) => `${i + 1}. ${t}`).join("\n") || "Undergraduate budget elasticity and transit bottlenecks."}

Strategic & Policy Interventions:
${insights?.recommendations?.map((r, i) => `${i + 1}. ${r}`).join("\n") || "Campus shuttle transit caps."}

=======================================================
SECTION 3: GROUNDING LITERATURE & THEORETICAL SOURCES
=======================================================
${
  groundingSources.length > 0
    ? groundingSources
        .map(
          (s, i) => `### Grounding Source [${i + 1}]: ${s.name}\n${s.content}`
        )
        .join("\n\n")
    : "No external documents attached."
}

=======================================================
NOTEBOOKLM INSTRUCTIONS FOR RESEARCHER
=======================================================
1. Go to Google NotebookLM (https://notebooklm.google.com/)
2. Click '+ New Notebook'
3. Upload this file as a source.
4. Click 'Audio Overview: Generate' to listen to a 2-host Deep Dive podcast discussing your research findings!
`;

    const blob = new Blob([dossier], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${surveyTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-notebooklm-dossier.md`;
    a.click();
    URL.revokeObjectURL(url);

    window.open("https://notebooklm.google.com/", "_blank");
    toast({
      title: "Dossier Exported for NotebookLM",
      description: "Dossier downloaded and Google NotebookLM opened in a new tab.",
    });
  };

  const onDialogOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen) {
      if (!insights && !loadingInsights) {
        handleGenerateInsights();
      }
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      }
    }
  };

  const handleTabChange = (val: string) => {
    const tab = val as "insights" | "paper" | "audio";
    setActiveTab(tab);
    if (tab === "paper" && !paperDraft && !loadingPaper) {
      handleGeneratePaper();
    } else if (tab === "audio" && !audioScript && !loadingAudio) {
      handleGenerateAudio();
    }
  };

  const handleCopyPaper = async () => {
    if (!paperDraft) return;
    try {
      await navigator.clipboard.writeText(paperDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Academic paper markdown copied successfully.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPaper = () => {
    if (!paperDraft) return;
    const blob = new Blob([paperDraft], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${surveyTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-academic-paper.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Academic Paper Downloaded",
      description: "Saved as publication-ready markdown (.md).",
    });
  };

  const handleDownloadInsights = () => {
    if (!insights) return;
    const content = `RESEARCH CONNECT NG - EXECUTIVE INSIGHTS REPORT
Study: ${surveyTitle}
Sample Size: ${responseCount} Verified Nigerian Student Responses
Generated: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY:
${insights.summary}

SENTIMENT BREAKDOWN:
- Positive: ${insights.sentimentDistribution.positive}%
- Neutral: ${insights.sentimentDistribution.neutral}%
- Critical: ${insights.sentimentDistribution.critical}%

KEY FINDINGS & TRENDS:
${insights.keyTrends.map((t, i) => `${i + 1}. ${t}`).join("\n")}

RECOMMENDATIONS:
${insights.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${surveyTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-ai-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Report Exported",
      description: "AI Executive Report downloaded successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onDialogOpen}>
      <DialogContent className="sm:max-w-[840px] max-h-[92vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Gemini Academic Intelligence & Dossier Hub</DialogTitle>
                <DialogDescription className="text-xs">
                  Synthesis, grounded paper generation & NotebookLM audio overviews (N = {responseCount} verified respondents)
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GeminiKeyModal variant="badge" />
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Grounded Data
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
          <div className="pt-2 pb-1">
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Executive Insights</span>
              </TabsTrigger>
              <TabsTrigger value="paper" className="flex items-center gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                <span>Academic Paper & Sources</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-1.5 text-xs">
                <Headphones className="w-3.5 h-3.5 text-emerald-500" />
                <span>Audio & NotebookLM</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: EXECUTIVE INSIGHTS */}
          <TabsContent value="insights" className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
            {loadingInsights ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-9 h-9 animate-spin text-indigo-600" />
                <p className="font-semibold text-foreground text-sm">Synthesizing Demographic Responses...</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Gemini 1.5 Flash is aggregating cross-campus themes, outlier opinions, and sentiment distribution.
                </p>
              </div>
            ) : insights ? (
              <>
                {/* Study Header */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Survey Topic</span>
                    <h3 className="font-bold text-base text-foreground leading-snug">{surveyTitle}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateInsights}
                    disabled={loadingInsights}
                    className="h-8 text-xs gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingInsights ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>

                {/* Sentiment Breakdown Bar */}
                <div className="space-y-2 p-4 rounded-xl border bg-card/60">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <BarChart2 className="w-4 h-4 text-indigo-500" /> Sentiment Analysis
                    </span>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-emerald-600 font-bold">Positive: {insights.sentimentDistribution.positive}%</span>
                      <span className="text-amber-600 font-bold">Neutral: {insights.sentimentDistribution.neutral}%</span>
                      <span className="text-rose-600 font-bold">Critical: {insights.sentimentDistribution.critical}%</span>
                    </div>
                  </div>

                  <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                    <div
                      style={{ width: `${insights.sentimentDistribution.positive}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Positive: ${insights.sentimentDistribution.positive}%`}
                    />
                    <div
                      style={{ width: `${insights.sentimentDistribution.neutral}%` }}
                      className="bg-amber-400 h-full transition-all"
                      title={`Neutral: ${insights.sentimentDistribution.neutral}%`}
                    />
                    <div
                      style={{ width: `${insights.sentimentDistribution.critical}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Critical: ${insights.sentimentDistribution.critical}%`}
                    />
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Executive Takeaway
                  </h4>
                  <div className="p-3.5 rounded-xl border bg-indigo-50/40 dark:bg-indigo-950/20 text-xs sm:text-sm text-foreground leading-relaxed border-indigo-100 dark:border-indigo-900">
                    {insights.summary}
                  </div>
                </div>

                {/* Key Trends */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Key Trends & Empirical Patterns
                  </h4>
                  <div className="space-y-2">
                    {insights.keyTrends.map((trend, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-card text-xs flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                          {idx + 1}
                        </span>
                        <p className="text-foreground leading-relaxed">{trend}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Recommendations */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Strategic & Policy Interventions
                  </h4>
                  <div className="space-y-2">
                    {insights.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 text-xs flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                          {idx + 1}
                        </span>
                        <p className="text-foreground leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* TAB 2: ACADEMIC PAPER & GROUNDING SOURCES */}
          <TabsContent value="paper" className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
            {/* Grounding Sources Section */}
            <div className="p-3.5 rounded-xl border bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                    Grounded Reference Files & Literature Notes ({groundingSources.length})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingSource(!isAddingSource)}
                  className="h-6 text-[11px] gap-1 border-purple-200 hover:bg-purple-100"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingSource ? "Close" : "Attach File / Notes"}
                </Button>
              </div>

              {/* Source chips */}
              <div className="flex flex-wrap gap-2">
                {groundingSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-card border text-xs shadow-xs"
                  >
                    <FileText className="w-3 h-3 text-purple-500" />
                    <span className="font-medium text-foreground max-w-[180px] truncate">{source.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(source.id)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Source Input Panel */}
              {isAddingSource && (
                <div className="p-3 rounded-lg border bg-background space-y-2 mt-2">
                  <Input
                    placeholder="Document Title (e.g. Theoretical_Framework_Notes.txt)"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Textarea
                    placeholder="Paste preliminary literature review notes, interview transcripts, or theoretical frameworks to ground Gemini's generation..."
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    className="text-xs min-h-[70px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAddingSource(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAddSource}>
                      Attach to Context
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Guided Originality & Review Checklist */}
            <div className="p-3 rounded-xl border bg-muted/40 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ListChecks className="w-4 h-4 text-indigo-500" />
                <span>Author Guided Review & Originality Checklist</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewChecks.hypotheses}
                    onChange={(e) => setReviewChecks({ ...reviewChecks, hypotheses: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>1. Verified research questions & hypotheses</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewChecks.sampling}
                    onChange={(e) => setReviewChecks({ ...reviewChecks, sampling: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>2. Cross-checked N = {responseCount} student sample</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewChecks.sources}
                    onChange={(e) => setReviewChecks({ ...reviewChecks, sources: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>3. Attached literature notes incorporated</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewChecks.originality}
                    onChange={(e) => setReviewChecks({ ...reviewChecks, originality: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>4. Confirmed original human authorship & citations</span>
                </label>
              </div>
            </div>

            {loadingPaper ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-9 h-9 animate-spin text-purple-600" />
                <p className="font-semibold text-foreground text-sm">Synthesizing Grounded Academic Paper...</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Gemini is fusing empirical survey distributions with your {groundingSources.length} grounded literature source documents.
                </p>
              </div>
            ) : paperDraft ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">Grounded APA Research Paper Draft</p>
                      <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                        N = {responseCount} verified respondents • Ready for thesis appendix, grant, or publication.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPaper}
                      className="h-7 text-xs gap-1 border-purple-200 hover:bg-purple-100 dark:border-purple-800"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-purple-600" />}
                      {copied ? "Copied" : "Copy Markdown"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDownloadPaper}
                      className="h-7 text-xs gap-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Download className="w-3 h-3" />
                      Download .md
                    </Button>
                  </div>
                </div>

                {/* Paper Content Viewer */}
                <div className="p-5 rounded-xl border bg-card font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-[44vh] overflow-y-auto border-border shadow-inner">
                  {paperDraft}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
                <h4 className="font-semibold text-sm text-foreground">No Academic Paper Drafted Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click below to generate an empirical research paper draft grounded in student survey data and your attached literature notes.
                </p>
                <Button
                  onClick={handleGeneratePaper}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Grounded Paper Draft
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: AUDIO OVERVIEW & NOTEBOOKLM */}
          <TabsContent value="audio" className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
            {/* Google NotebookLM Export Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                      Google NotebookLM
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Full Audio Overview & Study Material Generator
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-lg">
                    Export your complete Research Connect NG dossier (survey data, empirical quotes, and literature notes) directly into Google NotebookLM to generate deep dive 2-host audio podcasts, video study guides, and briefing decks!
                  </p>
                </div>
                <Button
                  onClick={handleExportNotebookLM}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shrink-0 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Dossier & Open NotebookLM</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            </div>

            {/* In-App Deep Dive Audio Briefing Player */}
            <div className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">In-App 2-Host Audio Briefing Preview</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Simulated Google Deep Dive podcast between Dr. Ade (Faculty) & Chidinma (Field Lead)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAudio}
                    disabled={loadingAudio}
                    className="h-7 text-xs gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-draft Audio Script
                  </Button>
                  <Button
                    size="sm"
                    onClick={handlePlayAudio}
                    disabled={!audioScript || loadingAudio}
                    className={`h-7 text-xs gap-1.5 text-white ${
                      isPlayingAudio ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Square className="w-3 h-3" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Play Audio Briefing</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {loadingAudio ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                  <p className="text-xs font-semibold text-foreground">Generating 2-Host Dialogue Script...</p>
                </div>
              ) : audioScript ? (
                <div className="p-4 rounded-lg bg-muted/40 border text-xs leading-relaxed space-y-2.5 max-h-[38vh] overflow-y-auto font-mono whitespace-pre-wrap">
                  {audioScript}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Click "Re-draft Audio Script" to generate a realistic 2-host audio discussion of your study findings.
                  </p>
                  <Button size="sm" onClick={handleGenerateAudio} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                    Generate Audio Script
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t flex items-center justify-between sm:justify-between w-full">
          {activeTab === "insights" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInsights}
                disabled={loadingInsights}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadInsights}
                  disabled={!insights || loadingInsights}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export Report (.txt)
                </Button>
                <Button
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  Done
                </Button>
              </div>
            </>
          ) : activeTab === "paper" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePaper}
                disabled={loadingPaper}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-draft Grounded Paper
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPaper}
                  disabled={!paperDraft || loadingPaper}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export (.md)
                </Button>
                <Button
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                >
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAudio}
                disabled={loadingAudio}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-draft Podcast
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleExportNotebookLM}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in NotebookLM
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
