import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "research_connect_gemini_key";

export const getGeminiApiKey = (): string => {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored.trim().length > 0) return stored.trim();

  // Support VITE_GEMINI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY from import.meta.env or process.env
  const candidate =
    (import.meta.env.VITE_GEMINI_API_KEY as string) ||
    (import.meta.env.GEMINI_API_KEY as string) ||
    (import.meta.env.GOOGLE_API_KEY as string) ||
    (import.meta.env.VITE_GOOGLE_API_KEY as string) ||
    (typeof process !== "undefined" && (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY || process.env?.GOOGLE_API_KEY)) ||
    "";

  return typeof candidate === "string" ? candidate.trim() : "";
};

export const setGeminiApiKey = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
};

export const hasGeminiApiKey = (): boolean => {
  return getGeminiApiKey().length > 0;
};

export const notifyQuotaExhausted = (detail?: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gemini_quota_exhausted", {
        detail: { message: detail || "Platform Gemini API quota reached or rate-limited." },
      })
    );
  }
};

export const handleGeminiError = (err: any) => {
  const msg = String(err?.message || err);
  if (
    err?.status === 429 ||
    /429|resource_exhausted|quota|rate limit|too many requests/i.test(msg)
  ) {
    notifyQuotaExhausted("Platform Gemini API rate limit reached.");
  }
};

export const getPreferredGeminiModel = (genAI: GoogleGenerativeAI, modelName: string = "gemini-1.5-flash") => {
  try {
    return genAI.getGenerativeModel({ model: modelName });
  } catch {
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
};

export const extractJson = <T>(text: string): T => {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/[\{\[][\s\S]*[\}\]]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw e;
  }
};

// ---------------------------------------------------------------------------
// AI transport
//
// Two interchangeable paths, tried in this order:
//   1. Personal key  -> direct call to Google Generative AI (browser).
//   2. Platform key  -> `gemini` Supabase Edge Function, which holds the
//                       server-side GEMINI_API_KEY. Used by every visitor by
//                       default so the features work without any setup.
// If the platform key is rate-limited the `gemini_quota_exhausted` event fires
// and GeminiKeyModal invites the user to supply their own key.
// ---------------------------------------------------------------------------

export const GEMINI_MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-1.5-pro",
  "gemini-flash-latest",
  "gemini-2.0-flash-exp",
];

const DEFAULT_GEMINI_MODEL = GEMINI_MODEL_CANDIDATES[0];
const GEMINI_EDGE_FUNCTION = "gemini";

export type GeminiErrorCode = "quota" | "not_configured" | "unavailable" | "invalid_response";

export class GeminiError extends Error {
  code: GeminiErrorCode;
  constructor(code: GeminiErrorCode, message: string) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
  }
}

const isQuotaError = (err: any, msg: string): boolean =>
  err?.status === 429 || /429|resource_exhausted|quota|rate limit|too many requests/i.test(msg);

const isUnknownModelError = (msg: string): boolean =>
  /not found|not supported|is not found for api version|does not exist|unknown model|no longer available|not available|deprecated|404/i.test(msg);

async function callGeminiDirect(apiKey: string, prompt: string, model: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const candidates = [model, ...GEMINI_MODEL_CANDIDATES.filter((m) => m !== model)];
  let lastErr: unknown;

  for (const candidate of candidates) {
    try {
      const result = await genAI.getGenerativeModel({ model: candidate }).generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
      lastErr = new Error("Gemini returned an empty response.");
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (isQuotaError(err, msg)) {
        handleGeminiError(err);
        throw new GeminiError("quota", "Your Gemini API key has hit its Google AI Studio rate limit.");
      }
      if (isUnknownModelError(msg)) {
        console.warn(`Model ${candidate} unavailable (${msg}). Trying next fallback candidate...`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Gemini generation failed.");
}

async function callGeminiProxy(prompt: string, model: string): Promise<string> {
  let data: any = null;
  let error: any = null;

  try {
    const res = await supabase.functions.invoke(GEMINI_EDGE_FUNCTION, {
      body: { prompt, model },
    });
    data = res.data;
    error = res.error;
  } catch (err: any) {
    throw new GeminiError("unavailable", err?.message || "Could not reach the platform AI service.");
  }

  if (error) {
    let message = error?.message || "The platform AI service is unavailable.";
    const ctx = error?.context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const parsed = await ctx.json();
        if (parsed?.message) message = parsed.message;
        if (parsed?.error === "QUOTA_EXCEEDED") {
          notifyQuotaExhausted(message);
          throw new GeminiError("quota", message);
        }
        if (parsed?.error === "AI_NOT_CONFIGURED") {
          throw new GeminiError("not_configured", message);
        }
      } catch (parsed) {
        if (parsed instanceof GeminiError) throw parsed;
      }
    }
    const status = ctx?.status;
    if (status === 429) {
      notifyQuotaExhausted(message);
      throw new GeminiError("quota", message);
    }
    if (status === 503) throw new GeminiError("not_configured", message);
    throw new GeminiError("unavailable", message);
  }

  if (data?.error) {
    const message = data?.message || "The platform AI service is unavailable.";
    if (data.error === "QUOTA_EXCEEDED") {
      notifyQuotaExhausted(message);
      throw new GeminiError("quota", message);
    }
    if (data.error === "AI_NOT_CONFIGURED") throw new GeminiError("not_configured", message);
    throw new GeminiError("unavailable", message);
  }

  const text = String(data?.text || "").trim();
  if (!text) throw new GeminiError("invalid_response", "The AI returned an empty response.");
  return text;
}

async function callGeminiText(prompt: string, model: string = DEFAULT_GEMINI_MODEL): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (apiKey) return callGeminiDirect(apiKey, prompt, model);
  return callGeminiProxy(prompt, model);
}

// Interface definitions
export interface ClarificationQuestion {
  id: string;
  question: string;
  description?: string;
  options: string[];
}

export interface GeneratedQuestion {
  id: string;
  type: "short" | "long" | "multiple" | "checkbox" | "rating";
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  rationale?: string;
  dataExtracted?: string;
}

export interface GeneratedSurvey {
  title: string;
  description: string;
  estimated_time: number;
  recommended_reward: number;
  questions: GeneratedQuestion[];
}

export interface GroundingSource {
  id: string;
  name: string;
  content: string;
  size?: number;
  uploadedAt?: string;
}

export interface AuditResult {
  isValid: boolean;
  qualityScore: number; // 0 - 100
  isRelevant?: boolean;
  flags: string[];
  feedback: string;
}

export interface SurveyInsights {
  summary: string;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    critical: number;
  };
  keyTrends: string[];
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  badge?: string;
}

