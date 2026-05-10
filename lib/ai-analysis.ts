import OpenAI from "openai";
import { z } from "zod";

const openrouter = new OpenAI({
  baseURL: "https://routerai.ru/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
    "X-Title": "PotokMneniy Analytics",
  },
});

export type ThemeItem = {
  theme: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
  examples: string[];
  actionableInsight: string;
};

export type AnalysisDiagnostics = {
  recommendations: string[];
  hypotheses: string[];
  riskFactors: string[];
  metricsToWatch: string[];
  actionPlan?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  segmentsAnalysis?: {
    segment: string;
    insight: string;
    action: string;
  }[];
};

export type AnalysisResult = {
  themes: ThemeItem[];
  sentiment: { positive: number; neutral: number; negative: number };
  wordCloud: { word: string; weight: number }[];
  summary: string;
  keyInsights: string[];
  diagnostics?: AnalysisDiagnostics;
  businessImplications?: string[];
  confidenceScore?: number;
};

const diagnosticsSchema = z.object({
  recommendations: z.array(z.string()).min(3).max(8),
  hypotheses: z.array(z.string()).min(3).max(6),
  riskFactors: z.array(z.string()).min(3).max(6),
  metricsToWatch: z.array(z.string()).min(3).max(6),
  actionPlan: z.object({
    immediate: z.array(z.string()).min(2).max(5),
    shortTerm: z.array(z.string()).min(2).max(5),
    longTerm: z.array(z.string()).min(2).max(4),
  }).optional(),
  segmentsAnalysis: z.array(
    z.object({
      segment: z.string(),
      insight: z.string(),
      action: z.string(),
    })
  ).min(0).max(6).optional(),
});

const analysisResultSchema = z.object({
  themes: z.array(
    z.object({
      theme: z.string().min(3).max(200),
      count: z.number().int().min(0).max(1_000_000),
      sentiment: z.enum(["positive", "negative", "neutral"]),
      examples: z.array(z.string().min(3).max(500)).min(1).max(5),
      actionableInsight: z.string().min(30).max(600),
    }),
  ).min(1),
  sentiment: z.object({
    positive: z.number().min(0).max(100),
    neutral: z.number().min(0).max(100),
    negative: z.number().min(0).max(100),
  }),
  wordCloud: z.array(
    z.object({
      word: z.string().min(2).max(50),
      weight: z.number().int().min(1).max(100),
    }),
  ).min(1),
  summary: z.string().min(50).max(5000),
  keyInsights: z.array(z.string().min(20).max(600)).min(3).max(10),
  diagnostics: diagnosticsSchema,
  businessImplications: z.array(z.string().min(20).max(600)).min(1).max(8).optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
});

type OpenAnswerGroup = {
  questionTitle: string;
  answers: string[];
};

function stripMarkdownFence(value: string): string {
  return value
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/^\s*json\s*/i, "")
    .trim();
}

