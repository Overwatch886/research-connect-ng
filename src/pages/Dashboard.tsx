import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
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
  Loader2
} from "lucide-react";

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
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();

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
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            Research<span className="text-primary">Naija</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-2">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link 
            to="/surveys" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>My Surveys</span>
          </Link>
          <Link 
            to="/responses" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Responses</span>
          </Link>
          <Link 
            to="/settings" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Button className="w-full" asChild>
            <Link to="/create-survey">
              <Plus className="w-5 h-5 mr-2" />
              Create Survey
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search surveys..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {getInitials()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Verification Banner */}
          {profile && !profile.is_verified && (
            <div className="mb-6 bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Verify Your Student Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete verification to participate in surveys and earn rewards
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/verify-student">Verify Now</Link>
              </Button>
            </div>
          )}

          {profile?.is_verified && (
            <div className="mb-6 bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  Verified Student
                  <CheckCircle className="w-4 h-4 text-success" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  {profile.university || "Student status verified"}
                </p>
              </div>
            </div>
          )}

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
              {mockSurveys.map((survey) => (
                <div key={survey.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{survey.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{survey.responses} / {survey.target} responses</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        survey.status === 'active' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {survey.status === 'active' ? 'Active' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-32 mr-8">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(survey.responses / survey.target) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