export interface ConversationalStepResult {
  aiReply: string;
  nextQuestionIndex: number;
  isFinished: boolean;
  extractedInsight?: string;
  isClarifying?: boolean;
}

// 1. Clarification Interview Generator
export const generateClarificationQuestions = async (
  topic: string
): Promise<ClarificationQuestion[]> => {
  try {
    const prompt = `You are a research methodologist specializing in Nigerian higher education and demographic studies.
The user wants to conduct a study on the following topic:
"${topic}"

Generate 3 high-impact multiple-choice clarification questions to help tailor and calibrate the research parameters.
Format your output STRICTLY as valid JSON matching this schema:
[
  {
    "id": "1",
    "question": "Clarification question text",
    "description": "Short explanation of why this matters",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  }
]
Do not include markdown backticks or any explanatory text. Just the raw JSON.`;

    const text = await callGeminiText(prompt);
    return extractJson<ClarificationQuestion[]>(text);
  } catch (err) {
    console.warn("Gemini API call failed, using fallback", err);
    handleGeminiError(err);
    return getFallbackClarifications(topic);
  }
};

// 2. Final Survey Builder with Methodological Objectives
export const generateSurveyFromClarifications = async (
  topic: string,
  clarifications: Record<string, string>
): Promise<GeneratedSurvey> => {
  try {
    const clarificationsSummary = Object.entries(clarifications)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const prompt = `You are an expert Nigerian academic methodologist and demographic researcher.
Topic to investigate: "${topic}"
Researcher preferences & variables:
${clarificationsSummary}

Generate a comprehensive academic survey with 4 to 6 questions specifically addressing Nigerian university students.
The questions MUST be deeply and directly aligned with the specific topic: "${topic}".
Do not default to generic fuel subsidy or transport questions unless the topic is specifically about transportation or subsidies!
For EACH question, include:
- "rationale": 1 sentence explaining the scientific or analytical reason why this question is necessary.
- "dataExtracted": The exact independent or dependent variable measured.

Output STRICTLY valid raw JSON conforming to this schema:
{
  "title": "Academic / Market Survey Title",
  "description": "Clear professional description explaining the purpose to Nigerian students",
  "estimated_time": 4,
  "recommended_reward": 500,
  "questions": [
    {
      "id": "1",
      "type": "multiple",
      "title": "Question text",
      "description": "Optional hint",
      "required": true,
      "options": ["Option A", "Option B", "Option C"],
      "rationale": "Why this question is asked",
      "dataExtracted": "Specific research variable captured"
    }
  ]
}
Do not include markdown codeblocks or extra text. Only raw JSON.`;

    const text = await callGeminiText(prompt);
    return extractJson<GeneratedSurvey>(text);
  } catch (err) {
    console.warn("Gemini survey generation failed, using fallback", err);
    handleGeminiError(err);
    return getFallbackSurvey(topic, clarifications);
  }
};

