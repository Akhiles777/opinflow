import OpenAI from "openai";
import { z } from "zod";

const openrouter = new OpenAI({
  baseURL: "https://routerai.ru/api/v1",
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

export type AnalysisDiagnostics = {
  recommendations: string[];
  hypotheses: string[];
  riskFactors: string[];
  metricsToWatch: string[];
};

export type AnalysisResult = {
  themes: ThemeItem[];
  sentiment: { positive: number; neutral: number; negative: number };
  wordCloud: { word: string; weight: number }[];
  summary: string;
  keyInsights: string[];
  diagnostics?: AnalysisDiagnostics;
};

const diagnosticsSchema = z.object({
  recommendations: z.array(z.string().min(18).max(450)).min(2).max(6),
  hypotheses: z.array(z.string().min(18).max(380)).min(2).max(5),
  riskFactors: z.array(z.string().min(14).max(340)).min(2).max(5),
  metricsToWatch: z.array(z.string().min(12).max(300)).min(2).max(5),
});

const analysisResultSchema = z.object({
  themes: z.array(
    z.object({
      theme: z.string().min(2).max(120),
      count: z.number().int().min(0).max(1_000_000),
      sentiment: z.enum(["positive", "negative", "neutral"]),
      examples: z.array(z.string().min(1).max(280)).max(5),
    }),
  ),
  sentiment: z.object({
    positive: z.number().min(0).max(100),
    neutral: z.number().min(0).max(100),
    negative: z.number().min(0).max(100),
  }),
  wordCloud: z.array(
    z.object({
      word: z.string().min(2).max(40),
      weight: z.number().int().min(1).max(100),
    }),
  ),
  summary: z.string().min(45).max(3200),
  keyInsights: z.array(z.string().min(12).max(360)).min(4).max(8),
  diagnostics: diagnosticsSchema,
});

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
    keyInsights: [
      "Открытые ответы отсутствуют или слишком короткие.",
      "Добавьте открытый вопрос или увеличьте выборку — так ИИ сможет выделить темы и тональность.",
      "Закрытые вопросы при этом можно анализировать по графикам распределения на странице опроса.",
      "Повторите анализ после накопления более развёрнутых комментариев респондентов.",
    ],
  };
}

