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
import { 
  Sparkles, 
  BarChart2, 
  TrendingUp, 
  Lightbulb, 
  ShieldCheck, 
  Download, 
  Loader2, 
  RefreshCw 
} from "lucide-react";
import { generateSurveyInsights, SurveyInsights } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface AiInsightsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyTitle: string;
  responseCount?: number;
}

export const AiInsightsModal = ({
  open,
  onOpenChange,
  surveyTitle,
  responseCount = 127,
}: AiInsightsModalProps) => {
  const [insights, setInsights] = useState<SurveyInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Fetch recorded responses or mock
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
      setLoading(false);
    }
  };

  // Generate on first open if empty
  const onDialogOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !insights && !loading) {
      handleGenerate();
    }
  };

  const handleDownload = () => {
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
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg">Gemini Executive AI Insights</DialogTitle>
                <DialogDescription className="text-xs">
                  Instant synthesis across {responseCount} verified student submissions.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="w-3 h-3 mr-1" /> Fraud Filtered
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {loading ? (
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

                {/* Visual Bar */}
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
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Key Trends & Behavioral Patterns
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
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Strategic Recommendations
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
        </div>

        <DialogFooter className="pt-3 border-t flex items-center justify-between sm:justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!insights || loading}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Report (.txt)
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