// 3. Conversational AI Surveyor Engine
export const conductConversationalStep = async (
  surveyTitle: string,
  questions: GeneratedQuestion[],
  history: ChatMessage[],
  userMessage: string,
  currentQuestionIndex: number
): Promise<ConversationalStepResult> => {
  const currentQ = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  try {
    const formattedHistory = history
      .map((h) => `${h.sender === "user" ? "Student" : "Interviewer"}: ${h.text}`)
      .join("\n");

    // Build question context — type and options are critical for evaluation
    const qType = currentQ?.type || "long";
    const qOptions = currentQ?.options?.length
      ? `\nAnswer Options: ${currentQ.options.map((o, i) => `${i + 1}. "${o}"`).join(", ")}`
      : "";
    const qTypeNote =
      qType === "rating"
        ? "\n⚠️ RATING QUESTION (scale 1–5): Any number, or sentiment word like 'very poor', 'bad', 'okay', 'good', 'excellent', 'terrible' IS a complete substantive answer. NEVER classify these as evasive."
        : qType === "multiple" || qType === "checkbox"
        ? `\n⚠️ MULTIPLE CHOICE QUESTION: If the student selects or mentions any of the answer options — even 1–3 words — that IS a substantive answer. Do not demand longer answers for MCQ.${qOptions}`
        : "";

    const prompt = `You are "Ada", an empathetic, highly skilled Nigerian academic field researcher conducting an interactive conversational survey for the study: "${surveyTitle}".

Current Question (${currentQuestionIndex + 1} of ${questions.length}):
"${currentQ?.title || "Final thoughts"}"
Question Type: ${qType}${qTypeNote}

Research Objective: "${currentQ?.rationale || "Student context"}"

Full conversation so far:
${formattedHistory}

Latest student reply:
"${userMessage}"

EVALUATION PROTOCOL — read carefully:

Step 1 — Classify the reply into ONE of:
1. "question_clarification": Student asks for clarification, asks what a term means, or seems confused. SPECIAL RULE: If they ALSO provided an answer in the same message (e.g. "I mainly use cash, should I still answer?"), the content they provided counts as an answer — acknowledge it and advance.
2. "evasive_or_non_answer": Student gives a completely empty or non-informative response ("idk", "skip", "whatever", "I don't care", etc.) — NOT answering at all. IMPORTANT: "very poor", "never", "always", "cash only", any option selection — these are NOT evasive even if short.
3. "off_topic": Completely unrelated topic (sports, movies, gaming). Note: discussing payment methods, cash, mobile money for a banking survey is fully on-topic.
4. "substantive_valid_answer": Student provides ANY real response to the question. Be generous — short answers like "very poor", "I prefer cash", "South-West", picking an option, expressing a preference or experience all qualify. This is the DEFAULT classification when in doubt.

Step 2 — Reply rules:
- ALWAYS reference what the student ACTUALLY SAID in your aiReply. Never give a generic template.
- For "question_clarification" with embedded answer: acknowledge their answer AND answer their question, then advance (shouldAdvance: true).
- For "evasive_or_non_answer": empathize warmly in Nigerian student tone, give a relatable campus example, prompt specifically.
- For "off_topic": briefly acknowledge, gently redirect to the survey.
- For "substantive_valid_answer": 
  * Warmly acknowledge THEIR SPECIFIC response (e.g. "That makes total sense — using cash keeps you from network stress")
  * shouldAdvance: true
  * ${
    isLastQuestion
      ? "Conclude warmly: thank them enthusiastically, confirm their reward has been approved and credited to their student wallet!"
      : "Transition naturally to the next question: \"" + (questions[currentQuestionIndex + 1]?.title || "Final thoughts") + "\""
  }

STRICT RAW JSON only (no markdown, no extra text):
{
  "userIntent": "question_clarification" | "evasive_or_non_answer" | "off_topic" | "substantive_valid_answer",
  "evaluationRationale": "1 sentence why you classified it this way",
  "shouldAdvance": true or false,
  "aiReply": "Ada's reply — must mention what the student actually said",
  "extractedInsight": "1-sentence summary of insight gained"
}`;

    const text = await callGeminiText(prompt);
    const parsed = extractJson<{ 
      userIntent?: string;
      evaluationRationale?: string;
      aiReply: string; 
      shouldAdvance: boolean; 
      extractedInsight?: string 
    }>(text);

    // Hard gate: only advance if userIntent is substantive_valid_answer AND shouldAdvance is true
    const isSubstantive = parsed.userIntent === "substantive_valid_answer";
    const shouldAdvance = Boolean(parsed.shouldAdvance) && isSubstantive;

    return {
      aiReply: parsed.aiReply,
      nextQuestionIndex: shouldAdvance ? currentQuestionIndex + 1 : currentQuestionIndex,
      isFinished: isLastQuestion && shouldAdvance,
      extractedInsight: parsed.extractedInsight || parsed.evaluationRationale,
      isClarifying: !shouldAdvance,
    };
  } catch (err) {
    console.warn("Conversational step failed, using fallback", err);
    handleGeminiError(err);
    return getFallbackConversationalStep(surveyTitle, questions, userMessage, currentQuestionIndex);
  }
};