function normalizeOpenAnswers(groups: OpenAnswerGroup[]): OpenAnswerGroup[] {
  return groups
    .map((group) => ({
      questionTitle: group.questionTitle.trim(),
      answers: Array.from(
        new Set(
          group.answers
            .map((answer) => answer.trim())
            .filter((answer) => answer.length >= 3)
            .slice(0, 150),
        ),
      ),
    }))
    .filter((group) => group.questionTitle.length > 0 && group.answers.length > 0);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeSentiment(sentiment: { positive: number; neutral: number; negative: number }): {
  positive: number;
  neutral: number;
  negative: number;
} {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;

  if (total === 100) return sentiment;
  if (total === 0) return { positive: 0, neutral: 100, negative: 0 };

  const positive = clampPercent(Math.round((sentiment.positive / total) * 100));
  const negative = clampPercent(Math.round((sentiment.negative / total) * 100));
  let neutral = clampPercent(Math.round((sentiment.neutral / total) * 100));

  const sum = positive + neutral + negative;
  if (sum !== 100) {
    neutral += (100 - sum);
  }

  return {
    positive,
    neutral: Math.max(0, neutral),
    negative,
  };
}

async function callOpenRouterWithRetry(params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxRetries: number;
}): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= params.maxRetries; attempt++) {
    try {
      console.log(`[ai-analysis] Attempt ${attempt}/${params.maxRetries} with model ${params.model}`);

      const completion = await openrouter.chat.completions.create({
        model: params.model,
        temperature: 0.4,
        max_tokens: 4000,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("Empty response from model");
      }

      const rawText = Array.isArray(content)
        ? content
            .map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
            .join("")
        : content;

      return stripMarkdownFence(rawText);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[ai-analysis] Attempt ${attempt} failed:`, lastError.message);

      if (attempt < params.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[ai-analysis] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("All retries failed");
}

export async function analyzeSurveyResponses(params: {
  surveyTitle: string;
  surveyCategory?: string | null;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary?: string;
}): Promise<AnalysisResult> {
  const normalizedOpenAnswers = normalizeOpenAnswers(params.openAnswers);
  const totalAnswers = normalizedOpenAnswers.reduce((sum, g) => sum + g.answers.length, 0);

  if (!normalizedOpenAnswers.length || totalAnswers === 0) {
    throw new Error("NO_OPEN_ANSWERS");
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const quantitativeSummary = params.quantitativeSummary?.trim() ?? "";

  // Формируем текст ответов
  const answersText = normalizedOpenAnswers
    .map(
      (group) =>
        `Question: "${group.questionTitle}"\nAnswers count: ${group.answers.length}\nAnswers:\n${group.answers
          .map((answer, index) => `${index + 1}. ${answer}`)
          .join("\n")}`,
    )
    .join("\n\n---\n\n");

  // Системный промпт
  const systemPrompt = `You are an expert CX analyst and business consultant. Your task is to analyze survey responses and provide actionable, specific, personalized insights. You respond ONLY with valid JSON in Russian language. Every recommendation must include: WHAT to do, WHO is responsible, TIMELINE, and EXPECTED KPI. No generic phrases allowed.`;

  // Пользовательский промпт
  const userPrompt = `Analyze these survey responses and provide detailed, specific, actionable insights.

Survey title: ${params.surveyTitle}
${params.surveyCategory ? `Business category: ${params.surveyCategory}` : ""}
Total open answers: ${totalAnswers}
Number of questions: ${normalizedOpenAnswers.length}

${quantitativeSummary ? `Quantitative data (use for cross-analysis):\n${quantitativeSummary}\n` : ""}

Open answers:
${answersText}

Return ONLY valid JSON in this exact structure (no markdown, no code blocks):

{
  "themes": [
    {
      "theme": "Specific problem or topic with context (e.g., 'Cold food delivery in downtown area after 8 PM affecting office workers')",
      "count": number_of_mentions,
      "sentiment": "negative",
      "examples": ["exact quote 1", "exact quote 2"],
      "actionableInsight": "Specific action: what to do, who responsible, deadline, expected KPI with numbers"
    }
  ],
  "sentiment": {"positive": 30, "neutral": 40, "negative": 30},
  "wordCloud": [{"word": "keyword from answers", "weight": 85}],
  "summary": "Detailed summary in Russian (8-12 sentences): overall picture with numbers, 2-3 most critical issues, where business loses money/clients, hidden opportunities, forecast for 1-3-6 months with and without changes",
  "keyInsights": [
    "Insight 1: specific finding with numbers and business impact",
    "Insight 2: ...",
    "Insight 3: ...",
    "Insight 4: ..."
  ],
  "diagnostics": {
    "recommendations": [
      "Recommendation: action + responsible person/department + deadline + expected KPI + how to measure",
      "..."
    ],
    "hypotheses": [
      "Hypothesis: 'We think problem X exists because...' + how to verify (A/B test, interviews, CRM data)",
      "..."
    ],
    "riskFactors": [
      "Risk: description + probability (low/medium/high) + potential damage (money/clients) + mitigation plan",
      "..."
    ],
    "metricsToWatch": [
      "Metric: name + current value (if can estimate) + target value + measurement frequency",
      "..."
    ],
    "actionPlan": {
      "immediate": ["This week: specific action + concrete KPI + responsible person"],
      "shortTerm": ["1-3 months: action + expected effect with numbers + how to measure"],
      "longTerm": ["3-12 months: strategic action + business impact prediction"]
    },
    "segmentsAnalysis": [
      {
        "segment": "Customer segment name (e.g., 'Office workers ordering lunch')",
        "insight": "What concerns them, what they value, behavior patterns (with examples from answers)",
        "action": "What to do for this segment to increase loyalty and average check (specific)"
      }
    ]
  },
  "businessImplications": [
    "How identified issue/opportunity affects: revenue, churn, reputation, operational costs. With specific numbers and forecast.",
    "..."
  ],
  "confidenceScore": 75
}

IMPORTANT RULES:
- Sum of sentiment values MUST be exactly 100
- Every theme MUST have actionableInsight with specific actions
- Write summary and keyInsights in Russian
- Use specific numbers and percentages from the data
- Don't use generic phrases like "improve quality" - say specifically what to improve, how, why
- If you see contradictions between open answers and quantitative data, point them out
- Identify hidden patterns and non-obvious connections`;

  // Список моделей для попыток
  const modelsToTry = [
    process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    "google/gemini-2.0-flash-001",
    "google/gemini-1.5-flash",
    "meta-llama/llama-3.1-70b-instruct",
    "mistralai/mistral-large",
  ].filter(Boolean);

  const uniqueModels = Array.from(new Set(modelsToTry));

  console.log(`[ai-analysis] Starting analysis for "${params.surveyTitle}" with ${totalAnswers} answers`);
  console.log(`[ai-analysis] Will try models: ${uniqueModels.join(", ")}`);

  const errors: string[] = [];

  for (const model of uniqueModels) {
    try {
      console.log(`[ai-analysis] Trying ${model}...`);
      
      const rawResponse = await callOpenRouterWithRetry({
        model,
        systemPrompt,
        userPrompt,
        maxRetries: 2,
      });

      console.log(`[ai-analysis] Got response from ${model}, length: ${rawResponse.length}`);

      // Пробуем распарсить JSON
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(rawResponse);
      } catch {
        // Может быть, там лишние символы, пробуем ещё раз очистить
        const cleanedAgain = rawResponse
          .replace(/^[^{]*/, "")
          .replace(/[^}]*$/, "");
        parsedJson = JSON.parse(cleanedAgain);
      }

      // Валидируем через Zod
      const validated = analysisResultSchema.parse(parsedJson) as AnalysisResult;

      // Нормализуем sentiment
      validated.sentiment = normalizeSentiment(validated.sentiment);

      // Проверяем базовое качество
      if (
        validated.summary.length < 50 ||
        validated.keyInsights.length < 3 ||
        validated.themes.length < 1
      ) {
        console.warn(`[ai-analysis] ${model} returned low quality response, trying next...`);
        errors.push(`${model}: low quality`);
        continue;
      }

      console.log(`[ai-analysis] SUCCESS with ${model}`);
      return validated;

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[ai-analysis] ${model} failed: ${msg}`);
      errors.push(`${model}: ${msg}`);
    }
  }

  console.error(`[ai-analysis] All models failed. Errors:`, errors);
  
  throw new Error(
    `Failed to analyze responses with all available AI models. ` +
    `Errors: ${errors.join("; ")}. ` +
    `Please try again later or contact support.`
  );
}