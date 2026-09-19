import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, AlertCircle, LayoutGrid, List, GraduationCap, Microscope, ShieldCheck, CheckCircle2, Sparkles, ShieldAlert, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAvailableSurveys, useMyResponses, useStartSurvey } from "@/hooks/useSurveys";
import { ParticipantStats } from "@/components/participant/ParticipantStats";
import { SurveyCard } from "@/components/participant/SurveyCard";
import { MySurveysList } from "@/components/participant/MySurveysList";
import { SurveyFilters, SortOption, FilterOption } from "@/components/participant/SurveyFilters";
import { EarningsCard } from "@/components/participant/EarningsCard";
import { RecentActivity } from "@/components/participant/RecentActivity";
import { WithdrawalModal } from "@/components/participant/WithdrawalModal";
import { DemographicsModal } from "@/components/participant/DemographicsModal";
import { UnverifiedStudentBanner } from "@/components/UnverifiedStudentBanner";
import { 
  StudentDemographics, 
  getStudentDemographics, 
  calculateDemographicMatch, 
  DemographicMatchResult 
} from "@/lib/demographics";

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: surveys, isLoading: surveysLoading } = useAvailableSurveys();
  const { data: responses, isLoading: responsesLoading } = useMyResponses();
  const startSurvey = useStartSurvey();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [startingSurveyId, setStartingSurveyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("eligible");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isDemographicsModalOpen, setIsDemographicsModalOpen] = useState(false);
  const [localBalanceOverride, setLocalBalanceOverride] = useState<number | null>(null);
  const [demographics, setDemographics] = useState<StudentDemographics>(getStudentDemographics());

  // Calculate stats from responses and local wallet balance
  const stats = useMemo(() => {
    const completed = responses ? responses.filter(r => r.status === "completed") : [];
    const inProgress = responses ? responses.filter(r => r.status === "in_progress") : [];
    const paidResponses = completed.filter(r => r.reward_paid);
    const pendingResponses = completed.filter(r => !r.reward_paid);

    // Calculate total earned from completed surveys
    const totalEarnedFromSurveys = completed.reduce(
      (sum, r) => sum + (r.surveys?.reward_amount ?? (r as any).reward_amount ?? 500), 
      0
    );

    // Available wallet balance: read from localStorage, local override, or profile
    let walletBalance = 0;
    if (localBalanceOverride !== null) {
      walletBalance = localBalanceOverride;
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("research_connect_user_balance");
      if (stored !== null) {
        walletBalance = Number(stored);
      } else {
        walletBalance = Math.max(profile?.balance || 0, totalEarnedFromSurveys);
        localStorage.setItem("research_connect_user_balance", walletBalance.toString());
      }
    } else {
      walletBalance = Math.max(profile?.balance || 0, totalEarnedFromSurveys);
    }

    const totalEarnings = Math.max(totalEarnedFromSurveys, walletBalance);

    return {
      totalEarnings,
      completedSurveys: completed.length,
      pendingBalance: pendingResponses.reduce((sum, r) => sum + (r.surveys?.reward_amount ?? (r as any).reward_amount ?? 0), 0),
      inProgressSurveys: inProgress.length,
      availableBalance: walletBalance,
    };
  }, [responses, profile?.balance, localBalanceOverride]);

  // Differentiate between completed and in-progress survey IDs
  const completedSurveyIds = useMemo(() => {
    if (!responses) return new Set<string>();
    return new Set(
      responses
        .filter(r => r.status === "completed")
        .map(r => r.survey_id || r.surveys?.id)
    );
  }, [responses]);

  const inProgressSurveyIds = useMemo(() => {
    if (!responses) return new Set<string>();
    return new Set(
      responses
        .filter(r => r.status === "in_progress")
        .map(r => r.survey_id || r.surveys?.id)
    );
  }, [responses]);

  // Filter and sort available surveys
  const filteredSurveys = useMemo(() => {
    let localSurveys: any[] = [];
    try {
      const stored = localStorage.getItem("research_connect_custom_surveys");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) localSurveys = parsed;
      }
    } catch {
      localSurveys = [];
    }
    const seedDefaults: any[] = [
      {
        id: "1",
        researcher_id: "seed-1",
        title: "Impact of Mobile Banking Apps on Student Budgets",
        description: "A nationwide investigation on how fintech apps (OPay, Kuda, Moniepoint) shape daily financial habits among university students in Nigeria.",
        reward_amount: 500,
        estimated_time: 4,
        max_responses: 100,
        current_responses: 42,
        status: "active",
        target_universities: ["University of Lagos", "University of Ibadan"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: null,
      },
      {
        id: "2",
        researcher_id: "seed-2",
        title: "Campus Electric Power Outages & Academic Workarounds",
        description: "Evaluating how Nigerian undergraduates navigate electricity instability, generator noise, and phone/laptop charging centers during semester weeks.",
        reward_amount: 750,
        estimated_time: 5,
        max_responses: 150,
        current_responses: 89,
        status: "active",
        target_universities: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: null,
      },
    ];

    const combined = [...localSurveys, ...(surveys && surveys.length > 0 ? surveys : seedDefaults)];
    // Deduplicate by id
    const seen = new Set<string>();
    let result = combined.filter((s: any) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    // 1. Exclude surveys already taken/completed by this user
    // 2. Exclude surveys closed by researchers or quota reached
    let globalStatuses: Record<string, string> = {};
    try {
      globalStatuses = JSON.parse(localStorage.getItem("research_connect_survey_statuses") || "{}");
    } catch {}

    result = result.filter(s => {
      // Exclude if already completed by this user
      if (completedSurveyIds.has(s.id)) return false;

      // Exclude if manually closed by researcher
      if (globalStatuses[s.id] === "closed") return false;

      // Exclude if status is closed or completed
      if (s.status === "closed" || s.status === "completed") return false;

      // Exclude if maximum response quota is reached
      if (s.max_responses !== null && s.current_responses >= s.max_responses) return false;

      return true;
    });
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s => s.title.toLowerCase().includes(query) || 
             s.description?.toLowerCase().includes(query)
      );
    }
    
    // Compute demographic match for each survey
    const matchMap: Record<string, DemographicMatchResult> = {};
    result.forEach((s) => {
      matchMap[s.id] = calculateDemographicMatch(s, demographics);
    });
    
    // Apply category filter
    switch (filterBy) {
      case "direct-match":
        result = result.filter(s => (matchMap[s.id]?.score || 0) === 100 && matchMap[s.id]?.isMatch);
        break;
      case "eligible":
        result = result.filter(s => matchMap[s.id]?.isMatch);
        break;
      case "all-including-ineligible":
        // show everything including ineligible surveys
        break;
      case "high-reward":
        result = result.filter(s => s.reward_amount >= 500);
        break;
      case "quick":
        result = result.filter(s => s.estimated_time < 10);
        break;
      case "limited":
        result = result.filter(s => s.max_responses !== null && (s.max_responses - s.current_responses) <= 10);
        break;
      default:
        result = result.filter(s => matchMap[s.id]?.isMatch);
    }
    
    // Apply sorting: newest also prioritizes direct demographic matches first
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => {
          const scoreDiff = (matchMap[b.id]?.score || 0) - (matchMap[a.id]?.score || 0);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
      case "reward-high":
        result.sort((a, b) => b.reward_amount - a.reward_amount);
        break;
      case "reward-low":
        result.sort((a, b) => a.reward_amount - b.reward_amount);
        break;
      case "time-short":
        result.sort((a, b) => a.estimated_time - b.estimated_time);
        break;
      case "time-long":
        result.sort((a, b) => b.estimated_time - a.estimated_time);
        break;
    }
    
    return result;
  }, [surveys, searchQuery, sortBy, filterBy, completedSurveyIds, demographics]);

  const demographicMatchMap = useMemo(() => {
    const map: Record<string, DemographicMatchResult> = {};
    if (filteredSurveys) {
      filteredSurveys.forEach((s: any) => {
        map[s.id] = calculateDemographicMatch(s, demographics);
      });
    }
    return map;
  }, [filteredSurveys, demographics]);

  const handleStartSurvey = async (surveyId: string) => {
    setStartingSurveyId(surveyId);
    try {
      if (user?.id) {
        await startSurvey.mutateAsync(surveyId).catch(() => {});
      }
      navigate(`/survey/${surveyId}`);
    } catch (error: any) {
      navigate(`/survey/${surveyId}`);
    } finally {
      setStartingSurveyId(null);
    }
  };

  const handleContinueSurvey = (responseId: string, surveyId?: string) => {
    navigate(`/survey/${surveyId || responseId}`);
  };

  const handleWithdraw = () => {
    setIsWithdrawModalOpen(true);
  };

  const isLoading = profileLoading || surveysLoading || responsesLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <UnverifiedStudentBanner className="mb-6" />

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                <GraduationCap className="w-3.5 h-3.5 mr-1" /> Student Participant & Earner Portal
              </Badge>
              {profile?.is_verified ? (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Student ({profile.university?.split("(")[0].trim() || "Institutional"})
                </Badge>
              ) : (
                <Link to="/verify-student">
                  <Badge variant="secondary" className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 cursor-pointer">
                    ⚠️ Verify Student ID / .edu.ng to Withdraw
                  </Badge>
                </Link>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 🎓
            </h1>
            <p className="text-muted-foreground text-sm">
              Participate in verified academic demographic studies, chat with AI surveyor Ada, and earn instant cash rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="text-xs gap-1.5 border-indigo-200 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 shadow-sm">
              <Link to="/dashboard">
                <Microscope className="w-4 h-4 text-indigo-600" />
                <span>Switch to Researcher Studio</span>
              </Link>
            </Button>
            {!profile?.is_verified && (
              <Button asChild className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Link to="/verify-student">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Student Status</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Student Academic & Regional Demographics Bar */}
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-foreground">
                  {demographics.university}
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  {demographics.geopoliticalZone} Zone
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {demographics.levelOfStudy} • {demographics.faculty}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                🎯 Matching active: Surveys are filtered and scored to your institutional and regional demographic profile.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDemographicsModalOpen(true)}
            className="text-xs gap-1.5 shrink-0 border-emerald-300 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-300 font-semibold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Update Demographics</span>
          </Button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <ParticipantStats {...stats} />
            )}

            {/* Tabs */}
            <Tabs defaultValue="available" className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="available">Available Surveys</TabsTrigger>
                    <TabsTrigger value="my-surveys">My Surveys</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search surveys..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "grid" | "list")}>
                      <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
                        <LayoutGrid className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" aria-label="List view" size="sm">
                        <List className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
                
                {/* Filters - only show on available tab */}
                <SurveyFilters 
                  sortBy={sortBy} 
                  filterBy={filterBy}
                  onSortChange={setSortBy}
                  onFilterChange={setFilterBy}
                />
              </div>

              <TabsContent value="available" className="space-y-6">
                {isLoading ? (
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                    : "space-y-4"
                  }>
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className={viewMode === "grid" ? "h-64" : "h-32"} />
                    ))}
                  </div>
                ) : filteredSurveys.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No surveys available</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterBy !== "eligible" 
                        ? "Try adjusting your filters or search term" 
                        : "Check back later for new surveys"}
                    </p>
                    {(searchQuery || filterBy !== "eligible") && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterBy("eligible");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                    : "space-y-4"
                  }>
                    {filteredSurveys.map(survey => (
                      <SurveyCard
                        key={survey.id}
                        survey={survey}
                        onStart={handleStartSurvey}
                        isStarting={startingSurveyId === survey.id}
                        hasStarted={inProgressSurveyIds.has(survey.id)}
                        hasCompleted={completedSurveyIds.has(survey.id)}
                        matchInfo={demographicMatchMap[survey.id]}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-surveys">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : (
                  <MySurveysList 
                    responses={responses || []} 
                    onContinue={handleContinueSurvey}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Earnings Card */}
            {isLoading ? (
              <Skeleton className="h-[320px]" />
            ) : (
              <EarningsCard
                totalEarnings={stats.totalEarnings + stats.pendingBalance}
                pendingBalance={stats.pendingBalance}
                availableBalance={stats.availableBalance}
                completedSurveys={stats.completedSurveys}
                onWithdraw={handleWithdraw}
              />
            )}

            {/* Recent Activity */}
            {isLoading ? (
              <Skeleton className="h-[400px]" />
            ) : (
              <RecentActivity responses={responses || []} />
            )}
          </div>
        </div>
      </main>

      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalance={stats.availableBalance}
        defaultName={profile?.full_name || "STUDENT ACCOUNT"}
        onWithdrawSuccess={(newBal) => {
          setLocalBalanceOverride(newBal);
        }}
      />

      <DemographicsModal
        isOpen={isDemographicsModalOpen}
        onClose={() => setIsDemographicsModalOpen(false)}
        onSaved={(updated) => setDemographics(updated)}
      />

      <Footer />
    </div>
  );
};

export default ParticipantDashboard;
