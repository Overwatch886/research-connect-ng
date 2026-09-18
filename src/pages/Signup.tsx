import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail, Lock, ArrowRight, Eye, EyeOff, User, GraduationCap, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initialRole = searchParams.get("role") || "researcher";
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [role, setRole] = useState<"researcher" | "participant">(initialRole as "researcher" | "participant");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation as defense-in-depth
    const trimmedName = formData.fullName.trim();
    
    if (trimmedName.length === 0) {
      toast({
        title: "Invalid Name",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }
    
    if (trimmedName.length > 100) {
      toast({
        title: "Name Too Long",
        description: "Full name must be 100 characters or less.",
        variant: "destructive",
      });
      return;
    }
    
    if (!['researcher', 'participant'].includes(role)) {
      toast({
        title: "Invalid Role",
        description: "Please select a valid role.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: trimmedName,
            role: role,
          },
        },
      });

      if (data.user) {
        // If email confirmation is required by Supabase, session is null
        if (!data.session) {
          setVerificationSent(true);
          toast({
            title: "Verification Email Sent!",
            description: `Please check ${formData.email} to confirm your account before signing in.`,
          });
          return;
        }

        const targetPath = role === "participant" ? "/surveys" : "/dashboard";
        toast({
          title: "Account created!",
          description: `Welcome to Research Connect. Redirecting to ${role === "participant" ? "Student Earner" : "Researcher"} portal...`,
        });
        navigate(targetPath);
      }
    } catch (error: any) {
      // Map errors to safe user messages to prevent information disclosure
      let userMessage = "Unable to create account. Please try again.";
      
      if (error.message?.toLowerCase().includes('already registered') || 
          error.message?.toLowerCase().includes('already exists')) {
        userMessage = "An account with this email may already exist. Try signing in instead.";
      } else if (error.message?.toLowerCase().includes('password')) {
        userMessage = "Password does not meet requirements. Please use a stronger password.";
      } else if (error.message?.toLowerCase().includes('email')) {
        userMessage = "Please enter a valid email address.";
      }
      
      toast({
        title: "Sign Up Failed",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!formData.email) return;
    setResending(true);
    try {
      await supabase.auth.resend({
        type: "signup",
        email: formData.email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      toast({
        title: "Verification Email Resent",
        description: `We've resent the verification link to ${formData.email}.`,
      });
    } catch (err: any) {
      toast({
        title: "Resend Failed",
        description: err.message || "Failed to resend email. Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Research<span className="text-primary">Connect</span>
            </span>
          </Link>

          {verificationSent ? (
            <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
                <Mail className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-display text-foreground">
                  Verify your email
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We've sent a verification link to <strong className="text-foreground">{formData.email}</strong>. Please check your inbox and click the link to confirm your account.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/60 text-xs text-muted-foreground border space-y-1 text-left">
                <p className="font-semibold text-foreground">Can't find the email?</p>
                <p>Check your spam or promotions folder. It usually arrives within 1-2 minutes.</p>
              </div>

              <div className="space-y-3 pt-2">
                <Button asChild className="w-full">
                  <Link to="/login">
                    Go to Sign In <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Resending Email...
                    </>
                  ) : (
                    "Resend Verification Link"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Start your research journey in minutes
            </p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("researcher")}
              className={`p-4 rounded-xl border-2 transition-all ${
                role === "researcher"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <GraduationCap className={`w-6 h-6 mx-auto mb-2 ${
                role === "researcher" ? "text-primary" : "text-muted-foreground"
              }`} />
              <div className={`font-medium text-sm ${
                role === "researcher" ? "text-primary" : "text-foreground"
              }`}>
                Researcher
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Conduct surveys
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole("participant")}
              className={`p-4 rounded-xl border-2 transition-all ${
                role === "participant"
                  ? "border-secondary bg-secondary/5"
                  : "border-border hover:border-secondary/50"
              }`}
            >
              <Users className={`w-6 h-6 mx-auto mb-2 ${
                role === "participant" ? "text-secondary" : "text-muted-foreground"
              }`} />
              <div className={`font-medium text-sm ${
                role === "participant" ? "text-secondary" : "text-foreground"
              }`}>
                Participant
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Earn money
              </div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Adebayo Johnson"
                  className="pl-10"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">University Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu.ng"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use your .edu.ng email for faster verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              variant={role === "participant" ? "gold" : "default"}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-8">
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-bold mb-4">
            {role === "researcher" 
              ? "Find Your Research Participants" 
              : "Earn While Helping Research"
            }
          </h2>
          <p className="text-primary-foreground/70 mb-8">
            {role === "researcher"
              ? "Access verified Nigerian students for your academic research. Quality responses, fair pricing."
              : "Complete surveys, get paid. Your opinions matter and deserve compensation."
            }
          </p>
          <div className="space-y-4 text-left">
            {role === "researcher" ? (
              <>
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">1</div>
                  <span className="text-sm">Create surveys in minutes</span>
                </div>
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">2</div>
                  <span className="text-sm">Target specific demographics</span>
                </div>
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">3</div>
                  <span className="text-sm">Get verified responses fast</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">1</div>
                  <span className="text-sm">Verify your student status</span>
                </div>
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">2</div>
                  <span className="text-sm">Complete matching surveys</span>
                </div>
                <div className="flex items-center gap-3 bg-primary-foreground/10 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">3</div>
                  <span className="text-sm">Get paid to your bank</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
