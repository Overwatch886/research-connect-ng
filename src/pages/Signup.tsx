import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail, Lock, ArrowRight, Eye, EyeOff, User, GraduationCap, Users, Loader2, AlertCircle } from "lucide-react";
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState<"researcher" | "participant">(initialRole as "researcher" | "participant");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${role === "participant" ? "/surveys" : "/dashboard"}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      const msg = error.message || "";
      if (/not enabled|unsupported provider/i.test(msg)) {
        toast({
          title: "Google Provider Setup Required",
          description: "Google Sign-In needs to be enabled in your Supabase Dashboard under Authentication -> Providers -> Google.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Google Sign-Up Failed",
          description: msg || "Failed to initiate Google sign-up.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Password strength scoring (0–4)
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string; hint: string } => {
    if (pwd.length === 0) return { score: 0, label: "", color: "", hint: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (pwd.length < 8) return { score: 0, label: "Too short", color: "bg-rose-500", hint: "Password must be at least 8 characters." };
    if (score === 1) return { score: 1, label: "Weak", color: "bg-rose-500", hint: "Add uppercase letters, numbers, or symbols." };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-400", hint: "Add more variety — symbols or mixed case help." };
    if (score === 3) return { score: 3, label: "Good", color: "bg-yellow-400", hint: "Nearly strong! Add a symbol or more length." };
    return { score: 4, label: "Strong", color: "bg-emerald-500", hint: "Great password!" };
  };

  const pwdStrength = getPasswordStrength(formData.password);

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

    // Block weak passwords before hitting Supabase
    if (pwdStrength.score < 2) {
      toast({
        title: "Password Too Weak",
        description: pwdStrength.hint || "Please use a stronger password with uppercase letters, numbers, or symbols.",
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

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1.5 text-left">
                <p className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Important Delivery Note</span>
                </p>
                <p className="text-muted-foreground">
                  Free tier emails may take 1–2 minutes or land in your <strong>Spam / Junk</strong> folder.
                </p>
                <p className="text-muted-foreground pt-0.5 border-t border-amber-200 dark:border-amber-800/60">
                  ⚡ <strong>For instant signup</strong>: You can disable <em>"Confirm email"</em> in Supabase Dashboard (<em>Authentication → Providers → Email</em>) so users sign in instantly without waiting for verification emails.
                </p>
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

              {/* Password Strength Meter */}
              {formData.password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          pwdStrength.score >= seg ? pwdStrength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${
                      pwdStrength.score <= 1 ? "text-rose-600" :
                      pwdStrength.score === 2 ? "text-amber-600" :
                      pwdStrength.score === 3 ? "text-yellow-600" :
                      "text-emerald-600"
                    }`}>
                      {pwdStrength.label}
                    </p>
                    {pwdStrength.score < 4 && (
                      <p className="text-xs text-muted-foreground">{pwdStrength.hint}</p>
                    )}
                  </div>
                </div>
              )}
            </div>


            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              variant={role === "participant" ? "gold" : "default"}
              disabled={isLoading || isGoogleLoading}
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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Social Sign Up */}
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
            className="w-full"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>

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