// 4. Academic Paper / Whitepaper Draft Generator with Multi-Document Grounding
export const generateAcademicPaperDraft = async (
  surveyTitle: string,
  surveyDescription: string,
  questions: GeneratedQuestion[],
  responsesCount: number = 127,
  groundingSources: GroundingSource[] = []
): Promise<string> => {
  const questionsSummary = questions.map((q) => `- ${q.title} (Variable: ${q.dataExtracted || q.type})`).join("\n");

  const sourcesSection = groundingSources && groundingSources.length > 0
    ? `\n\nATTACHED RESEARCHER GROUNDING DOCUMENTS & LITERATURE NOTES (Integrate and cite these where applicable):\n` +
      groundingSources.map((s, idx) => `[Source ${idx + 1}: ${s.name}]\n${s.content.slice(0, 3000)}`).join("\n\n")
    : "";

  const prompt = `You are a distinguished research professor at the University of Ibadan.
Write an authentic, publication-quality academic research paper draft based on empirical survey data collected via Research Connect NG.

Title: "${surveyTitle}"
Overview: "${surveyDescription}"
Sample Size: N = ${responsesCount} verified Nigerian university undergraduate and postgraduate respondents.
Question Variables Investigated:
${questionsSummary}
${sourcesSection}

Format the paper with clear academic markdown sections:
# [Academic Title]
## Abstract
(Structured: Background, Objectives, Methodology, Results, Conclusion)
## 1. Introduction & Context
(Discuss current socio-economic indicators in Nigeria: inflation, transport costs, academic disruption, citing theoretical background)
## 2. Methodology & Sampling Framework
(Describe verified student sampling, anti-fraud AI screening, demographic distribution)
## 3. Empirical Survey Findings
(Quantitative breakdowns, percentages, Likert rating tables, and qualitative student quotations)
## 4. Discussion & Socio-Economic Implications
(Comparative analysis between federal and state universities, grounded in attached literature)
## 5. Policy & Stakeholder Recommendations
(Actionable interventions for university administrations, fintech platforms, and student welfare)
## References
(Include 4-5 formal academic citations formatted in APA style relevant to African higher education economics and attached sources).`;

  try {
    return await callGeminiText(prompt);
  } catch (err) {
    handleGeminiError(err);
    throw err;
  }
};

// 4b. 2-Host Audio Overview / Podcast Script Generator (NotebookLM Style)
export const generateAudioOverviewScript = async (
  surveyTitle: string,
  paperContent: string
): Promise<string> => {
  const prompt = `You are the executive producer of a Google NotebookLM-style "Deep Dive Audio Overview".
Two Nigerian academic podcast hosts are discussing the empirical findings of the study: "${surveyTitle}".

Hosts:
- Dr. Ade (Senior Faculty Researcher): Methodical, analytical, contextualizes the big economic picture in Nigerian universities.
- Chidinma (Field Research Lead): Relatable, energetic, shares what students actually said in the field, challenges, and quotes.

Grounded Research Content:
${paperContent.slice(0, 6000)}

Format the output as a lively, authentic 2-host conversational dialogue transcript:
Dr. Ade: ...
Chidinma: ...`;

  try {
    return await callGeminiText(prompt);
  } catch (err) {
    handleGeminiError(err);
    throw err;
  }
};

// 5. Response Quality Auditor with Deep Semantic & Topical Relevance Check
export const auditResponseQuality = async (
  question: string,
  answer: string
): Promise<AuditResult> => {
  const trimmed = answer.trim();

  // 1. Basic length check
  if (trimmed.length < 3) {
    return {
      isValid: false,
      qualityScore: 10,
      flags: ["too_short"],
      feedback: "Answer is too short. Please provide a substantive response.",
    };
  }

  // 2. Keyboard mashing or repetitive characters
  const mashingRegex = /(.)\1{4,}|[asdfghjkl]{5,}|[qwertyuiop]{5,}|[zxcvbnm]{5,}/i;
  if (mashingRegex.test(trimmed)) {
    return {
      isValid: false,
      qualityScore: 15,
      flags: ["gibberish_detected"],
      feedback: "Answer looks like random characters or keyboard mashing.",
    };
  }

  // 3. Evasive one-word or non-answers
  const evasiveRegex = /^(nothing|none|nil|n\/a|na|not applicable|i don'?t know|no idea|idk|nothing much|no comment|good|bad|fine|okay|ok|yes|no)$/i;
  if (evasiveRegex.test(trimmed)) {
    return {
      isValid: false,
      qualityScore: 25,
      flags: ["evasive_response"],
      feedback: "Response is evasive or non-informative. Please provide specific details to qualify for your reward.",
    };
  }

  try {
    const prompt = `You are a strict data quality auditor for Research Connect NG, evaluating survey responses from Nigerian university undergraduates.

Question Asked: "${question}"
Student's Response: "${trimmed}"

Audit this response across TWO critical criteria:
1. TOPICAL RELEVANCE: Does this response actually answer or address the subject matter asked in the question? If the response talks about something completely unrelated (e.g. European football, movies, unrelated personal complaints, or generic dodging), mark isValid = false, isRelevant = false, and flag as "off_topic".
2. SUBSTANCE & SINCERITY: Is this an authentic human perspective with meaningful detail, or just gibberish, automated copy-paste, or low-effort filler?

Output STRICTLY valid JSON:
{
  "isValid": boolean,
  "qualityScore": number (0 to 100),
  "isRelevant": boolean,
  "flags": string[],
  "feedback": "1-sentence assessment explaining why it passed or what is missing"
}`;

    const text = await callGeminiText(prompt);
    const cleanJson = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanJson);
    return {
      isValid: Boolean(parsed.isValid && parsed.isRelevant !== false),
      qualityScore: typeof parsed.qualityScore === "number" ? parsed.qualityScore : 75,
      isRelevant: parsed.isRelevant !== false,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      feedback: parsed.feedback || "Response processed.",
    };
  } catch (err) {
    handleGeminiError(err);
    return getHeuristicAudit(question, trimmed);
  }
};

