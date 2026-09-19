import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles, ExternalLink, Video, CheckCircle2, X } from "lucide-react";

export const YOUTUBE_VIDEO_ID = "n1C3cstX7xY";
export const YOUTUBE_EMBED_URL = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=0&rel=0`;
export const YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`;

export const openDemoVideoModal = () => {
  window.dispatchEvent(new CustomEvent("open-judge-demo-video"));
};

export const JudgeDemoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Check if previously dismissed in this session
    const dismissed = sessionStorage.getItem("rc_judge_demo_dismissed") === "true";
    if (dismissed) {
      setHasDismissed(true);
    } else {
      // Auto-popup after 2 seconds for fresh visitors / judges
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-judge-demo-video", handleOpen);
    return () => window.removeEventListener("open-judge-demo-video", handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setHasDismissed(true);
    sessionStorage.setItem("rc_judge_demo_dismissed", "true");
  };

  return (
    <>
      {/* Floating Pill Button for Instant Access Anytime */}
      <div className="fixed bottom-5 right-5 z-40 animate-fade-in">
        <Button
          onClick={() => setIsOpen(true)}
          variant="default"
          className="shadow-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-600 hover:from-indigo-700 hover:to-amber-700 text-white font-medium text-xs md:text-sm px-4 py-2.5 rounded-full flex items-center gap-2 border border-white/20 transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <Video className="w-4 h-4 text-white" />
          <span>Watch Demo Video</span>
          <Badge className="bg-white/20 text-white text-[10px] px-1.5 py-0 rounded-full font-mono">
            MLH Judge
          </Badge>
        </Button>
      </div>

      {/* Main Foreground Spotlight Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}>
        <DialogContent className="max-w-4xl w-[94vw] p-0 overflow-hidden border border-border/80 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-2xl md:rounded-3xl">
          {/* Header Bar */}
          <div className="p-5 md:p-6 bg-gradient-to-b from-muted/80 to-transparent border-b border-border/50">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 text-xs px-2.5 py-0.5 font-semibold gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  MLH Build-a-thon Submission
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] px-2 py-0.5">
                  Best Use of Google Gemini API
                </Badge>
              </div>
            </div>

            <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Research Connect NG — Official Demo Walkthrough</span>
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground mt-1">
              Welcome Judges & Visitors! Watch our recorded walkthrough demonstrating verified Nigerian student surveys, Gemini-powered research paper synthesis, and NotebookLM audio overviews.
            </DialogDescription>
          </div>

          {/* YouTube Video Container */}
          <div className="relative aspect-video w-full bg-black">
            {isOpen && (
              <iframe
                src={YOUTUBE_EMBED_URL}
                title="Research Connect NG Demo Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
          </div>

          {/* Footer Highlights & Navigation */}
          <div className="p-4 md:p-6 bg-card border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Student Verification</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Google Gemini API Synthesis</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>NotebookLM Dossier & Audio Briefing</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <a
                href={YOUTUBE_WATCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border transition-colors"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button
                onClick={handleClose}
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 text-xs"
              >
                Explore Live Platform
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
