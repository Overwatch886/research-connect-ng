import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  university: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { university, email }: VerificationRequest = await req.json();

    // Validate .edu.ng email
    if (!email || !email.toLowerCase().endsWith(".edu.ng")) {
      return new Response(
        JSON.stringify({ error: "Please use a valid Nigerian university email (.edu.ng)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate university
    if (!university || university.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Please select a valid university" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification record
    const { error: insertError } = await supabase
      .from("student_verifications")
      .insert({
        user_id: user.id,
        verification_method: "email",
        university: university.trim(),
        email: email.toLowerCase().trim(),
        token: verificationToken,
        token_expires_at: expiresAt.toISOString(),
        status: "pending",
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For now, we'll simulate sending an email
    // In production, integrate with Resend or similar service
    const verificationUrl = `${req.headers.get("origin") || supabaseUrl}/verify-email?token=${verificationToken}`;
    
    console.log(`Verification email would be sent to ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);

    // TODO: Integrate with email service (Resend)
    // For demo purposes, we'll mark it as pending and show the user

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Verification email sent",
        // In development, include the token for testing
        ...(Deno.env.get("ENVIRONMENT") !== "production" && { debug_token: verificationToken })
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-verification-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