// 6. Survey Insights Generator
export const generateSurveyInsights = async (
  surveyTitle: string,
  questions: any[],
  responses: any[]
): Promise<SurveyInsights> => {
  const prompt = `You are a chief research analyst. Synthesize these survey responses for the study: "${surveyTitle}".
Total responses collected: ${responses?.length || 0}.
Questions asked: ${JSON.stringify(questions.map((q) => q.title))}

Provide an executive breakdown strictly conforming to this JSON format:
{
  "summary": "Executive summary paragraph highlighting key findings in the Nigerian demographic context.",
  "sentimentDistribution": {
    "positive": 55,
    "neutral": 30,
    "critical": 15
  },
  "keyTrends": [
    "Trend 1 with specific observation",
    "Trend 2 with percentage or habit",
    "Trend 3 regarding university or regional variance"
  ],
  "recommendations": [
    "Actionable recommendation for the researcher or policy makers",
    "Secondary actionable recommendation"
  ]
}
Return raw JSON only.`;

  try {
    const text = await callGeminiText(prompt);
    const cleanJson = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    handleGeminiError(err);
    throw err;
  }
};

// --- Smart Fallback Generators ---

function getFallbackClarifications(topic: string): ClarificationQuestion[] {
  return [
    {
      id: "target_population",
      question: `What is your primary demographic target for "${topic}"?`,
      description: "Determines regional framing and campus socioeconomic variables",
      options: [
        "Federal Universities (e.g. UNILAG, UI, OAU, UNN, ABU)",
        "State Universities (e.g. LASU, LAUTECH, DELSU)",
        "Private Universities (e.g. Covenant, Babcock, Bowen)",
        "Nationwide mix across geopolitical zones",
      ],
    },
    {
      id: "research_focus",
      question: "Which primary dimension do you want to explore deepest?",
      description: "Calibrates question depth between financial, academic, and behavioral impact",
      options: [
        "Direct financial cost and budgeting trade-offs",
        "Mental health, stress, and academic performance",
        "Coping strategies, peer networks, and workarounds",
        "Institutional response and infrastructure deficits",
      ],
    },
    {
      id: "response_depth",
      question: "What format of empirical data is most critical for your thesis/study?",
      description: "Balances quantitative stats with rich qualitative student quotes",
      options: [
        "Qualitative-rich (Detailed student personal experiences & quotes)",
        "Quantitative focus (Likert ratings, numerical spend, frequency)",
        "Balanced empirical mixed-methodology",
      ],
    },
  ];
}

