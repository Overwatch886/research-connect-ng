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
import { Sparkles, Key, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { getGeminiApiKey, setGeminiApiKey } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface GeminiKeyModalProps {
  variant?: "badge" | "button";
}

export const GeminiKeyModal = ({ variant = "badge" }: GeminiKeyModalProps) => {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const existing = getGeminiApiKey();
    setKey(existing);
    setIsConfigured(existing.length > 0);
  }, [open]);

  const handleSave = () => {
    setGeminiApiKey(key);
    setIsConfigured(key.trim().length > 0);
    toast({
      title: key.trim().length > 0 ? "Gemini API Key Saved" : "Smart Fallback Active",
      description: key.trim().length > 0
        ? "Your Google Gemini API key is now active for survey generation, fraud auditing, and insights."
        : "Research Connect NG will use the intelligent fallback AI simulation mode.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle>Google Gemini AI Configuration</DialogTitle>
          </div>
          <DialogDescription>
            Research Connect NG utilizes Google Gemini 1.5 Flash for the AI Survey Architect, Anti-Fraud & Quality Auditor, and Executive Insights.
          </DialogDescription>
        </DialogHeader>

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
            <Label htmlFor="gemini-key" className="text-sm font-medium">
              Gemini API Key
            </Label>
            <div className="relative">
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIzaSy..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="font-mono text-sm pr-10"
              />
              <Key className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Don't have a key?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
            >
              Get free key from Google AI Studio <ExternalLink className="w-3 h-3" />
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
