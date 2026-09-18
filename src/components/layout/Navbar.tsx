import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Menu, 
  X, 
  FileText, 
  Sparkles, 
  GraduationCap, 
  Microscope, 
  CheckCircle2, 
  LogOut, 
  ArrowRightLeft,
  ShieldCheck,
  PlusCircle,
  BarChart3
} from "lucide-react";
import { GeminiKeyModal } from "@/components/GeminiKeyModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  // Determine current portal mode based on route
  const isResearcherPortal = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/create-survey");
  const isParticipantPortal = location.pathname.startsWith("/surveys") || location.pathname.startsWith("/verify") || location.pathname.startsWith("/survey/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const landingLinks = [
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "For Researchers", href: "/dashboard" },
    { name: "For Students", href: "/surveys" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              Research<span className="text-indigo-600 dark:text-indigo-400">Naija</span>
            </span>
          </Link>

          {/* Center Navigation / Role Switcher */}
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              {/* Distinct Portal Switcher Pill */}
              <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/80 shadow-inner">
                <Link
                  to="/surveys"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isParticipantPortal
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Earner</span>
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isResearcherPortal
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Microscope className="w-3.5 h-3.5" />
                  <span>Researcher Studio</span>
                </Link>
              </div>

              {/* Portal-specific quick links */}
              {isResearcherPortal ? (
                <div className="flex items-center gap-4 text-xs font-medium ml-2">
                  <Link to="/create-survey" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Create Survey</span>
                  </Link>
                  <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
                    Escrow Pricing
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-xs font-medium ml-2">
                  <Link to="/surveys" className="text-muted-foreground hover:text-foreground">
                    Earn Feed
                  </Link>
                  <Link to="/verify-student" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Student Verification</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Desktop Landing Navigation */
            <div className="hidden md:flex items-center gap-8">
              {landingLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <GeminiKeyModal variant="badge" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-1 ring-border">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(profile?.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{profile?.full_name || "Account"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <div className="pt-1.5 flex items-center gap-1.5">
                        {profile?.is_verified ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Student
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            {isResearcherPortal ? "Researcher" : "Student Participant"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/surveys" className="flex items-center gap-2 cursor-pointer text-xs">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Switch to Student Earner</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer text-xs">
                      <Microscope className="w-4 h-4 text-indigo-600" />
                      <span>Switch to Researcher Studio</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/verify-student" className="flex items-center gap-2 cursor-pointer text-xs">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Student ID / Email Verification</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-xs text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {user ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                  <p className="text-sm font-semibold">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={isParticipantPortal ? "default" : "outline"}
                    className="w-full text-xs gap-1.5"
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to="/surveys">
                      <GraduationCap className="w-4 h-4" /> Student Portal
                    </Link>
                  </Button>
                  <Button
                    variant={isResearcherPortal ? "default" : "outline"}
                    className="w-full text-xs gap-1.5"
                    asChild
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to="/dashboard">
                      <Microscope className="w-4 h-4" /> Researcher
                    </Link>
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-xs justify-start gap-2"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/create-survey">
                    <PlusCircle className="w-4 h-4 text-indigo-500" /> Create Survey (Escrow)
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs justify-start gap-2"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/verify-student">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Student Verification (.edu.ng)
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  className="w-full text-xs gap-2"
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            ) : (
              <>
                {landingLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 space-y-2 border-t border-border">
                  <Button variant="outline" className="w-full" asChild onClick={() => setIsOpen(false)}>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild onClick={() => setIsOpen(false)}>
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

