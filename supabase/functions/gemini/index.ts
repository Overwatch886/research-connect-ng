import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Platform Gemini key. Set with:
//   supabase secrets set GEMINI_API_KEY=<your-key>
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Optional override, e.g. supabase secrets set GEMINI_MODEL=gemini-2.5-flash
const CONFIGURED_MODEL = Deno.env.get("GEMINI_MODEL");

const MODEL_CANDIDATES = CONFIGURED_MODEL
  ? [CONFIGURED_MODEL]
  : ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isQuotaMessage = (message: string): boolean =>
  /quota|rate limit|resource_exhausted|too many requests|exceeded/i.test(message);

const isUnknownModelMessage = (message: string): boolean =>
  /not found|not supported|is not found for api version|does not exist|unknown model/i.test(message);

interface GeminiRequestBody {
  prompt?: string;
  model?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED", message: "Use POST." }, 405);
  }

  if (!GEMINI_API_KEY) {
    return jsonResponse(
      {
        error: "AI_NOT_CONFIGURED",
        message:
          "The platform Gemini key is not configured. Run: supabase secrets set GEMINI_API_KEY=<your-key>",
      },
      503
    );
  }

  let body: GeminiRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "BAD_REQUEST", message: "Invalid JSON body." }, 400);
  }

  const prompt = String(body?.prompt || "").trim();
  if (!prompt) {
    return jsonResponse({ error: "BAD_REQUEST", message: "A non-empty prompt is required." }, 400);
  }

  const requestedModel = String(body?.model || "").trim();
  const models = requestedModel
    ? [requestedModel, ...MODEL_CANDIDATES.filter((m) => m !== requestedModel)]
    : MODEL_CANDIDATES;

  let lastStatus = 502;
  let lastMessage = "Gemini request failed.";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    let upstream: Response;
    try {
      upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });
    } catch (err) {
      lastStatus = 502;
      lastMessage = err instanceof Error ? err.message : "Network error contacting Gemini.";
      continue;
    }

    const data = await upstream.json().catch(() => ({} as Record<string, unknown>));

    if (upstream.ok) {
      const candidates = (data as any)?.candidates;
      const text: string =
        candidates?.[0]?.content?.parts
          ?.map((p: any) => p?.text)
          .filter((t: unknown) => typeof t === "string" && t.length > 0)
          .join("") || "";

      if (text.trim()) {
        return jsonResponse({ text, model });
      }

      lastStatus = 502;
      lastMessage = "Gemini returned an empty response.";
      continue;
    }

    lastStatus = upstream.status;
    lastMessage = (data as any)?.error?.message || `Gemini request failed (${upstream.status}).`;

    if (upstream.status === 429 || isQuotaMessage(lastMessage)) {
      return jsonResponse({ error: "QUOTA_EXCEEDED", message: lastMessage }, 429);
    }

    if (upstream.status === 404 || isUnknownModelMessage(lastMessage)) {
      continue;
    }

    break;
  }

  return jsonResponse(
    {
      error: lastStatus === 429 ? "QUOTA_EXCEEDED" : "UPSTREAM_ERROR",
      message: lastMessage,
    },
    lastStatus
  );
};

serve(handler);
