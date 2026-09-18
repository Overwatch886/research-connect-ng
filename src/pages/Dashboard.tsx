import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Plus, 
  Users, 
  BarChart3, 
  Settings, 
  Bell, 
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Sparkles,
  Microscope,
  GraduationCap,
  PauseCircle,
  PlayCircle
} from "lucide-react";
import { GeminiKeyModal } from "@/components/GeminiKeyModal";
import { AiInsightsModal } from "@/components/AiInsightsModal";
import { ExtendQuotaModal } from "@/components/ExtendQuotaModal";

// Mock data for demonstration
const mockSurveys = [
  {
    id: "1",
    title: "Impact of Social Media on Academic Performance",
    responses: 127,
    target: 200,
    status: "active",
    createdAt: "2025-01-05"
  },
  {
    id: "2",
    title: "Student Financial Literacy Survey",
    responses: 89,
    target: 100,
    status: "active",
    createdAt: "2025-01-03"
  },
  {
    id: "3",
    title: "Mental Health Awareness Study",
    responses: 200,
    target: 200,
    status: "completed",
    createdAt: "2024-12-20"
  }
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSurveyForInsights, setSelectedSurveyForInsights] = useState<{ title: string; responses: number } | null>(null);
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [surveyToExtend, setSurveyToExtend] = useState<{
    id: string;
    title: string;
    responses: number;
    target: number;
    rewardAmount?: number;
  } | null>(null);

  const [surveyStatuses, setSurveyStatuses] = useState<Record<string, "active" | "closed">>(() => {
    try {
      return JSON.parse(localStorage.getItem("research_connect_survey_statuses") || "{}");
    } catch {
      return {};
    }
  });

  const displaySurveys = useMemo(() => {
    let customSurveys: any[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("research_connect_custom_surveys");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            customSurveys = parsed.map((s: any) => ({
              id: s.id,
              title: s.title || "Untitled Survey",
              responses: s.current_responses || 0,
              target: s.max_responses || 50,
              rewardAmount: s.reward_amount || 500,
              status: s.status || "active",
              createdAt: s.created_at ? s.created_at.split("T")[0] : "Today"
            }));
          }
        }
      } catch {
        customSurveys = [];
      }
    }

    const combined = [...customSurveys, ...mockSurveys];

    return combined.map((s) => {
      // 1. Check researcher manual override
      const manualStatus = surveyStatuses[s.id];
      if (manualStatus) {
        return { ...s, status: manualStatus };
      }
      // 2. Automatically close if maximum response quota is reached
      if (s.responses >= s.target) {
        return { ...s, status: "completed" };
      }
      return s;
    });
  }, [surveyStatuses]);

  const handleToggleSurveyStatus = (
    surveyId: string, 
    currentStatus: string, 
    surveyTitle: string,
    responses?: number,
    target?: number,
    rewardAmount?: number
  ) => {
    // Escrow Protection: If quota is already filled, researcher must add spots & fund escrow!
    if (responses !== undefined && target !== undefined && responses >= target) {
      setSurveyToExtend({
        id: surveyId,
        title: surveyTitle,
        responses,
        target,
        rewardAmount: rewardAmount || 500,
      });
      return;
    }

    const newStatus = currentStatus === "active" ? "closed" : "active";

    const updatedStatuses: Record<string, "active" | "closed"> = { ...surveyStatuses, [surveyId]: newStatus };
    setSurveyStatuses(updatedStatuses);
    localStorage.setItem("research_connect_survey_statuses", JSON.stringify(updatedStatuses));

    try {
      const stored = localStorage.getItem("research_connect_custom_surveys");
      if (stored) {
        const custom = JSON.parse(stored);
        const updatedCustom = custom.map((s: any) => 
          s.id === surveyId ? { ...s, status: newStatus } : s
        );
        localStorage.setItem("research_connect_custom_surveys", JSON.stringify(updatedCustom));
      }
    } catch (e) {}

    try {
      supabase.from("surveys").update({ status: newStatus }).eq("id", surveyId).then(() => {});
    } catch (e) {}

    toast({
      title: newStatus === "closed" ? "Survey Closed" : "Survey Reopened",
      description: newStatus === "closed" 
        ? `"${surveyTitle}" has been closed. Students can no longer submit responses.`
        : `"${surveyTitle}" is now active and accepting student responses.`,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ")[0];
    }
    return "User";
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4 hidden lg:block">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Research<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
          </span>
        </Link>

        {/* Studio Indicator */}
        <div className="mb-6 px-1">
          <Badge variant="outline" className="w-full justify-center py-1 text-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
            <Microscope className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            <span>Researcher Studio</span>
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-600 text-white shadow-sm font-medium text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span>My Studies & Analytics</span>
          </Link>
          <Link 
            to="/create-survey" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
          >
            <Plus className="w-4 h-4 text-indigo-500" />
            <span>AI Survey Architect</span>
          </Link>
          <Link 
            to="/pricing" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Escrow & Pricing</span>
          </Link>

          <div className="pt-4 pb-2">
            <div className="border-t border-border/70 my-2" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-4">Switch Portal</span>
          </div>

          <Link 
            to="/surveys" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-800 transition-colors text-xs font-semibold"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Earner Feed ➔</span>
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
            <Link to="/create-survey">
              <Plus className="w-4 h-4 mr-1.5" />
              Launch New Study
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-destructive text-xs"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search research studies..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild className="hidden sm:flex text-xs gap-1.5 border-emerald-200 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300">
                <Link to="/surveys">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Earner View</span>
                </Link>
              </Button>
              <GeminiKeyModal variant="badge" />
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {getInitials()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Researcher Studio Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 sm:p-6 shadow-md border border-indigo-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  🔬 Academic Research Studio
                </span>
                <span className="text-xs text-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Powered by Gemini 2.0 Flash
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Empirical Research & Institutional Sampling Hub
              </h2>
              <p className="text-xs text-indigo-200/90 max-w-xl">
                Design adaptive demographic surveys, auto-screen student responses with anti-fraud AI, and generate 1-click APA academic whitepaper drafts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Button size="sm" className="bg-white text-indigo-950 hover:bg-indigo-50 text-xs font-semibold shadow" asChild>
                <Link to="/create-survey">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Launch New Survey
                </Link>
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs border-0 shadow gap-1.5" asChild>
                <Link to="/surveys">
                  <GraduationCap className="w-4 h-4 text-white" />
                  Switch to Student View
                </Link>
              </Button>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome back, {getFirstName()}! 👋
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your research
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +12%
                </span>
              </div>
              <h3 className="font-display text-3xl font-bold text-foreground mb-1">3</h3>
              <p className="text-muted-foreground text-sm">Active Surveys</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +23%
                </span>
              </div>
              <h3 className="font-display text-3xl font-bold text-foreground mb-1">416</h3>
              <p className="text-muted-foreground text-sm">Total Responses</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
              <h3 className="font-display text-3xl font-bold text-foreground mb-1">78%</h3>
              <p className="text-muted-foreground text-sm">Completion Rate</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
              <h3 className="font-display text-3xl font-bold text-foreground mb-1">4.2</h3>
              <p className="text-muted-foreground text-sm">Avg. Minutes to Complete</p>
            </div>
          </div>

          {/* Recent Surveys */}
          <div className="bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Your Surveys
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/surveys">View All</Link>
              </Button>
            </div>

            <div className="divide-y divide-border">
              {displaySurveys.map((survey) => (
                <div key={survey.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{survey.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{survey.responses} / {survey.target} responses</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        survey.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300' 
                          : survey.status === 'completed'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {survey.status === 'active' ? '● Active' : survey.status === 'completed' ? '✓ Quota Reached (Closed)' : '⏸ Closed by Researcher'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-32 mr-2 hidden md:block">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          survey.status === 'active' ? 'bg-primary' : 'bg-muted-foreground/60'
                        }`}
                        style={{ width: `${Math.min((survey.responses / survey.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <Button
                      size="sm"
                      onClick={() => setSelectedSurveyForInsights({ title: survey.title, responses: survey.responses })}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-semibold shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Insights</span>
                    </Button>

                    {survey.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSurveyStatus(survey.id, survey.status, survey.title, survey.responses, survey.target, survey.rewardAmount)}
                        className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 gap-1 font-medium"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </Button>
                    ) : survey.status === "completed" || survey.responses >= survey.target ? (
                      <Button
                        size="sm"
                        onClick={() => handleToggleSurveyStatus(survey.id, survey.status, survey.title, survey.responses, survey.target, survey.rewardAmount)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold shadow-sm"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Resume & Add Spots</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSurveyStatus(survey.id, survey.status, survey.title, survey.responses, survey.target, survey.rewardAmount)}
                        className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1 font-medium"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </Button>
                    )}

                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <Link to={`/survey/${survey.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Take
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gemini Executive Insights Modal */}
        {selectedSurveyForInsights && (
          <AiInsightsModal
            open={!!selectedSurveyForInsights}
            onOpenChange={(open) => !open && setSelectedSurveyForInsights(null)}
            surveyTitle={selectedSurveyForInsights.title}
            responseCount={selectedSurveyForInsights.responses}
          />
        )}

        {/* Quota Extension & Escrow Top-up Modal */}
        {surveyToExtend && (
          <ExtendQuotaModal
            isOpen={!!surveyToExtend}
            onClose={() => setSurveyToExtend(null)}
            survey={surveyToExtend}
            onSuccess={(surveyId, newTarget) => {
              setSurveyStatuses((prev) => ({ ...prev, [surveyId]: "active" }));
              setSurveyToExtend(null);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
