import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyTokenRequest {
  token: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 10;

// In-memory rate limiting (works per-instance, but sufficient for basic protection)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkInMemoryRateLimit(ipAddress: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const key = `verify-email-token:${ipAddress}`;
  const existing = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (existing) {
    // Check if window has expired
    if (now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
      // Reset window
      rateLimitMap.set(key, { count: 1, windowStart: now });
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - 1 };
    }

    if (existing.count >= MAX_ATTEMPTS_PER_WINDOW) {
      return { allowed: false, remainingAttempts: 0 };
    }

    // Increment count
    existing.count++;
    return { 
      allowed: true, 
      remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - existing.count 
    };
  }

  // New entry
  rateLimitMap.set(key, { count: 1, windowStart: now });
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - 1 };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor 
      ? forwardedFor.split(",")[0].trim() 
      : req.headers.get("x-real-ip") || "unknown";

    // Check rate limit
    const { allowed, remainingAttempts } = checkInMemoryRateLimit(ipAddress);

    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Too many verification attempts. Please try again in 15 minutes." 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "900" // 15 minutes in seconds
          } 
        }
      );
    }

    const { token }: VerifyTokenRequest = await req.json();

    if (!token || token.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Verification token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic token format validation (UUIDs are 36 characters with hyphens)
    const trimmedToken = token.trim();
    if (trimmedToken.length > 100 || !/^[a-zA-Z0-9-]+$/.test(trimmedToken)) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to verify the token
    const { data, error } = await supabase.rpc("verify_student_by_token", {
      verification_token: trimmedToken,
    });

    if (error) {
      console.error("RPC error:", error);
      return new Response(
        JSON.stringify({ error: "Verification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.success) {
      // Use generic error message to prevent information disclosure
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Student verification complete",
        university: data.university
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(remainingAttempts)
        } 
      }
    );
  } catch (error) {
    console.error("Error in verify-email-token:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
