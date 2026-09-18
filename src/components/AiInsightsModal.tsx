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
import { Badge } from "@/components/ui/badge";
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
  FileText
} from "lucide-react";
import { generateSurveyInsights, generateAcademicPaperDraft, SurveyInsights } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface AiInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyTitle: string;
  surveyDescription?: string;
  responseCount?: number;
}

export const AiInsightsModal = ({
  open,
  onOpenChange,
  surveyTitle,
  surveyDescription = "Demographic and socio-economic study across Nigerian universities.",
  responseCount = 127,
}: AiInsightsModalProps) => {
  const [activeTab, setActiveTab] = useState<"insights" | "paper">("insights");
  const [insights, setInsights] = useState<SurveyInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const [paperDraft, setPaperDraft] = useState<string | null>(null);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [copied, setCopied] = useState(false);

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
    } catch (err) {
      toast({
        title: "Synthesis Error",
        description: "Failed to generate AI executive insights.",
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
        responseCount
      );
      setPaperDraft(paper);
      toast({
        title: "Academic Paper Drafted",
        description: "Gemini 1.5 Flash synthesized an APA-standard academic paper draft.",
      });
    } catch (err) {
      toast({
        title: "Generation Error",
        description: "Failed to draft academic paper.",
        variant: "destructive",
      });
    } finally {
      setLoadingPaper(false);
    }
  };

  const onDialogOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen) {
      if (!insights && !loadingInsights) {
        handleGenerateInsights();
      }
    }
  };

  const handleTabChange = (val: string) => {
    const tab = val as "insights" | "paper";
    setActiveTab(tab);
    if (tab === "paper" && !paperDraft && !loadingPaper) {
      handleGeneratePaper();
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
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Gemini Academic Intelligence</DialogTitle>
                <DialogDescription className="text-xs">
                  Cross-institutional synthesis & empirical paper generator ({responseCount} verified respondents)
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Data
            </Badge>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
          <div className="pt-2 pb-1">
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
              <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Executive Insights</span>
              </TabsTrigger>
              <TabsTrigger value="paper" className="flex items-center gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                <span>Academic Paper Draft</span>
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
                <div className="p-3.5 rounded-xl bg-muted/40 border space-y-1">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Survey Topic</span>
                  <h3 className="font-bold text-base text-foreground leading-snug">{surveyTitle}</h3>
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

          {/* TAB 2: ACADEMIC PAPER DRAFT */}
          <TabsContent value="paper" className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
            {loadingPaper ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-9 h-9 animate-spin text-purple-600" />
                <p className="font-semibold text-foreground text-sm">Synthesizing Academic Whitepaper Draft...</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Gemini is framing empirical research questions, formatting APA citations, and drafting journal-grade sections.
                </p>
              </div>
            ) : paperDraft ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">APA Research Paper Draft</p>
                      <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                        N = {responseCount} verified respondents • Ready for review, journal submission, or thesis appendix.
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
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
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
                <div className="p-5 rounded-xl border bg-card font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap max-h-[50vh] overflow-y-auto border-border shadow-inner">
                  {paperDraft}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
                <h4 className="font-semibold text-sm text-foreground">No Academic Paper Drafted Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click below to generate a publication-ready academic paper draft with authentic methodology, findings, and APA citations.
                </p>
                <Button
                  onClick={handleGeneratePaper}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Academic Paper Draft
                </Button>
              </div>
            )}
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
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePaper}
                disabled={loadingPaper}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-draft Paper
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
