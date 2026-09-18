import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Lock, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const pwdStrength = getPasswordStrength(password);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pwdStrength.score < 2) {
      toast({
        title: "Password Too Weak",
        description: pwdStrength.hint || "Please use a stronger password with uppercase letters, numbers, or symbols.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please ensure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "🎉 Password Reset Complete!",
        description: "Your password has been successfully updated. You can now sign in.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Your reset link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Research<span className="text-primary">Connect</span>
            </span>
          </Link>

          {!isSuccess ? (
            <>
              {/* Header */}
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Set new password
                </h1>
                <p className="text-muted-foreground text-sm">
                  Create a strong new password for your account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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
                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
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
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${
                          pwdStrength.score <= 1 ? "text-rose-600" :
                          pwdStrength.score === 2 ? "text-amber-600" :
                          pwdStrength.score === 3 ? "text-yellow-600" :
                          "text-emerald-600"
                        }`}>
                          {pwdStrength.label}
                        </span>
                        {pwdStrength.score < 4 && (
                          <span className="text-muted-foreground">{pwdStrength.hint}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-display text-foreground">
                  Password Updated!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Your new password is now active. Redirecting you to sign in...
                </p>
              </div>

              <Button asChild className="w-full">
                <Link to="/login">Go to Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 hero-gradient items-center justify-center p-8">
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-bold mb-4">
            Security First
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed">
            Protecting academic researchers and student participants with industry-standard cryptographic authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
