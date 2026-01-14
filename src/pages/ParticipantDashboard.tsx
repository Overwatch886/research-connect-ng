import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, AlertCircle, LayoutGrid, List } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useAvailableSurveys, useMyResponses, useStartSurvey } from "@/hooks/useSurveys";
import { ParticipantStats } from "@/components/participant/ParticipantStats";
import { SurveyCard } from "@/components/participant/SurveyCard";
import { MySurveysList } from "@/components/participant/MySurveysList";
import { SurveyFilters, SortOption, FilterOption } from "@/components/participant/SurveyFilters";
import { EarningsCard } from "@/components/participant/EarningsCard";
import { RecentActivity } from "@/components/participant/RecentActivity";

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: surveys, isLoading: surveysLoading } = useAvailableSurveys();
  const { data: responses, isLoading: responsesLoading } = useMyResponses();
  const startSurvey = useStartSurvey();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [startingSurveyId, setStartingSurveyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Calculate stats from responses
  const stats = useMemo(() => {
    if (!responses) return { 
      totalEarnings: 0, 
      completedSurveys: 0, 
      pendingBalance: 0, 
      inProgressSurveys: 0,
      availableBalance: profile?.balance || 0
    };
    
    const completed = responses.filter(r => r.status === "completed");
    const inProgress = responses.filter(r => r.status === "in_progress");
    const paidResponses = completed.filter(r => r.reward_paid);
    const pendingResponses = completed.filter(r => !r.reward_paid);
    
    return {
      totalEarnings: paidResponses.reduce((sum, r) => sum + (r.surveys?.reward_amount || 0), 0),
      completedSurveys: completed.length,
      pendingBalance: pendingResponses.reduce((sum, r) => sum + (r.surveys?.reward_amount || 0), 0),
      inProgressSurveys: inProgress.length,
      availableBalance: profile?.balance || 0,
    };
  }, [responses, profile?.balance]);

  // Filter and sort surveys
  const filteredSurveys = useMemo(() => {
    if (!surveys) return [];
    
    let result = [...surveys];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s => s.title.toLowerCase().includes(query) || 
             s.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    switch (filterBy) {
      case "high-reward":
        result = result.filter(s => s.reward_amount >= 500);
        break;
      case "quick":
        result = result.filter(s => s.estimated_time < 10);
        break;
      case "limited":
        result = result.filter(s => s.max_responses !== null && (s.max_responses - s.current_responses) <= 10);
        break;
    }
    
    // Apply sorting
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
  }, [surveys, searchQuery, sortBy, filterBy]);

  // Get IDs of surveys the user has already started
  const startedSurveyIds = useMemo(() => {
    if (!responses) return new Set<string>();
    return new Set(responses.map(r => r.survey_id));
  }, [responses]);

  const handleStartSurvey = async (surveyId: string) => {
    setStartingSurveyId(surveyId);
    try {
      await startSurvey.mutateAsync(surveyId);
      toast({
        title: "Survey Started",
        description: "Good luck! Complete the survey to earn your reward.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start survey",
        variant: "destructive",
      });
    } finally {
      setStartingSurveyId(null);
    }
  };

  const handleContinueSurvey = (responseId: string) => {
    toast({
      title: "Continue Survey",
      description: "Survey taking interface coming soon!",
    });
  };

  const handleWithdraw = () => {
    toast({
      title: "Withdrawal Request",
      description: "Withdrawal feature coming soon! Your funds are safe.",
    });
  };

  // Redirect if not verified
  if (!profileLoading && profile && !profile.is_verified) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to verify your student status to access surveys.{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => navigate("/verify-student")}
              >
                Verify now
              </Button>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  const isLoading = profileLoading || surveysLoading || responsesLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Browse available surveys and earn rewards for your participation.
          </p>
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
                      {searchQuery || filterBy !== "all" 
                        ? "Try adjusting your filters or search term" 
                        : "Check back later for new surveys"}
                    </p>
                    {(searchQuery || filterBy !== "all") && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterBy("all");
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
                        hasStarted={startedSurveyIds.has(survey.id)}
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

      <Footer />
    </div>
  );
};

export default ParticipantDashboard;