function stripMarkdownFence(value: string) {
  return value.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function normalizeOpenAnswers(groups: OpenAnswerGroup[]) {
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

function sumSentiment(sentiment: AnalysisResult["sentiment"]) {
  return sentiment.positive + sentiment.neutral + sentiment.negative;
}

function isMeaningfulText(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 20) return false;
  if (!/[A-Za-zА-Яа-я0-9]/.test(trimmed)) return false;
  if (/^[\W_]+$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter((word) => /[A-Za-zА-Яа-я0-9]/.test(word));
  if (words.length < 4) return false;
  const lettersOnly = trimmed.replace(/[^A-Za-zА-Яа-я0-9]/g, "");
  return lettersOnly.length >= Math.floor(trimmed.length * 0.45);
}

function isLowQuality(result: AnalysisResult) {
  if (!isMeaningfulText(result.summary)) return true;
  if (result.keyInsights.filter(isMeaningfulText).length < 3) return true;
  if (result.themes.filter((theme) => isMeaningfulText(theme.theme)).length < 1) return true;
  const sentimentTotal = sumSentiment(result.sentiment);
  if (sentimentTotal < 95 || sentimentTotal > 105) return true;
  const diag = result.diagnostics;
  if (
    !diag ||
    diag.recommendations.filter(isMeaningfulText).length < 2 ||
    diag.hypotheses.filter(isMeaningfulText).length < 2
  ) {
    return true;
  }
  return false;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildHeuristicFallback(params: {
  surveyTitle: string;
  openAnswers: OpenAnswerGroup[];
}): AnalysisResult {
  const allAnswers = params.openAnswers.flatMap((group) => group.answers);
  const total = allAnswers.length || 1;

  const positiveWords = ["хорош", "удоб", "быстр", "качеств", "нрав", "отлич", "супер", "понят"];
  const negativeWords = ["плох", "дорог", "медлен", "ошиб", "неудоб", "проблем", "долг", "слож"];

  let positiveHits = 0;
  let negativeHits = 0;
  const freq = new Map<string, number>();

  for (const answer of allAnswers) {
    const lower = answer.toLowerCase();
    if (positiveWords.some((token) => lower.includes(token))) positiveHits += 1;
    if (negativeWords.some((token) => lower.includes(token))) negativeHits += 1;

    for (const word of lower.split(/[^a-zа-я0-9]+/i)) {
      if (word.length < 4) continue;
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }

  const neutralHits = Math.max(0, total - positiveHits - negativeHits);
  const rawPositive = (positiveHits / total) * 100;
  const rawNegative = (negativeHits / total) * 100;
  let positive = clampPercent(rawPositive);
  let negative = clampPercent(rawNegative);
  let neutral = clampPercent((neutralHits / total) * 100);
  const delta = 100 - (positive + neutral + negative);
  neutral = clampPercent(neutral + delta);
  if (positive + neutral + negative !== 100) {
    neutral = Math.max(0, 100 - positive - negative);
  }

  const topTerms = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const themes = params.openAnswers.slice(0, 4).map((group, index) => ({
    theme: group.questionTitle,
    count: group.answers.length,
    sentiment: (index % 3 === 0 ? "negative" : index % 3 === 1 ? "neutral" : "positive") as
      | "positive"
      | "negative"
      | "neutral",
    examples: group.answers.slice(0, 2),
  }));

  const keyInsights: string[] = [
    `Собрано ${allAnswers.length} открытых ответов по опросу "${params.surveyTitle}".`,
    topTerms.length
      ? `Чаще всего респонденты упоминали: ${topTerms.slice(0, 4).map(([word]) => word).join(", ")}.`
      : "В ответах мало повторяющихся терминов, аудитория описывает опыт более свободно.",
    "Рекомендуется сегментировать ответы по профилям респондентов и сравнить темы между сегментами.",
    "Сопоставьте частотные темы с закрытыми вопросами опроса и проверьте, не доминирует ли одна узкая группа респондентов.",
  ];

  return {
    themes,
    sentiment: { positive, neutral, negative },
    wordCloud: topTerms.map(([word, weight]) => ({ word, weight: Math.min(100, weight) })),
    summary:
      "Автоматический анализ построен на базовой эвристике из-за низкого качества ответа модели. Для более точной интерпретации рекомендуется повторный запуск на более сильной модели.",
    keyInsights,
    diagnostics: {
      recommendations: [
        "Провести качественные интервью с 5–8 респондентами из доминирующих сегментов, чтобы объяснить причины найденных формулировок.",
        "Запустить уточняющий мини-опрос с масштабом согласия по ключевым утверждениям, выведенным из открытых ответов.",
      ],
      hypotheses: [
        "Негативные формулировки чаще связаны с конкретным этапом клиентского пути, а не с продуктом в целом.",
        "Позитивные отклики коррелируют с простотой онбординга и скоростью получения результата.",
      ],
      riskFactors: [
        "Выборка может не отражать редкие, но критичные мнения из-за ограниченного объёма открытых комментариев.",
        "Эвристическая тональность не заменяет ручную верификацию спорных ответов.",
      ],
      metricsToWatch: [
        "Долю ответов с явным негативом по ключевым словам при следующем туре сбора.",
        "Конверсию завершения опроса после изменения формулировок открытых вопросов.",
      ],
    },
  };
}

async function requestAnalysisFromModel(params: {
  model: string;
  surveyTitle: string;
  surveyCategory?: string | null;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary: string;
}) {
  const answersText = params.openAnswers
    .map(
      (group) =>
        `Вопрос: "${group.questionTitle}"\nОтветы:\n${group.answers
          .map((answer, index) => `${index + 1}. ${answer}`)
          .join("\n")}`,
    )
    .join("\n\n");

  const quantBlock = params.quantitativeSummary.trim()
    ? `Сводка по закрытым вопросам (распределения, доли):\n${params.quantitativeSummary}`
    : null;

  const prompt = [
    "Ты ведущий аналитик CX/маркетинга. Персонализируй выводы под название и контекст опроса; опирайся на факты из данных, не используй общие фразы вроде «всё хорошо» без привязки к формулировкам респондентов.",
    `Опрос: ${params.surveyTitle}`,
    params.surveyCategory ? `Категория: ${params.surveyCategory}` : null,
    quantBlock,
    "Проанализируй открытые ответы. Свяжи тональность и темы с распределениями по закрытым вопросам, если они даны.",
    "Нельзя возвращать пустые строки, заглушки, markdown и текст вне JSON.",
    "Верни ТОЛЬКО валидный JSON:",
    `{
  "themes": [{"theme":"...", "count":12, "sentiment":"positive|negative|neutral", "examples":["короткая цитата", "..."]}],
  "sentiment": {"positive": 0-100, "neutral": 0-100, "negative": 0-100},
  "wordCloud": [{"word":"...", "weight": 1-100}],
  "summary": "4-6 предложений: выводы, сегменты, неочевидные паттерны",
  "keyInsights": ["4-8 конкретных инсайтов с цифрами/фактами из данных"],
  "diagnostics": {
    "recommendations": ["2-6 прикладных шагов для продукта/коммуникаций/исследования"],
    "hypotheses": ["2-5 проверяемых гипотез, почему аудитория отвечает именно так"],
    "riskFactors": ["2-5 рисков интерпретации или данных"],
    "metricsToWatch": ["2-5 метрик/KPI для следующего цикла"]
  }
}`,
    answersText,
  ]
    .filter(Boolean)
    .join("\n\n");

  const completion = await openrouter.chat.completions.create({
    model: params.model,
    temperature: 0.28,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content:
          "Ты возвращаешь только компактный JSON на русском. Сумма sentiment должна быть 100±2. Пиши как для руководителя продукта: конкретно, с причинами и действиями.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  const rawText = Array.isArray(content)
    ? content
        .map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
        .join("")
    : (content ?? "");
  return stripMarkdownFence(rawText);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label}_TIMEOUT`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function analyzeSurveyResponses(params: {
  surveyTitle: string;
  surveyCategory?: string | null;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary?: string;
}): Promise<AnalysisResult> {
  const normalizedOpenAnswers = normalizeOpenAnswers(params.openAnswers);
  if (!normalizedOpenAnswers.length) {
    return getFallbackAnalysis();
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const quantitativeSummary = params.quantitativeSummary?.trim() ?? "";

  const primaryModel = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  const fallbackModel = "google/gemini-2.0-flash-001";
  const modelsToTry = Array.from(new Set([primaryModel, fallbackModel]));

  for (const model of modelsToTry) {
    try {
      const cleaned = await withTimeout(
        requestAnalysisFromModel({
          model,
          surveyTitle: params.surveyTitle,
          surveyCategory: params.surveyCategory,
          openAnswers: normalizedOpenAnswers,
          quantitativeSummary,
        }),
        45000,
        "AI_ANALYSIS",
      );
      const parsed = analysisResultSchema.parse(JSON.parse(cleaned)) as AnalysisResult;
      if (!isLowQuality(parsed)) {
        return parsed;
      }
      console.warn("[ai-analysis] low-quality result, trying fallback model", { model });
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI_ANALYSIS_FAILED";
      if (message.includes("OPENROUTER_NOT_CONFIGURED")) {
        throw error;
      }
      console.warn("[ai-analysis] model attempt failed", { model, message });
    }
  }

  return buildHeuristicFallback({
    surveyTitle: params.surveyTitle,
    openAnswers: normalizedOpenAnswers,
  });
}