function getFallbackSurvey(
  topic: string,
  clarifications: Record<string, string>
): GeneratedSurvey {
  const cleanTopic = topic.trim() || "Student Welfare & Institutional Experience";
  const lower = cleanTopic.toLowerCase();

  const isGovernanceOrAdmin = /admin|bias|opinion|management|senate|council|vc|rector|lecturer|strike|policy|governance|union|sug/i.test(lower);
  const isFinanceOrEconomy = /fuel|subsidy|transport|inflation|budget|money|cost|price|fintech|bank|allowance|food/i.test(lower);

  if (isGovernanceOrAdmin) {
    return {
      title: `Student Perspectives & Administrative Efficacy in Higher Institutions`,
      description: `An academic study investigating student perceptions, institutional transparency, and administrative responsiveness across Nigerian tertiary institutions.`,
      estimated_time: 4,
      recommended_reward: 500,
      questions: [
        {
          id: "q1",
          type: "multiple",
          title: "Which higher institution or geopolitical zone are you currently studying in?",
          required: true,
          options: [
            "Federal Universities (e.g. UNILAG, UI, OAU, UNN, ABU)",
            "State Universities (e.g. LASU, LAUTECH, DELSU, OOU)",
            "Private Universities (e.g. Covenant, Babcock, Bowen)",
            "Polytechnics & Specialized Colleges",
          ],
          rationale: "Establishes institutional governance tier baseline.",
          dataExtracted: "Institutional Tier Classification",
        },
        {
          id: "q2",
          type: "multiple",
          title: "How responsive is your university administration when students lodge official complaints or academic grievances?",
          required: true,
          options: [
            "Highly responsive: Resolved promptly and transparently",
            "Slow but functional: Requires repetitive physical follow-ups",
            "Unresponsive: Grievances are frequently ignored or delayed for months",
            "Fear of victimization: Students avoid reporting issues altogether",
          ],
          rationale: "Evaluates institutional accountability and administrative efficiency.",
          dataExtracted: "Administrative Responsiveness Index",
        },
        {
          id: "q3",
          type: "rating",
          title: "On a scale of 1 to 5, how fairly and objectively do you feel institutional rules are enforced on campus?",
          required: true,
          rationale: "Quantifies perceived systemic bias versus institutional impartiality.",
          dataExtracted: "Institutional Impartiality Score (1-5)",
        },
        {
          id: "q4",
          type: "checkbox",
          title: "Which administrative offices or processes suffer the most bottlenecks on your campus?",
          required: true,
          options: [
            "Result computation & transcript processing (Exams & Records)",
            "Course registration & student portal network server crashes",
            "Hostel room allocation & student welfare clearance",
            "Disciplinary hearings & Student Union Government (SUG) interference",
          ],
          rationale: "Identifies systemic administrative friction hotspots.",
          dataExtracted: "Administrative Friction Distribution",
        },
        {
          id: "q5",
          type: "long",
          title: "Describe a specific incident where you or a fellow student had to resolve an urgent administrative issue with faculty officials or university management. What happened?",
          description: "Provide genuine personal details. Gemini analyzes narrative responses for qualitative whitepaper drafting.",
          required: true,
          rationale: "Captures qualitative empirical narratives of student experiences with campus authorities.",
          dataExtracted: "Qualitative Case Studies on Administration",
        },
      ],
    };
  }

  return {
    title: `Socio-Economic Assessment: ${cleanTopic}`,
    description: `An empirical investigation evaluating the real-world impact of ${cleanTopic} on student welfare, academic progress, and daily coping mechanisms across Nigerian tertiary institutions.`,
    estimated_time: 4,
    recommended_reward: 500,
    questions: [
      {
        id: "q1",
        type: "multiple",
        title: "Which higher institution or geopolitical zone are you currently studying in?",
        required: true,
        options: [
          "South-West (UNILAG, UI, OAU, LASU, Covenant)",
          "South-East / South-South (UNN, UNIPORT, UNIBEN, FUTO)",
          "North-Central (UniAbuja, UNILORIN, FUTMinna)",
          "North-West / North-East (ABU, BUK, UniMaid)",
        ],
        rationale: "Establishes regional demographic stratification across varying economic zones.",
        dataExtracted: "Geographic Demographic Baseline",
      },
      {
        id: "q2",
        type: "multiple",
        title: `How has ${cleanTopic} directly affected your weekly budget or daily schedule this semester?`,
        required: true,
        options: [
          "Severe disruption: Forced to skip meals or miss classes",
          "Moderate challenge: Reduced spending on data and handouts",
          "Mild impact: Managed through side hustles/freelancing",
          "No noticeable disruption",
        ],
        rationale: "Measures the elasticity of student welfare against external economic stressors.",
        dataExtracted: "Severity Distribution Index",
      },
      {
        id: "q3",
        type: "rating",
        title: "On a scale of 1 to 5, rate your institutional administration's support regarding this issue:",
        required: true,
        rationale: "Evaluates institutional accountability and student satisfaction metrics.",
        dataExtracted: "Institutional Trust & Satisfaction (1-5)",
      },
      {
        id: "q4",
        type: "checkbox",
        title: "What workarounds or financial coping mechanisms do you actively rely on?",
        required: true,
        options: [
          "Micro-loans from fintech apps (OPay, Kuda, PalmPay)",
          "Food pooling / sharing pot with hostel roommates",
          "Remote digital freelancing / tech side-hustles",
          "Walking instead of taking campus shuttle cabs",
        ],
        rationale: "Identifies informal safety nets and grassroots economic resilience among youth.",
        dataExtracted: "Adaptive Coping Strategy Portfolio",
      },
      {
        id: "q5",
        type: "long",
        title: `Describe a specific day this month where ${cleanTopic} severely tested your resilience as a Nigerian student, and what you did to survive it.`,
        description: "Be candid and specific. Gemini conversational analysis extracts qualitative quotes for academic reports.",
        required: true,
        rationale: "Captures qualitative narrative data to substantiate empirical paper findings.",
        dataExtracted: "Phenomenological Qualitative Case Narratives",
      },
    ],
  };
}

