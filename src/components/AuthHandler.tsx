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
            // Check profiles table for user role
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();

            const role = profile?.role || session.user.user_metadata?.role || "researcher";
            const destination = role === "participant" ? "/surveys" : "/dashboard";
            navigate(destination, { replace: true });
          } catch {
            navigate("/dashboard", { replace: true });
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [location.pathname, navigate, toast]);

  return null;
};

export default AuthHandler;
