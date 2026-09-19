import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Build verification URL
    const origin = req.headers.get("origin") || "https://research-connect-ng.vercel.app";
    const verificationUrl = `${origin}/verify-email?token=${verificationToken}`;
    
    console.log(`Sending verification email to ${email}`);
    console.log(`Verification URL: ${verificationUrl}`);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Research Connect NG <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Student Email - Research Connect NG",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">Research Connect NG</h1>
            <p style="color: #666; margin-top: 5px;">Student Verification</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #111;">Verify Your Student Email</h2>
            <p>You're almost there! Click the button below to verify your student email and unlock access to paid surveys on Research Connect NG.</p>
            
            <p><strong>University:</strong> ${university}</p>
            <p><strong>Email:</strong> ${email}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify My Email</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
          </div>
          
          <div style="font-size: 12px; color: #999; text-align: center;">
            <p>If you didn't request this verification, you can safely ignore this email.</p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #16a34a;">${verificationUrl}</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Verification email sent! Please check your inbox.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send verification email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