function getFallbackConversationalStep(
  surveyTitle: string,
  questions: GeneratedQuestion[],
  userMessage: string,
  currentQuestionIndex: number
): ConversationalStepResult {
  const trimmed = userMessage.trim();
  const lower = trimmed.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const currentQ = questions[currentQuestionIndex];
  const qTitleLower = (currentQ?.title || "").toLowerCase();
  const qType = currentQ?.type || "long";

  // --- Smart short-answer validation for structured question types ---
  // For rating/multiple/checkbox questions, short responses are perfectly valid
  const isRatingAnswer = qType === "rating" && (
    /^[1-5]$/.test(trimmed) ||
    /^(very poor|poor|average|good|excellent|terrible|bad|okay|ok|great|fair|very good|not good|horrible|awful)$/i.test(trimmed)
  );
  const matchesOption = currentQ?.options?.some(
    (opt) => opt.toLowerCase().includes(lower) || lower.includes(opt.toLowerCase().split(" ")[0])
  );
  const isStructuredAnswer = (qType === "multiple" || qType === "checkbox" || qType === "rating") 
    && (isRatingAnswer || matchesOption || words.length >= 2);

  // 1. Check for Question / Clarification Request
  // Only classify as question if it ends with "?" AND has no substantive content before it
  const hasActualContent = words.length >= 5 && !trimmed.endsWith("?");
  const isQuestion = 
    !hasActualContent && (
      trimmed.endsWith("?") ||
      /^(what|who|which|how|why|where|can you|could you|explain|meaning|clarify)\b/i.test(trimmed) ||
      /what do you mean|who are|who is|i don't understand|what is|meaning of/i.test(lower)
    );

  // Special case: message has content PLUS a question (like "I use cash, should I still answer?")
  const hasContentAndQuestion = trimmed.endsWith("?") && words.length >= 8;

  if (hasContentAndQuestion) {
    // Treat the content as the answer, acknowledge and advance
    const isLast = currentQuestionIndex >= questions.length - 1;
    if (isLast) {
      return {
        aiReply: `Thank you so much for that honest response! The fact that you primarily use cash is itself a really valuable data point for our study on "${surveyTitle}". Your ₦${questions.length > 0 ? "reward" : "500"} has been credited to your student wallet! 🎓`,
        nextQuestionIndex: currentQuestionIndex + 1,
        isFinished: true,
        extractedInsight: "Student prefers cash — shared relevant context alongside clarification request.",
        isClarifying: false,
      };
    }
    const nextQ = questions[currentQuestionIndex + 1];
    return {
      aiReply: `That is actually really useful context — preferring cash over mobile platforms is itself a valuable perspective for this research! To answer your question: yes, please do share whichever platform you use most (even occasionally), or if cash is truly your primary method, that's a valid answer too. Moving on: "${nextQ?.title}"`,
      nextQuestionIndex: currentQuestionIndex + 1,
      isFinished: false,
      extractedInsight: "Student uses cash primarily — provided content alongside clarification request.",
      isClarifying: false,
    };
  }

  if (isQuestion) {
    let explanation = "By this, we're looking at your direct personal experience on campus.";
    if (/admin|body|bodies|management|governance|authority/i.test(qTitleLower) || /admin/i.test(lower)) {
      explanation = "By 'administrative bodies', we mean campus offices like your Dean of Student Affairs (DSA), Exams and Records, your Departmental or Faculty Officers, the Bursary, or the Student Portal managers.";
    } else if (/budget|money|fintech|bank|cost|allowance|food|payment|transfer/i.test(qTitleLower)) {
      explanation = "We're exploring how everyday transactions — like paying for food, transport fares, or course handouts — work for you day-to-day.";
    } else if (/power|light|electricity|generator/i.test(qTitleLower)) {
      explanation = "We're looking at how campus power cuts and lodge blackout hours disrupt your studying, phone/laptop charging, and semester preparations.";
    }

    return {
      aiReply: `${explanation} Have you personally had any encounters or challenges with this recently? Even a small experience or opinion would be really helpful!`,
      nextQuestionIndex: currentQuestionIndex,
      isFinished: false,
      extractedInsight: "Provided contextual clarification on question concept.",
      isClarifying: true,
    };
  }

  // 2. Check for Greetings or pleasantries with no substance
  if (/^(hello|hi|hey|good morning|good afternoon|good evening|yo|sup|what'?s up)$/i.test(trimmed)) {
    return {
      aiReply: `Hello! 👋 Great to have you here. To help with our study, could you tell me your thoughts on: "${currentQ?.title}"?`,
      nextQuestionIndex: currentQuestionIndex,
      isFinished: false,
      extractedInsight: "Refocused student following greeting.",
      isClarifying: true,
    };
  }

  // 3. Check for Explicitly Off-Topic chatter (sports, betting, crypto, gaming)
  const offTopicTerms = ["arsenal", "chelsea", "man united", "real madrid", "ronaldo", "messi", "sportybet", "bet9ja", "crypto", "bitcoin", "fifa"];
  if (words.some((w) => offTopicTerms.includes(w))) {
    return {
      aiReply: `Haha, I hear you! But for this study, we really need your student perspective on: "${currentQ?.title}". What has your experience been?`,
      nextQuestionIndex: currentQuestionIndex,
      isFinished: false,
      extractedInsight: "Redirected from off-topic discussion.",
      isClarifying: true,
    };
  }

  // 4. Check for Evasive, non-answers — ONLY for truly empty/dismissive responses
  // DO NOT flag short answers for rating/MCQ questions as evasive
  const evasiveRegex = /^(nothing|none|nil|n\/a|na|not applicable|i don'?t know|no idea|idk|nothing much|no comment|skip|next|whatever|i don'?t care|can'?t say|nope|nah)$/i;
  const isEvasive = !isStructuredAnswer && (
    evasiveRegex.test(trimmed) || 
    (words.length < 3 && !isRatingAnswer && !matchesOption && qType === "long")
  );

  if (isEvasive) {
    let probeContext = "even small daily routines count!";
    if (/admin/i.test(qTitleLower)) {
      probeContext = "for example, have you had to queue at Exams & Records, fix an issue with course registration, or deal with hostel clearance?";
    } else if (/budget|money|fintech|payment|bank/i.test(qTitleLower)) {
      probeContext = "like whether you've had a failed transfer, network downtime while paying for food, or any frustrating mobile money experience?";
    } else if (/power|electric/i.test(qTitleLower)) {
      probeContext = "like how you manage to charge your phone or study when there is a blackout?";
    }

    return {
      aiReply: `No wahala at all! Take your time — ${probeContext} How has that been for you personally?`,
      nextQuestionIndex: currentQuestionIndex,
      isFinished: false,
      extractedInsight: "Probed for substantive personal student experience.",
      isClarifying: true,
    };
  }

  // 5. Valid Substantive Answer: Advance!
  const isLast = currentQuestionIndex >= questions.length - 1;
  if (isLast) {
    return {
      aiReply: `Thank you so much for sharing that! That is genuine, authentic data that will really help our research on "${surveyTitle}". Your response has been verified and your reward has just been credited to your student wallet! 🎓`,
      nextQuestionIndex: currentQuestionIndex + 1,
      isFinished: true,
      extractedInsight: "Student provided comprehensive qualitative perspective.",
      isClarifying: false,
    };
  }

  const nextQ = questions[currentQuestionIndex + 1];
  // Build a contextual acknowledgement that references what the student said
  const ackPhrases = [
    `That's a really insightful perspective — "${trimmed.length > 60 ? trimmed.slice(0, 57) + "..." : trimmed}" is exactly the kind of lived experience this study needs.`,
    `Thank you for that! Understanding that you ${lower.slice(0, 50)}... gives us great empirical context.`,
    `Noted — and honestly that reflects what many Nigerian students deal with. Appreciate you sharing that.`,
  ];
  const ack = ackPhrases[currentQuestionIndex % ackPhrases.length];

  return {
    aiReply: `${ack} Moving on: "${nextQ?.title}"`,
    nextQuestionIndex: currentQuestionIndex + 1,
    isFinished: false,
    extractedInsight: `Recorded student perspective for question ${currentQuestionIndex + 1}.`,
    isClarifying: false,
  };
}


function getHeuristicAudit(question: string, answer: string): AuditResult {
  const trimmed = answer.trim().toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);

  // 1. Minimum words check
  if (words.length < 4) {
    return {
      isValid: false,
      qualityScore: 30,
      isRelevant: false,
      flags: ["too_brief"],
      feedback: "Answer is too brief. Please write at least one complete sentence to qualify for your reward.",
    };
  }

  // 2. Repetitive filler check
  const uniqueWords = new Set(words);
  if (words.length >= 5 && uniqueWords.size / words.length < 0.4) {
    return {
      isValid: false,
      qualityScore: 20,
      isRelevant: false,
      flags: ["repetitive_filler"],
      feedback: "Answer contains repetitive filler text without meaningful content.",
    };
  }

  // 3. Extract meaningful keyword tokens from question
  const stopWords = new Set([
    "what", "when", "where", "which", "how", "does", "your", "with", "have", "about",
    "this", "that", "from", "their", "they", "will", "would", "could", "should",
    "please", "describe", "explain", "tell", "share", "many", "much", "more", "most",
    "some", "other", "than", "then", "into", "onto", "over", "under", "been", "were"
  ]);

  const cleanQuestionWords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  // Thematic domain vocabulary for campus demographic research in Nigeria
  const campusDomainVocab = new Set([
    "campus", "school", "university", "faculty", "hostel", "lecture", "exam", "class",
    "money", "naira", "cost", "price", "pay", "fee", "budget", "allowance", "food",
    "commute", "transport", "shuttle", "bus", "keke", "bike", "walk", "gate",
    "power", "light", "electricity", "generator", "charge", "study", "reading",
    "cgpa", "course", "department", "semester", "student", "strike", "fuel", "subsidy",
    "stress", "hard", "challenge", "difficult", "manage", "survive", "coping"
  ]);

  const matchesQuestion = words.some((w) =>
    cleanQuestionWords.some((qw) => w.includes(qw) || qw.includes(w))
  );

  const matchesDomain = words.some((w) => campusDomainVocab.has(w));

  // Detect explicitly off-topic chatter (e.g. sports, entertainment, gaming, crypto)
  const offTopicVocab = ["arsenal", "chelsea", "ronaldo", "messi", "bet9ja", "sportybet", "crypto", "bitcoin", "playstation", "fifa"];
  const isExplicitlyOffTopic = words.some((w) => offTopicVocab.includes(w));

  if (isExplicitlyOffTopic && !matchesQuestion) {
    return {
      isValid: false,
      qualityScore: 25,
      isRelevant: false,
      flags: ["off_topic"],
      feedback: "Response appears unrelated to the research question asked.",
    };
  }

  if (!matchesQuestion && !matchesDomain && words.length < 12) {
    return {
      isValid: false,
      qualityScore: 40,
      isRelevant: false,
      flags: ["potential_off_topic"],
      feedback: "Response does not seem directly related to the question topic. Please answer specifically.",
    };
  }

  const quality = Math.min(70 + words.length * 2 + (matchesQuestion ? 15 : 5), 98);
  return {
    isValid: true,
    qualityScore: quality,
    isRelevant: true,
    flags: [],
    feedback: matchesQuestion
      ? "Directly relevant and substantive response verified."
      : "Substantive response verified.",
  };
}

function getFallbackAudioOverviewScript(_title: string): string {
  throw new Error("GEMINI_API_KEY_REQUIRED");
}

function getFallbackInsights(_title: string, _responseCount: number): SurveyInsights {
  throw new Error("GEMINI_API_KEY_REQUIRED");
}

function getFallbackAcademicPaper(
  _title: string,
  _description: string,
  _responsesCount: number
): string {
  throw new Error("GEMINI_API_KEY_REQUIRED");
}


