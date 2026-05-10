import OpenAI from "openai";
import { z } from "zod";

const openrouter = new OpenAI({
  baseURL: "https://routerai.ru/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
    "X-Title": "PotokMneniy",
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
  let cleaned = value;
  cleaned = cleaned.replace(/```json\s*/gi, "");
  cleaned = cleaned.replace(/```\s*/g, "");
  cleaned = cleaned.replace(/^\s*json\s*/i, "");
  return cleaned.trim();
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

  const answersText = normalizedOpenAnswers
    .map(
      (group) =>
        `Question: "${group.questionTitle}"\nAnswers (${group.answers.length}):\n${group.answers
          .map((answer, index) => `${index + 1}. ${answer}`)
          .join("\n")}`,
    )
    .join("\n\n---\n\n");

  const systemPrompt = `You are a senior CX analyst. Analyze survey responses and return ONLY valid JSON in Russian. Every insight must be specific with numbers, every recommendation must include: WHAT to do, WHO responsible, DEADLINE, EXPECTED KPI. No markdown, no code blocks - ONLY JSON.`;

  const userPrompt = `Analyze survey "${params.surveyTitle}"${params.surveyCategory ? ` (category: ${params.surveyCategory})` : ""}.
Total answers: ${totalAnswers}, questions: ${normalizedOpenAnswers.length}.

${quantitativeSummary ? `Quantitative data:\n${quantitativeSummary}\n` : ""}

Open answers:
${answersText}

Return JSON:
{
  "themes": [{"theme": "specific problem", "count": N, "sentiment": "negative|positive|neutral", "examples": ["quote"], "actionableInsight": "what to do, who, deadline, KPI"}],
  "sentiment": {"positive": N, "neutral": N, "negative": N},
  "wordCloud": [{"word": "keyword", "weight": N}],
  "summary": "detailed summary in Russian (8-12 sentences with numbers and forecasts)",
  "keyInsights": ["insight with numbers and business impact", ...],
  "diagnostics": {
    "recommendations": ["action + responsible + deadline + KPI + measurement", ...],
    "hypotheses": ["hypothesis + verification method", ...],
    "riskFactors": ["risk + probability + damage + mitigation", ...],
    "metricsToWatch": ["metric + current + target + frequency", ...],
    "actionPlan": {
      "immediate": ["this week: action + KPI + responsible"],
      "shortTerm": ["1-3 months: action + effect + measurement"],
      "longTerm": ["3-12 months: strategic action + business impact"]
    },
    "segmentsAnalysis": [{"segment": "name", "insight": "what concerns them", "action": "what to do"}]
  },
  "businessImplications": ["impact on revenue/churn/reputation with numbers", ...],
  "confidenceScore": N
}

Rules:
- Sum of sentiment = 100
- Every theme must have actionableInsight
- Write in Russian for summary and keyInsights
- Use specific numbers from data
- No generic phrases`;

  // Используем только одну мощную модель
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  
  console.log(`[ai-analysis] Analyzing "${params.surveyTitle}" with ${totalAnswers} answers using ${model}`);

  try {
    const completion = await openrouter.chat.completions.create({
      model: model,
      temperature: 0.4,
      max_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from AI model");
    }

    const rawText = typeof content === "string" ? content : String(content);
    const cleaned = stripMarkdownFence(rawText);

    console.log(`[ai-analysis] Got response, length: ${cleaned.length}`);

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (parseError) {
      console.warn(`[ai-analysis] First parse failed, trying additional cleaning...`);
      const extraCleaned = cleaned
        .replace(/^[^{]*/, "")
        .replace(/[^}]*$/, "")
        .trim();
      parsedJson = JSON.parse(extraCleaned);
    }

    const validated = analysisResultSchema.parse(parsedJson) as AnalysisResult;
    validated.sentiment = normalizeSentiment(validated.sentiment);

    console.log(`[ai-analysis] SUCCESS: ${validated.themes.length} themes, ${validated.keyInsights.length} insights`);
    return validated;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ai-analysis] FAILED: ${message}`);
    
    if (message.includes("OPENROUTER_NOT_CONFIGURED")) {
      throw new Error("OPENROUTER_NOT_CONFIGURED");
    }
    
    throw new Error(
      `AI analysis failed: ${message}. Please try again or contact support.`
    );
  }
}