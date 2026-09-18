import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Sparkles, 
  Mic, 
  BookOpen, 
  Headphones, 
  CheckCircle2, 
  Video, 
  ShieldCheck, 
  ArrowRight
} from "lucide-react";

const Demo = () => {
  const [activeTab, setActiveTab] = useState<"interactive" | "video">("interactive");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [activeStep, setActiveStep] = useState(1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Header */}
        <section className="container mx-auto px-4 text-center max-w-4xl mb-12">
          <Badge variant="outline" className="px-3.5 py-1.5 border-primary/30 text-primary bg-primary/5 text-xs font-semibold uppercase tracking-wider mb-4 gap-1.5">
            <Video className="w-3.5 h-3.5" />
            Product Walkthrough & Demonstration
          </Badge>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Experience Research Connect NG <span className="gradient-text">in Action</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            See how Nigerian researchers create AI-calibrated surveys, how verified students earn cash through conversational interviews, and how findings transform into publication-ready research papers.
          </p>

          {/* Recording Reminder Alert */}
          <div className="mt-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-left max-w-3xl mx-auto flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Video className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <span>📹 Live Video Demo Recording Reminder</span>
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">To-Do</Badge>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Remember to record a 2 to 3-minute screen recording of the site in use showcasing:
                (1) Survey generation with Gemini AI, (2) Conversational interview with voice dictation, and (3) Academic paper drafting with 1-click Google NotebookLM export.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube or Loom Embed URL here..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-background border border-border w-full sm:w-80 outline-none focus:ring-1 focus:ring-amber-500"
                />
                {videoUrl && (
                  <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-500/40">
                    Video Linked!
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Video / Interactive Player Stage */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
            {/* Stage Bar */}
            <div className="bg-muted/60 border-b border-border px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="text-xs font-mono text-muted-foreground ml-2">research-connect-ng-demo.mp4</span>
              </div>
              <div className="flex items-center gap-1.5 bg-background/80 p-1 rounded-xl border border-border text-xs">
                <button
                  onClick={() => setActiveTab("interactive")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === "interactive"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Interactive Walkthrough
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === "video"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Recorded Video
                </button>
              </div>
            </div>

            {/* Video Tab */}
            {activeTab === "video" && (
              <div className="aspect-video bg-neutral-950 flex flex-col items-center justify-center p-8 text-center text-white relative">
                {videoUrl ? (
                  <iframe
                    src={videoUrl.includes("watch?v=") ? videoUrl.replace("watch?v=", "embed/") : videoUrl}
                    title="Platform Demo Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="max-w-md space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-primary backdrop-blur-md border border-white/20">
                      <Play className="w-8 h-8 ml-1 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-white">
                      Recorded Demo Video Container
                    </h3>
                    <p className="text-sm text-neutral-400">
                      You can paste your YouTube/Loom video link in the reminder box above, or place your video in <code className="text-neutral-200 bg-white/10 px-1 py-0.5 rounded">public/demo.mp4</code>.
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="gold"
                        onClick={() => setActiveTab("interactive")}
                        className="gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Explore Interactive Simulator
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Simulator Tab */}
            {activeTab === "interactive" && (
              <div className="p-6 md:p-10 space-y-8">
                {/* Step Navigation Pills */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveStep(1)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      activeStep === 1
                        ? "bg-indigo-500/10 border-indigo-500/50 ring-2 ring-indigo-500/20"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        Step 1
                      </span>
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="font-semibold text-sm">Gemini Survey Architect</h4>
                    <p className="text-xs text-muted-foreground mt-1">Consultative design, Nigerian variables & escrow locking</p>
                  </button>

                  <button
                    onClick={() => setActiveStep(2)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      activeStep === 2
                        ? "bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        Step 2
                      </span>
                      <Mic className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h4 className="font-semibold text-sm">Conversational Voice Interview</h4>
                    <p className="text-xs text-muted-foreground mt-1">Ada interviewer, speech-to-text & anti-fraud relevance audit</p>
                  </button>

                  <button
                    onClick={() => setActiveStep(3)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      activeStep === 3
                        ? "bg-purple-500/10 border-purple-500/50 ring-2 ring-purple-500/20"
                        : "bg-card border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        Step 3
                      </span>
                      <Headphones className="w-4 h-4 text-purple-500" />
                    </div>
                    <h4 className="font-semibold text-sm">Paper Draft & NotebookLM</h4>
                    <p className="text-xs text-muted-foreground mt-1">Grounded APA paper draft, 2-host audio briefing & 1-click dossier</p>
                  </button>
                </div>

                {/* Step Showcase Card */}
                <div className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8">
                  {activeStep === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-indigo-600 text-white mb-2">Researcher Experience</Badge>
                          <h3 className="font-display text-2xl font-bold">
                            AI Survey Architect & Transparent Escrow Budgeting
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Researchers provide their topic (e.g. "Fuel subsidy impact on UNILAG student commuting"). Gemini clarifies demographic variables, builds calibrated questions, and calculates escrow with a 10% platform fee.
                          </p>
                        </div>
                        <Link to="/create-survey">
                          <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                            Try Survey Builder <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>

                      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-3 border-b pb-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            AI
                          </div>
                          <div>
                            <p className="text-xs font-semibold">Gemini Clarification Question:</p>
                            <p className="text-xs text-muted-foreground">"Should we distinguish between on-campus hostel residents vs off-campus commuters paying bus fares?"</p>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-muted p-3 rounded-lg">
                            <span className="text-muted-foreground block">Student Reward</span>
                            <span className="font-bold text-sm">₦500 / respondent</span>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <span className="text-muted-foreground block">Sample Size</span>
                            <span className="font-bold text-sm">50 Verified Students</span>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                            <span className="text-emerald-700 dark:text-emerald-400 block font-medium">Total Escrow (incl. 10% fee)</span>
                            <span className="font-bold text-sm text-emerald-600">₦27,500</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-emerald-600 text-white mb-2">Student Participant Experience</Badge>
                          <h3 className="font-display text-2xl font-bold">
                            Conversational Voice Interview with Ada & Relevance Auditor
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Verified students talk directly to Ada via speech-to-text or typing. Gemini audits responses in real time for genuine topical relevance, preventing gibberish and paying out instantly upon completion.
                          </p>
                        </div>
                        <Link to="/surveys">
                          <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                            View Student Portal <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>

                      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                            Ada
                          </div>
                          <div className="bg-muted/80 p-3.5 rounded-2xl rounded-tl-none text-xs space-y-1">
                            <p className="font-medium text-foreground">"Welcome, student researcher! How has the recent fuel price increase affected your daily transit to campus?"</p>
                            <span className="text-[10px] text-muted-foreground">Ada • Research Interviewer</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Gemini Semantic Auditor: Evaluates answer relevance against domain vocabulary (shuttle, hostel, transport fares) before unlocking cash reward.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className="bg-purple-600 text-white mb-2">Academic Whitepaper & Audio</Badge>
                          <h3 className="font-display text-2xl font-bold">
                            Grounded Paper Draft & Google NotebookLM Hub
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Empirical response data is synthesized into an APA-formatted academic paper grounded by your reference literature. Export in 1 click to Google NotebookLM for audio podcast overviews.
                          </p>
                        </div>
                        <Link to="/dashboard">
                          <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                            Open Researcher Studio <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>

                      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-muted p-3.5 rounded-xl space-y-1 border">
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                              <span>Grounded APA Paper Draft</span>
                            </div>
                            <p className="text-muted-foreground text-[11px]">
                              Complete with Abstract, Literature Review, Methodology, Empirical Tables, and APA References.
                            </p>
                          </div>

                          <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-xl space-y-1">
                            <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                              <Headphones className="w-4 h-4" />
                              <span>NotebookLM Audio Overview</span>
                            </div>
                            <p className="text-purple-600/80 dark:text-purple-400 text-[11px]">
                              1-Click export packages findings & literature into a dossier for Google NotebookLM 2-host deep dives.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Action Callout */}
        <section className="container mx-auto px-4 max-w-4xl mt-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Ready to test Research Connect NG directly?
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-xl mx-auto">
            Switch effortlessly between the Researcher Studio and Student Earner Portal right in your browser.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="gold" asChild>
              <Link to="/dashboard" className="gap-2">
                Launch Researcher Studio <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link to="/surveys">
                Launch Student Earner Portal
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;
