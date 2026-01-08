import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  ArrowLeft, 
  Mail, 
  CreditCard, 
  Building2, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Search
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
  const [method, setMethod] = useState<VerificationMethod>("email");
  const [step, setStep] = useState<"choose" | "verify" | "pending" | "success">("choose");
  const [university, setUniversity] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredUniversities = nigerianUniversities.filter(uni =>
    uni.toLowerCase().includes(universitySearch.toLowerCase())
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setStep(method === "email" ? "pending" : "success");
  };

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
              Research<span className="text-primary">Naija</span>
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
                    <h3 className="font-semibold text-foreground mb-1">Student ID</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify using your matriculation number
                    </p>
                  </div>
                </button>
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
                        onChange={(e) => setUniversitySearch(e.target.value)}
                      />
                    </div>
                    {universitySearch && (
                      <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                        {filteredUniversities.map((uni) => (
                          <button
                            key={uni}
                            onClick={() => {
                              setUniversity(uni);
                              setUniversitySearch(uni);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 ${
                              university === uni ? "bg-primary/5" : ""
                            }`}
                          >
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{uni}</span>
                          </button>
                        ))}
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
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Didn't receive the email? Check your spam folder or{" "}
                <button className="text-primary hover:underline" onClick={() => setStep("verify")}>
                  try again
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Verification Complete!
                </h1>
                <p className="text-muted-foreground">
                  Your student status has been verified. You can now participate 
                  in surveys and earn rewards.
                </p>
              </div>
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
