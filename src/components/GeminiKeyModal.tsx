import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Key, CheckCircle2, ExternalLink, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { getGeminiApiKey, setGeminiApiKey } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from "@/hooks/use-toast";

interface GeminiKeyModalProps {
  variant?: "badge" | "button";
}

export const GeminiKeyModal = ({ variant = "badge" }: GeminiKeyModalProps) => {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [quotaAlert, setQuotaAlert] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"success" | "error" | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const existing = getGeminiApiKey();
    setKey(existing);
    setIsConfigured(existing.length > 0);
  }, [open]);

  // Automatically pop up when platform rate limit or quota is exhausted
  useEffect(() => {
    const handleQuotaExhausted = (e: any) => {
      setQuotaAlert(true);
      setOpen(true);
    };

    window.addEventListener("gemini_quota_exhausted", handleQuotaExhausted);
    return () => window.removeEventListener("gemini_quota_exhausted", handleQuotaExhausted);
  }, []);

  const handleTestKey = async () => {
    if (!key.trim()) {
      toast({ title: "No key provided", description: "Please enter an API key to test.", variant: "destructive" });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const genAI = new GoogleGenerativeAI(key.trim());
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("Test connection");
      setTestStatus("success");
      toast({
        title: "API Key Verified!",
        description: "Successfully connected to Google Gemini 1.5 Flash.",
      });
    } catch (err: any) {
      setTestStatus("error");
      toast({
        title: "Connection Failed",
        description: err.message || "Invalid key or Google quota limit reached.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setGeminiApiKey(key);
    setIsConfigured(key.trim().length > 0);
    setQuotaAlert(false);
    toast({
      title: key.trim().length > 0 ? "Gemini API Key Saved" : "Smart Fallback Active",
      description: key.trim().length > 0
        ? "Your Google Gemini API key is now active for survey generation, fraud auditing, and insights."
        : "Research Connect NG will use the intelligent fallback AI simulation mode.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setQuotaAlert(false); }}>
      <DialogTrigger asChild>
        {variant === "badge" ? (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>Gemini AI:</span>
            {isConfigured ? (
              <span className="flex items-center text-emerald-600 font-semibold gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">Ready (Demo Mode)</span>
            )}
          </button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Key className="w-4 h-4 text-indigo-500" />
            <span>Configure Gemini AI</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[490px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle>Google Gemini AI Configuration</DialogTitle>
          </div>
          <DialogDescription>
            Research Connect NG utilizes Google Gemini 1.5 Flash for the AI Survey Architect, Anti-Fraud Quality Auditor, and Executive Insights.
          </DialogDescription>
        </DialogHeader>

        {quotaAlert && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">⚡ Shared Platform Quota Limit Reached</span>
              The platform's default Gemini key reached its Google AI Studio rate limit. Enter your own personal free key below to continue testing without interruptions!
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="bg-muted/60 p-3.5 rounded-lg border text-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>For Hackathon Judges & Evaluators</span>
            </div>
            <p className="text-muted-foreground">
              You can supply your Google AI Studio key below for direct live calls. If left empty, the platform automatically activates <strong>Smart Simulation Mode</strong>, guaranteeing an error-free evaluation experience.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-key" className="text-sm font-medium">
                Gemini API Key
              </Label>
              {testStatus === "success" && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Key Verified Active
                </span>
              )}
              {testStatus === "error" && (
                <span className="text-[11px] text-destructive font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Key Verification Failed
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIzaSy..."
                value={key}
                onChange={(e) => { setKey(e.target.value); setTestStatus(null); }}
                className="font-mono text-sm pr-10"
              />
              <Key className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestKey}
              disabled={!key.trim() || isTesting}
              className="h-7 text-xs gap-1"
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-500" />}
              <span>Test API Key</span>
            </Button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
            >
              Get free key at Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => { setKey(""); handleSave(); }}>
            Use Demo Mode
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
