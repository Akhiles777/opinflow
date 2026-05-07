import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
    "X-Title": "ПотокМнений Analytics",
  },
});

export type ThemeItem = {
  theme: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
  examples: string[];
};

export type AnalysisResult = {
  themes: ThemeItem[];
  sentiment: { positive: number; neutral: number; negative: number };
  wordCloud: { word: string; weight: number }[];
  summary: string;
  keyInsights: string[];
};

type OpenAnswerGroup = {
  questionTitle: string;
  answers: string[];
};

function getFallbackAnalysis(): AnalysisResult {
  return {
    themes: [],
    sentiment: { positive: 0, neutral: 100, negative: 0 },
    wordCloud: [],
    summary: "Недостаточно открытых ответов для ИИ-аналитики.",
    keyInsights: ["Открытые ответы отсутствуют или пусты."],
  };
}

function stripMarkdownFence(value: string) {
  return value.replace(/```json/gi, "").replace(/```/g, "").trim();
}

export async function analyzeSurveyResponses(params: {
  surveyTitle: string;
  surveyCategory?: string | null;
  openAnswers: OpenAnswerGroup[];
}): Promise<AnalysisResult> {
  if (!params.openAnswers.length) {
    return getFallbackAnalysis();
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const answersText = params.openAnswers
    .map((group) => `Вопрос: "${group.questionTitle}"\nОтветы:\n${group.answers.map((answer, index) => `${index + 1}. ${answer}`).join("\n")}`)
    .join("\n\n");

  const prompt = [
    "Ты — аналитик маркетинговых исследований.",
    `Проанализируй ответы на опрос: ${params.surveyTitle}`,
    params.surveyCategory ? `Категория: ${params.surveyCategory}` : null,
    answersText,
    "Верни ТОЛЬКО валидный JSON без markdown-блоков:",
    "{ themes: [...], sentiment: { positive, neutral, negative }, wordCloud: [...], summary: \"...\", keyInsights: [...] }",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await openrouter.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    temperature: 0.3,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  const rawText = Array.isArray(content)
    ? content
        .map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
        .join("")
    : (content ?? "");

  const cleaned = stripMarkdownFence(rawText);

  try {
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error(`AI_ANALYSIS_PARSE_FAILED: ${cleaned.slice(0, 200)}`);
  }
}
