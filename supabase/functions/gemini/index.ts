import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Platform Gemini key. Set with:
//   supabase secrets set GEMINI_API_KEY=<your-key>
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Optional override, e.g. supabase secrets set GEMINI_MODEL=gemini-2.5-flash
const CONFIGURED_MODEL = Deno.env.get("GEMINI_MODEL");

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-flash-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp",
];

const MODEL_CANDIDATES = CONFIGURED_MODEL ? [CONFIGURED_MODEL] : FALLBACK_MODELS;

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
  /not found|not supported|is not found for api version|does not exist|unknown model|no longer available|not available|deprecated|404/i.test(message);

interface GeminiRequestBody {
  prompt?: string;
  model?: string;
}

let cachedDiscoveredModels: string[] | null = null;
let lastModelFetchTimestamp = 0;
let roundRobinOffset = 0;

async function getCandidateModels(apiKey: string): Promise<string[]> {
  if (CONFIGURED_MODEL) return [CONFIGURED_MODEL];

  const now = Date.now();
  if (cachedDiscoveredModels && now - lastModelFetchTimestamp < 30 * 60 * 1000) {
    return cachedDiscoveredModels;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      const rawList: any[] = data?.models || [];
      const discovered = rawList
        .filter((m) =>
          Array.isArray(m?.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent") &&
          !/embedding|aqa|tts|imagen|veo|learnlm|image|audio/i.test(m.name || "")
        )
        .map((m) => String(m.name || "").replace(/^models\//, ""))
        .filter((name) => name.startsWith("gemini") || name.startsWith("gemma"));

      if (discovered.length > 0) {
        // Prioritize lightweight, high-RPM flash models first
        discovered.sort((a, b) => {
          const score = (name: string) => {
            if (/2\.5-flash-lite/i.test(name)) return 1;
            if (/2\.5-flash/i.test(name)) return 2;
            if (/2\.0-flash-lite/i.test(name)) return 3;
            if (/2\.0-flash/i.test(name)) return 4;
            if (/1\.5-flash-8b/i.test(name)) return 5;
            if (/1\.5-flash/i.test(name)) return 6;
            if (/flash/i.test(name)) return 7;
            return 10;
          };
          return score(a) - score(b);
        });

        // Merge discovered with fallback candidates without duplicates
        const combined = Array.from(new Set([...discovered, ...FALLBACK_MODELS]));
        cachedDiscoveredModels = combined;
        lastModelFetchTimestamp = now;
        return combined;
      }
    }
  } catch (err) {
    console.warn("Failed to ping Gemini models endpoint:", err);
  }

  return FALLBACK_MODELS;
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

  const availableModels = await getCandidateModels(GEMINI_API_KEY);

  // Round-robin rotation: shift the models array by roundRobinOffset
  const requestedModel = String(body?.model || "").trim();
  let models: string[];

  if (requestedModel) {
    models = [requestedModel, ...availableModels.filter((m) => m !== requestedModel)];
  } else {
    const shift = roundRobinOffset % availableModels.length;
    models = [...availableModels.slice(shift), ...availableModels.slice(0, shift)];
  }

  let lastStatus = 502;
  let lastMessage = "Gemini request failed.";
  let triedModelsCount = 0;

  for (const model of models) {
    triedModelsCount++;
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
        // Advance round robin offset for next request to distribute traffic
        roundRobinOffset = (roundRobinOffset + 1) % availableModels.length;
        return jsonResponse({ text, model });
      }

      lastStatus = 502;
      lastMessage = "Gemini returned an empty response.";
      continue;
    }

    lastStatus = upstream.status;
    lastMessage = (data as any)?.error?.message || `Gemini request failed (${upstream.status}).`;

    // When rate-limited (429) or quota exceeded, ROTATE to next model in the pool!
    if (upstream.status === 429 || isQuotaMessage(lastMessage)) {
      console.warn(`[Gemini Rotator] Model ${model} rate-limited or quota reached. Rotating to next model...`);
      roundRobinOffset = (roundRobinOffset + 1) % availableModels.length;
      continue;
    }

    if (upstream.status === 404 || isUnknownModelMessage(lastMessage)) {
      continue;
    }

    // For other unexpected errors, try next model as well
    continue;
  }

  return jsonResponse(
    {
      error: lastStatus === 429 ? "QUOTA_EXCEEDED" : "UPSTREAM_ERROR",
      message: `${lastMessage} (tried ${triedModelsCount} model candidates without success)`,
    },
    lastStatus
  );
};

serve(handler);
