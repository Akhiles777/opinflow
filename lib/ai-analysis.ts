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
  recommendations: z.array(z.string().min(30).max(500)).min(3).max(8),
  hypotheses: z.array(z.string().min(30).max(450)).min(3).max(6),
  riskFactors: z.array(z.string().min(20).max(400)).min(3).max(6),
  metricsToWatch: z.array(z.string().min(20).max(350)).min(3).max(6),
  actionPlan: z.object({
    immediate: z.array(z.string().min(30).max(400)).min(2).max(5),
    shortTerm: z.array(z.string().min(30).max(400)).min(2).max(5),
    longTerm: z.array(z.string().min(30).max(400)).min(2).max(4),
  }).optional(),
  segmentsAnalysis: z.array(
    z.object({
      segment: z.string().min(5).max(200),
      insight: z.string().min(20).max(400),
      action: z.string().min(20).max(400),
    })
  ).min(0).max(6).optional(),
});

const analysisResultSchema = z.object({
  themes: z.array(
    z.object({
      theme: z.string().min(3).max(150),
      count: z.number().int().min(0).max(1_000_000),
      sentiment: z.enum(["positive", "negative", "neutral"]),
      examples: z.array(z.string().min(3).max(300)).min(1).max(5),
      actionableInsight: z.string().min(30).max(400),
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
  ).min(3),
  summary: z.string().min(100).max(4000),
  keyInsights: z.array(z.string().min(30).max(500)).min(4).max(10),
  diagnostics: diagnosticsSchema,
  businessImplications: z.array(z.string().min(30).max(500)).min(3).max(8).optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
});

type OpenAnswerGroup = {
  questionTitle: string;
  answers: string[];
};

function stripMarkdownFence(value: string) {
  return value
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/^\s*json\s*/i, "")
    .trim();
}

function normalizeOpenAnswers(groups: OpenAnswerGroup[]) {
  return groups
    .map((group) => ({
      questionTitle: group.questionTitle.trim(),
      answers: Array.from(
        new Set(
          group.answers
            .map((answer) => answer.trim())
            .filter((answer) => answer.length >= 5)
            .slice(0, 200),
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
  if (trimmed.length < 25) return false;
  if (!/[A-Za-zА-Яа-я0-9]/.test(trimmed)) return false;
  if (/^[\W_]+$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter((word) => /[A-Za-zА-Яа-я0-9]/.test(word));
  if (words.length < 5) return false;

  const genericPhrases = [
    "всё хорошо", "всё плохо", "нормально", "всё устраивает",
    "нет комментариев", "без комментариев", "не знаю", "затрудняюсь ответить",
  ];
  const lowerTrimmed = trimmed.toLowerCase();
  if (genericPhrases.some((phrase) => lowerTrimmed.includes(phrase) && lowerTrimmed.length < 60)) {
    return false;
  }

  const lettersOnly = trimmed.replace(/[^A-Za-zА-Яа-я0-9]/g, "");
  return lettersOnly.length >= Math.floor(trimmed.length * 0.4);
}

function isLowQuality(result: AnalysisResult) {
  if (!isMeaningfulText(result.summary)) return true;

  const meaningfulInsights = result.keyInsights.filter(isMeaningfulText);
  if (meaningfulInsights.length < 3) return true;

  const meaningfulThemes = result.themes.filter(
    (theme) => isMeaningfulText(theme.theme) && isMeaningfulText(theme.actionableInsight)
  );
  if (meaningfulThemes.length < 1) return true;

  const sentimentTotal = sumSentiment(result.sentiment);
  if (sentimentTotal < 98 || sentimentTotal > 102) return true;

  const diag = result.diagnostics;
  if (!diag) return true;
  if (diag.recommendations.filter(isMeaningfulText).length < 2) return true;
  if (diag.hypotheses.filter(isMeaningfulText).length < 2) return true;

  return false;
}

function clampPercent(value: number) {
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

async function requestAnalysisFromModel(params: {
  model: string;
  surveyTitle: string;
  surveyCategory?: string | null;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary: string;
}): Promise<{ content: string; attempt: number }> {
  const answersText = params.openAnswers
    .map(
      (group) =>
        `ВОПРОС: "${group.questionTitle}"\nКОЛИЧЕСТВО ОТВЕТОВ: ${group.answers.length}\nОТВЕТЫ:\n${group.answers
          .map((answer, index) => `${index + 1}. "${answer}"`)
          .join("\n")}`,
    )
    .join("\n\n---\n\n");

  const totalAnswers = params.openAnswers.reduce((sum, g) => sum + g.answers.length, 0);

  const prompt = `Ты — ведущий CX-аналитик и консультант по стратегии. Твоя задача — провести глубокий, персонализированный анализ ответов респондентов и дать владельцу бизнеса чёткое понимание: где у него пробелы, что требует немедленного внимания, какие есть скрытые проблемы и возможности.

Контекст исследования:
- Название: "${params.surveyTitle}"
${params.surveyCategory ? `- Категория бизнеса: ${params.surveyCategory}` : ""}
- Всего открытых ответов: ${totalAnswers}
- Количество вопросов: ${params.openAnswers.length}

${params.quantitativeSummary.trim() ? `ДАННЫЕ ЗАКРЫТЫХ ВОПРОСОВ (используй для кросс-анализа и поиска корреляций):\n${params.quantitativeSummary}\n` : ""}

ОТКРЫТЫЕ ОТВЕТЫ:
${answersText}

# КЛЮЧЕВАЯ ЗАДАЧА
Дай владельцу бизнеса КОНКРЕТНУЮ картину того, что происходит. Он должен после прочтения точно знать:
1. Где у него САМЫЕ БОЛЬНЫЕ МЕСТА (конкретные проблемы с примерами)
2. Где он ТЕРЯЕТ КЛИЕНТОВ/ДЕНЬГИ
3. Что нужно СДЕЛАТЬ ПРЯМО СЕЙЧАС
4. Какие есть СКРЫТЫЕ ВОЗМОЖНОСТИ, которые он не замечает
5. Какие РИСКИ его ждут, если ничего не менять

# ПРАВИЛА АНАЛИЗА
- Анализируй КАЖДЫЙ ответ, даже если он один такой — единичные жалобы могут указывать на серьёзные системные проблемы
- Сравнивай открытые ответы с данными закрытых вопросов, ищи противоречия и неочевидные паттерны
- Если видишь, что респонденты говорят одно, а цифры показывают другое — укажи на это
- Выделяй конкретные сегменты клиентов с их специфическими проблемами
- Каждая твоя рекомендация должна иметь: ЧТО делать + КОМУ поручить + СРОК + КАКОЙ БУДЕТ РЕЗУЛЬТАТ
- Пиши на русском языке живым, деловым языком, без канцеляризмов
- НЕ ИСПОЛЬЗУЙ общие фразы вроде "нужно улучшить качество" — говори конкретно: что улучшить, как, зачем

# ФОРМАТ ОТВЕТА
Только валидный JSON, без markdown-обёрток:

{
  "themes": [
    {
      "theme": "КОНКРЕТНАЯ проблема или тема (например: «Холодная еда при доставке в центр города после 20:00»)",
      "count": число упоминаний,
      "sentiment": "negative/positive/neutral",
      "examples": ["Точная цитата респондента", "Ещё цитата"],
      "actionableInsight": "КОНКРЕТНОЕ действие: что сделать, кто отвечает, в какой срок, какой будет эффект (с цифрами)"
    }
  ],
  "sentiment": {"positive": число 0-100, "neutral": число 0-100, "negative": число 0-100},
  "wordCloud": [{"word": "ключевое слово или фраза из ответов", "weight": число 1-100}],
  "summary": "РАЗВЁРНУТОЕ резюме (8-12 предложений):
- Опиши общую картину с цифрами
- Выдели 2-3 САМЫЕ КРИТИЧНЫЕ ПРОБЛЕМЫ
- Покажи, где бизнес теряет деньги или клиентов
- Укажи на скрытые возможности, которые ты увидел
- Дай прогноз: что будет через 1-3-6 месяцев, если ничего не менять, и что будет, если внедрить твои рекомендации
- Привяжи выводы к конкретным данным из ответов",
  "keyInsights": [
    "Инсайт 1: Конкретная находка с цифрами и влиянием на бизнес",
    "Инсайт 2: ...",
    ...(5-8 инсайтов)
  ],
  "diagnostics": {
    "recommendations": [
      "Рекомендация 1: действие + ответственный + срок + ожидаемый KPI + как измерить результат",
      ...(3-6 рекомендаций)
    ],
    "hypotheses": [
      "Гипотеза 1: «Мы думаем, что проблема в X, потому что...» + как проверить (A/B-тест, интервью, данные из CRM)",
      ...(3-6 гипотез)
    ],
    "riskFactors": [
      "Риск 1: описание + вероятность (низкая/средняя/высокая) + потенциальный ущерб в деньгах или клиентах + что делать для предотвращения",
      ...(3-5 рисков)
    ],
    "metricsToWatch": [
      "Метрика: название + текущее значение (если можно оценить) + целевое значение + как часто измерять",
      ...(4-7 метрик)
    ],
    "actionPlan": {
      "immediate": [
        "На эту неделю: действие + конкретный результат (KPI) + ответственный",
        ...(2-4 действия)
      ],
      "shortTerm": [
        "На 1-3 месяца: действие + ожидаемый эффект (в цифрах) + как измерить",
        ...(2-4 действия)
      ],
      "longTerm": [
        "На 3-12 месяцев: стратегическое действие + как оно повлияет на бизнес",
        ...(2-3 действия)
      ]
    },
    "segmentsAnalysis": [
      {
        "segment": "Название сегмента клиентов (например: «Офисные сотрудники, заказывающие обеды»)",
        "insight": "Что их беспокоит, что ценят, какие у них паттерны поведения (с примерами из ответов)",
        "action": "Что делать для этого сегмента, чтобы повысить их лояльность и чек (конкретно)"
      },
      ...(1-4 сегмента)
    ]
  },
  "businessImplications": [
    "Как выявленная проблема/возможность влияет на: выручку, отток, репутацию, операционные расходы. С конкретными цифрами и прогнозом.",
    ...(3-6 импликаций)
  ],
  "confidenceScore": число 0-100
}`;

  const completion = await openrouter.chat.completions.create({
    model: params.model,
    temperature: 0.4,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: "Ты — элитный бизнес-консультант и CX-аналитик. Твоя специализация — находить конкретные проблемы и точки роста в клиентском опыте. Ты говоришь бизнесу правду: где они теряют деньги, где у них пробелы, что срочно исправлять. Ты не используешь общие фразы, каждое твоё утверждение подкреплено данными из ответов. Ты думаешь как предприниматель, для которого важен каждый рубль. Отвечаешь ТОЛЬКО JSON на русском языке.",
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

  return {
    content: stripMarkdownFence(rawText),
    attempt: 1,
  };
}

async function requestAnalysisFromModelWithRetry(params: {
  model: string;
  surveyTitle: string;
  surveyCategory?: string | null;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary: string;
  maxRetries: number;
}): Promise<{ content: string; attempt: number }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= params.maxRetries; attempt++) {
    try {
      const result = await requestAnalysisFromModel({
        model: params.model,
        surveyTitle: params.surveyTitle,
        surveyCategory: params.surveyCategory,
        openAnswers: params.openAnswers,
        quantitativeSummary: params.quantitativeSummary,
      });
      return { ...result, attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[ai-analysis] Attempt ${attempt}/${params.maxRetries} failed for model ${params.model}:`, lastError.message);

      if (attempt < params.maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("AI_ANALYSIS_ALL_RETRIES_FAILED");
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
  const totalAnswers = normalizedOpenAnswers.reduce((sum, g) => sum + g.answers.length, 0);

  if (!normalizedOpenAnswers.length || totalAnswers === 0) {
    throw new Error("Нет открытых ответов для анализа. Добавьте открытые вопросы в опрос и соберите ответы респондентов.");
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const quantitativeSummary = params.quantitativeSummary?.trim() ?? "";

  // Список моделей от лучшей к более простым
  const modelsToTry = [
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-haiku-20240307",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3-70b-instruct",
    "google/gemini-2.0-flash-001",
  ];

  // Добавляем модель из конфига, если её нет в списке
  const configuredModel = process.env.OPENROUTER_MODEL;
  if (configuredModel && !modelsToTry.includes(configuredModel)) {
    modelsToTry.unshift(configuredModel);
  }

  // Убираем дубликаты
  const uniqueModels = Array.from(new Set(modelsToTry));

  console.log(`[ai-analysis] Starting analysis for "${params.surveyTitle}" with ${totalAnswers} answers across ${normalizedOpenAnswers.length} questions`);
  console.log(`[ai-analysis] Models to try: ${uniqueModels.join(", ")}`);

  let lastError: Error | null = null;

  for (const model of uniqueModels) {
    console.log(`[ai-analysis] Trying model: ${model}`);

    try {
      const { content: cleaned, attempt } = await withTimeout(
        requestAnalysisFromModelWithRetry({
          model,
          surveyTitle: params.surveyTitle,
          surveyCategory: params.surveyCategory,
          openAnswers: normalizedOpenAnswers,
          quantitativeSummary,
          maxRetries: 2,
        }),
        60000,
        "AI_ANALYSIS"
      );

      console.log(`[ai-analysis] Got response from ${model} (attempt ${attempt}), parsing...`);

      try {
        const parsedJson = JSON.parse(cleaned);
        const parsed = analysisResultSchema.parse(parsedJson) as AnalysisResult;

        if (!isLowQuality(parsed)) {
          console.log(`[ai-analysis] SUCCESS with ${model} (attempt ${attempt})`);
          return {
            ...parsed,
            sentiment: normalizeSentiment(parsed.sentiment),
          };
        } else {
          console.warn(`[ai-analysis] Low quality result from ${model}, trying next model...`);
        }
      } catch (parseError) {
        console.warn(`[ai-analysis] JSON parse/schema error with ${model}:`, 
          parseError instanceof Error ? parseError.message : "Unknown error");
        // Продолжаем со следующей моделью
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI_ANALYSIS_FAILED";

      if (message.includes("OPENROUTER_NOT_CONFIGURED")) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(message);
      console.warn(`[ai-analysis] Model ${model} failed: ${message}`);
    }
  }

  // Если все модели не сработали — выбрасываем понятную ошибку
  const errorMessage = lastError
    ? `Все ИИ-модели не смогли провести анализ (последняя ошибка: ${lastError.message}). Пожалуйста, попробуйте позже или обратитесь в поддержку.`
    : "Все ИИ-модели не смогли провести анализ. Пожалуйста, попробуйте позже или обратитесь в поддержку.";

  console.error(`[ai-analysis] ALL MODELS FAILED. ${errorMessage}`);
  throw new Error(errorMessage);
}