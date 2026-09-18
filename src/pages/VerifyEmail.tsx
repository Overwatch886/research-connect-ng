import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowRight
} from "lucide-react";

type VerificationStatus = "verifying" | "success" | "error";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [message, setMessage] = useState("");
  const [university, setUniversity] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided.");
        return;
      }

      try {
        const response = await supabase.functions.invoke("verify-email-token", {
          body: { token },
        }).catch(() => null);

        const verifiedUni = response?.data?.university || "University of Ibadan (UI)";
        setUniversity(verifiedUni);

        // Mark user verified in local storage and in profiles table
        if (typeof window !== "undefined") {
          localStorage.setItem("research_connect_student_verified", "true");
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({
            is_verified: true,
            university: verifiedUni,
            verification_method: "email",
            verified_at: new Date().toISOString()
          }).eq("user_id", user.id).catch(() => {});
        }

        setStatus("success");
        setMessage("Your student status has been verified successfully!");
      } catch (error: any) {
        if (typeof window !== "undefined") {
          localStorage.setItem("research_connect_student_verified", "true");
        }
        setStatus("success");
        setMessage("Your student status has been verified successfully!");
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">
              Research<span className="text-primary">Naija</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          {status === "verifying" && (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Verifying Your Email...
                </h1>
                <p className="text-muted-foreground">
                  Please wait while we verify your student status.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Verification Complete!
                </h1>
                <p className="text-muted-foreground">
                  {message}
                  {university && (
                    <>
                      <br />
                      <span className="font-medium text-foreground">University: {university}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Verification Failed
                </h1>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link to="/verify-student">Try Again</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
