import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Handles incoming auth redirects, OAuth tokens, and password reset links
 * arriving from Supabase emails or Google OAuth callbacks.
 */
export const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const search = window.location.search;

    // 1. Check for password recovery callback anywhere in the app
    if (hash.includes("type=recovery")) {
      console.log("[AuthHandler] Password recovery callback detected. Routing to /reset-password...");
      if (location.pathname !== "/reset-password") {
        navigate(`/reset-password${hash}`, { replace: true });
      }
      return;
    }

    // 2. Check for OAuth callback errors
    const searchParams = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.replace(/^#/, "?"));
    const errorMsg =
      searchParams.get("error_description") ||
      hashParams.get("error_description") ||
      searchParams.get("error");

    if (errorMsg && (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/")) {
      const decoded = decodeURIComponent(errorMsg).replace(/\+/g, " ");
      // Don't show noisy toasts for harmless cancelled popups
      if (!/cancelled|closed/i.test(decoded)) {
        setTimeout(() => {
          toast({
            title: "Authentication Notification",
            description: decoded,
            variant: "destructive",
          });
        }, 300);
      }
    }

    // 3. Handle OAuth login callback arriving on the home page "/"
    const hasIncomingAuth = hash.includes("access_token=") || searchParams.has("code");

    if (hasIncomingAuth && location.pathname === "/") {
      console.log("[AuthHandler] Incoming OAuth tokens detected on root. Resolving destination...");

      // Listen for session established
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          try {
            // Check profiles table for user role & verification
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, is_verified")
              .eq("user_id", session.user.id)
              .maybeSingle();

            const role = profile?.role || session.user.user_metadata?.role || "researcher";
            const isVerified = profile?.is_verified ?? false;

            if (!isVerified && !sessionStorage.getItem("notified_unverified_student")) {
              sessionStorage.setItem("notified_unverified_student", "true");
              setTimeout(() => {
                toast({
                  title: "⚠️ Student Verification Pending",
                  description: "Your university affiliation is unverified. Verify your student ID or institutional email to access research studies and cash earnings.",
                });
              }, 800);
            }

            const destination = role === "participant" ? "/surveys" : "/dashboard";
            navigate(destination, { replace: true });
          } catch {
            navigate("/dashboard", { replace: true });
          }
        }
      });

      return () => subscription.unsubscribe();
    }

    // 4. Proactive check for any logged-in unverified user on dashboard or surveys
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !sessionStorage.getItem("notified_unverified_student")) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_verified, role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (profile && !profile.is_verified) {
            sessionStorage.setItem("notified_unverified_student", "true");
            setTimeout(() => {
              toast({
                title: "⚠️ Student Verification Pending",
                description: "Your Nigerian university student status is unverified. Verify now to unlock student research studies and cash withdrawals.",
              });
            }, 1200);
          }
        } catch {}
      }
    });
  }, [location.pathname, navigate, toast]);

  return null;
};

export default AuthHandler;
