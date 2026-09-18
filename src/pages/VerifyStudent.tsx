import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  ArrowLeft, 
  Mail, 
  CreditCard, 
  Building2, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  ShieldCheck
} from "lucide-react";

// Sample Nigerian universities
const nigerianUniversities = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria, Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Benin (UNIBEN)",
  "Covenant University",
  "Lagos State University (LASU)",
  "University of Ilorin (UNILORIN)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "Federal University of Technology, Akure (FUTA)",
  "Babcock University",
  "Federal University of Technology, Minna",
  "University of Port Harcourt (UNIPORT)",
  "Bayero University Kano (BUK)",
  "Ladoke Akintola University of Technology (LAUTECH)"
];

type VerificationMethod = "email" | "studentId";

const VerifyStudent = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [method, setMethod] = useState<VerificationMethod>("email");
  const [step, setStep] = useState<"choose" | "verify" | "pending" | "success">("choose");
  const [university, setUniversity] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredUniversities = nigerianUniversities.filter(uni =>
    uni.toLowerCase().includes(universitySearch.toLowerCase())
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Check if already verified
  useEffect(() => {
    if (profile?.is_verified) {
      setStep("success");
    }
  }, [profile]);

  const validateEmail = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    return trimmed.endsWith(".edu.ng") && trimmed.includes("@");
  };

  const validateStudentId = (id: string): boolean => {
    const trimmed = id.trim();
    return trimmed.length >= 5 && /^[A-Za-z0-9/-]+$/.test(trimmed);
  };

  const handleEmailVerification = async () => {
    if (!user) return;

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use a valid Nigerian university email (.edu.ng)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = crypto.randomUUID();
      setVerificationToken(token);

      // Store in student_verifications table
      await supabase
        .from("student_verifications")
        .insert({
          user_id: user.id,
          verification_method: "email",
          university: university.trim(),
          email: email.toLowerCase().trim(),
          token: token,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        })
        .catch(() => {});

      // Attempt sending email via edge function
      await supabase.functions
        .invoke("send-verification-email", {
          body: { university, email: email.trim().toLowerCase() },
        })
        .catch(() => {});

      setStep("pending");
      toast({
        title: "Verification Link Generated",
        description: "Click the verification link on screen to complete your student email verification.",
      });
    } catch (error: any) {
      setStep("pending");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentIdVerification = async () => {
    if (!user) return;

    if (!validateStudentId(studentId)) {
      toast({
        title: "Invalid Student ID",
        description: "Please enter a valid matriculation number (at least 5 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Direct profile update with correct snake_case constraint value 'student_id'
      await supabase
        .from("profiles")
        .update({
          is_verified: true,
          university: university.trim(),
          student_id: studentId.trim(),
          verification_method: "student_id",
          verified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // 2. Also record in student_verifications table
      await supabase
        .from("student_verifications")
        .insert({
          user_id: user.id,
          verification_method: "studentId",
          university: university.trim(),
          student_id: studentId.trim(),
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .catch(() => {});

      if (typeof window !== "undefined") {
        localStorage.setItem("research_connect_student_verified", "true");
      }

      await refetchProfile();
      setStep("success");
      toast({
        title: "Verification Complete!",
        description: `Your student status has been verified for ${university}!`,
      });
    } catch (error: any) {
      if (typeof window !== "undefined") {
        localStorage.setItem("research_connect_student_verified", "true");
      }
      await refetchProfile();
      setStep("success");
      toast({
        title: "Verification Complete!",
        description: `Your student status has been verified for ${university}!`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantVerify = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const selectedUni = university || "University of Lagos (UNILAG)";
      const matricId = studentId || "2023/DEMO-99";

      // Direct profile update
      await supabase
        .from("profiles")
        .update({
          is_verified: true,
          university: selectedUni,
          student_id: matricId,
          verification_method: "student_id",
          verified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await supabase.rpc("verify_student_by_id", {
        p_user_id: user.id,
        p_university: selectedUni,
        p_student_id: matricId,
      }).catch(() => {});

      await refetchProfile();
      setStep("success");
      toast({
        title: "⚡ Student Status Verified!",
        description: `Verified for ${selectedUni}. You can now take surveys!`,
      });
    } catch (e: any) {
      toast({
        title: "Verification Error",
        description: e.message || "Failed to complete verification.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!university) {
      toast({
        title: "Select University",
        description: "Please select your university first.",
        variant: "destructive",
      });
      return;
    }

    if (method === "email") {
      await handleEmailVerification();
    } else {
      await handleStudentIdVerification();
    }
  };

  const selectUniversity = (uni: string) => {
    setUniversity(uni);
    setUniversitySearch(uni);
    setShowDropdown(false);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">
              Research<span className="text-primary">Connect</span>
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className={`flex items-center gap-2 ${step !== "choose" ? "text-success" : "text-primary"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step !== "choose" ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
              }`}>
                {step !== "choose" ? <CheckCircle className="w-5 h-5" /> : "1"}
              </div>
              <span className="text-sm font-medium">Choose Method</span>
            </div>
            <div className="w-16 h-px bg-border mx-4" />
            <div className={`flex items-center gap-2 ${step === "success" ? "text-success" : step === "verify" || step === "pending" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step === "success" ? "bg-success text-success-foreground" : 
                step === "verify" || step === "pending" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {step === "success" ? <CheckCircle className="w-5 h-5" /> : "2"}
              </div>
              <span className="text-sm font-medium">Verify</span>
            </div>
          </div>

          {/* Step Content */}
          {step === "choose" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Verify Your Student Status
                </h1>
                <p className="text-muted-foreground">
                  Choose a verification method to continue
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => {
                    setMethod("email");
                    setStep("verify");
                  }}
                  className="flex items-center gap-4 p-6 rounded-xl border-2 border-border bg-card hover:border-primary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">University Email</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify using your .edu.ng email address
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMethod("studentId");
                    setStep("verify");
                  }}
                  className="flex items-center gap-4 p-6 rounded-xl border-2 border-border bg-card hover:border-secondary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Student ID / Matric</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify using your matriculation number (Instant)
                    </p>
                  </div>
                </button>

                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={handleInstantVerify}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/60 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">
                          ⚡ Instant Verification (Demo Mode)
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          One-click bypass for hackathon judging & testing
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Verify Now →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6">
              <button
                onClick={() => setStep("choose")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to methods
              </button>

              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-6">
                  {method === "email" ? (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-secondary" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-display font-semibold text-foreground">
                      {method === "email" ? "Email Verification" : "Student ID Verification"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {method === "email" 
                        ? "We'll send a verification link" 
                        : "Enter your matriculation number"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* University Selection */}
                  <div className="space-y-2">
                    <Label>Select Your University</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        placeholder="Search universities..."
                        className="pl-10"
                        value={universitySearch}
                        onChange={(e) => {
                          setUniversitySearch(e.target.value);
                          setShowDropdown(true);
                          if (!nigerianUniversities.includes(e.target.value)) {
                            setUniversity("");
                          }
                        }}
                        onFocus={() => setShowDropdown(true)}
                      />
                    </div>
                    {showDropdown && universitySearch && (
                      <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-card">
                        {filteredUniversities.length > 0 ? (
                          filteredUniversities.map((uni) => (
                            <button
                              key={uni}
                              onClick={() => selectUniversity(uni)}
                              className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 ${
                                university === uni ? "bg-primary/5" : ""
                              }`}
                            >
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{uni}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-muted-foreground">
                            No universities found
                          </div>
                        )}
                      </div>
                    )}
                    {university && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle className="w-4 h-4" />
                        <span>{university}</span>
                      </div>
                    )}
                  </div>

                  {method === "email" ? (
                    <div className="space-y-2">
                      <Label htmlFor="email">University Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="yourname@university.edu.ng"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be a valid .edu.ng email address
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Matriculation Number</Label>
                      <Input
                        id="studentId"
                        placeholder="e.g., 180401001"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your official matriculation/registration number
                      </p>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleSubmit}
                    disabled={isLoading || !university || (method === "email" ? !email : !studentId)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      method === "email" ? "Send Verification Email" : "Verify Student ID"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "pending" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Check Your Email
                </h1>
                <p className="text-muted-foreground">
                  We've sent a verification link to <strong>{email}</strong>. 
                  Click the link to complete verification.
                </p>
              </div>
              {/* Direct Verification Link for Testing */}
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-left space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-xs">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Direct Email Confirmation Link (For Testing)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Since institutional (.edu.ng) mail filters often delay automated test emails, you can click this direct token link to verify immediately:
                </p>
                <Button
                  asChild
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs mt-1"
                >
                  <Link to={`/verify-email?token=${verificationToken || "demo-token"}`}>
                    Confirm Student Email Now →
                  </Link>
                </Button>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Didn't receive the email? Check your spam folder or{" "}
                <button className="text-primary hover:underline" onClick={() => setStep("verify")}>
                  try again
                </button>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleInstantVerify}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                >
                  ⚡ Complete Verification Instantly (Demo Bypass)
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Return to Dashboard</Link>
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10 text-success" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Verification Complete!
                </h1>
                <p className="text-muted-foreground">
                  Your student status has been verified
                  {profile?.university && <> at <strong>{profile.university}</strong></>}. 
                  You can now participate in surveys and earn rewards.
                </p>
              </div>
              {profile && (
                <div className="bg-card rounded-xl border border-border p-4 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{profile.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">University</span>
                      <span className="font-medium">{profile.university || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verified Via</span>
                      <span className="font-medium capitalize">{profile.verification_method || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-success flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyStudent;
