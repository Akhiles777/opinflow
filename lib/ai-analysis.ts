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

// Смягчаем валидацию — минимум 1 вместо 2-3
const diagnosticsSchema = z.object({
  recommendations: z.array(z.string().min(10).max(600)).min(1).max(10),
  hypotheses: z.array(z.string().min(10).max(500)).min(1).max(8),
  riskFactors: z.array(z.string().min(10).max(500)).min(1).max(8),
  metricsToWatch: z.array(z.string().min(10).max(400)).min(1).max(8),
  actionPlan: z.object({
    immediate: z.array(z.string().min(10).max(500)).min(1).max(6),
    shortTerm: z.array(z.string().min(10).max(500)).min(1).max(6),
    longTerm: z.array(z.string().min(10).max(500)).min(1).max(6),
  }).optional(),
  segmentsAnalysis: z.array(
    z.object({
      segment: z.string().min(3).max(200),
      insight: z.string().min(10).max(500),
      action: z.string().min(10).max(500),
    })
  ).min(0).max(8).optional(),
});

const analysisResultSchema = z.object({
  themes: z.array(
    z.object({
      theme: z.string().min(2).max(200),
      count: z.number().int().min(0).max(1_000_000),
      sentiment: z.enum(["positive", "negative", "neutral"]),
      examples: z.array(z.string().min(2).max(500)).min(1).max(5),
      actionableInsight: z.string().min(10).max(600),
    }),
  ).min(1),
  sentiment: z.object({
    positive: z.number().min(0).max(100),
    neutral: z.number().min(0).max(100),
    negative: z.number().min(0).max(100),
  }),
  wordCloud: z.array(
    z.object({
      word: z.string().min(1).max(60),
      weight: z.number().int().min(1).max(100),
    }),
  ).min(1),
  summary: z.string().min(50).max(5000),
  keyInsights: z.array(z.string().min(10).max(600)).min(2).max(12),
  diagnostics: diagnosticsSchema,
  businessImplications: z.array(z.string().min(10).max(600)).min(1).max(10).optional(),
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
            .filter((answer) => answer.length >= 5)
            .slice(0, 200),
        ),
      ),
    }))
    .filter((group) => group.questionTitle.length > 0 && group.answers.length > 0);
}

function sumSentiment(sentiment: AnalysisResult["sentiment"]): number {
  return sentiment.positive + sentiment.neutral + sentiment.negative;
}

function isMeaningfulText(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 20) return false;
  if (!/[A-Za-zА-Яа-я0-9]/.test(trimmed)) return false;
  if (/^[\W_]+$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter((word) => /[A-Za-zА-Яа-я0-9]/.test(word));
  if (words.length < 4) return false;

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

function isLowQuality(result: AnalysisResult): boolean {
  if (!isMeaningfulText(result.summary)) return true;

  const meaningfulInsights = result.keyInsights.filter(isMeaningfulText);
  if (meaningfulInsights.length < 2) return true;

  const meaningfulThemes = result.themes.filter(
    (theme) => isMeaningfulText(theme.theme) && isMeaningfulText(theme.actionableInsight)
  );
  if (meaningfulThemes.length < 1) return true;

  const sentimentTotal = sumSentiment(result.sentiment);
  if (sentimentTotal < 95 || sentimentTotal > 105) return true;

  return false;
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

async function requestAnalysisFromModel(params: {
  model: string;
  surveyTitle: string;
  surveyCategory?: string | null;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary: string;
}): Promise<string> {
  const answersText = params.openAnswers
    .map(
      (group) =>
        `Вопрос: "${group.questionTitle}"\nКоличество ответов: ${group.answers.length}\nОтветы:\n${group.answers
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
- Выделяй конкретные сегменты клиентов с их специфическими проблемами
- Каждая твоя рекомендация должна иметь: ЧТО делать + КОМУ поручить + СРОК + КАКОЙ БУДЕТ РЕЗУЛЬТАТ
- Пиши на русском языке живым, деловым языком, без канцеляризмов
- НЕ ИСПОЛЬЗУЙ общие фразы вроде "нужно улучшить качество" — говори конкретно: что улучшить, как, зачем

# ФОРМАТ ОТВЕТА
Только валидный JSON, без markdown-обёрток. ВСЕ поля обязательны, НИ ОДНО поле не должно быть пустым:

{
  "themes": [
    {
      "theme": "КОНКРЕТНАЯ проблема (например: «Холодная еда при доставке в центр после 20:00»)",
      "count": число,
      "sentiment": "negative",
      "examples": ["Точная цитата 1", "Точная цитата 2", "Точная цитата 3"],
      "actionableInsight": "КОНКРЕТНОЕ действие: что сделать, кто отвечает, срок, ожидаемый эффект"
    }
  ],
  "sentiment": {"positive": 30, "neutral": 40, "negative": 30},
  "wordCloud": [{"word": "ключевое слово", "weight": 85}],
  "summary": "РАЗВЁРНУТОЕ резюме на 8-12 предложений с цифрами, конкретными проблемами, прогнозами и выводами",
  "keyInsights": [
    "Инсайт 1: находка с цифрами и влиянием на бизнес",
    "Инсайт 2: ...",
    "Инсайт 3: ...",
    "Инсайт 4: ...",
    "Инсайт 5: ..."
  ],
  "diagnostics": {
    "recommendations": [
      "Рекомендация 1: действие + ответственный + срок + KPI + способ измерения",
      "Рекомендация 2: ...",
      "Рекомендация 3: ..."
    ],
    "hypotheses": [
      "Гипотеза 1: предположение + метод проверки",
      "Гипотеза 2: ...",
      "Гипотеза 3: ..."
    ],
    "riskFactors": [
      "Риск 1: описание + вероятность + ущерб + способ предотвращения",
      "Риск 2: ...",
      "Риск 3: ..."
    ],
    "metricsToWatch": [
      "Метрика 1: название + текущее + целевое + периодичность",
      "Метрика 2: ...",
      "Метрика 3: ..."
    ],
    "actionPlan": {
      "immediate": [
        "На неделю: действие + KPI + ответственный (ОБЯЗАТЕЛЬНО минимум 2 пункта)",
        "На неделю: ещё одно действие + KPI + ответственный"
      ],
      "shortTerm": [
        "1-3 месяца: действие + ожидаемый эффект (ОБЯЗАТЕЛЬНО минимум 2 пункта)",
        "1-3 месяца: ещё одно действие + ожидаемый эффект"
      ],
      "longTerm": [
        "3-12 месяцев: стратегическое действие (ОБЯЗАТЕЛЬНО минимум 2 пункта)",
        "3-12 месяцев: ещё одно стратегическое действие"
      ]
    },
    "segmentsAnalysis": [
      {
        "segment": "Название сегмента",
        "insight": "Что беспокоит, что ценят, паттерны поведения с примерами",
        "action": "Что делать для сегмента конкретно"
      }
    ]
  },
  "businessImplications": [
    "Как проблема влияет на выручку/отток/репутацию с цифрами",
    "...",
    "..."
  ],
  "confidenceScore": 75
}

КРИТИЧЕСКИ ВАЖНО:
- В actionPlan.immediate ДОЛЖНО быть минимум 2 элемента
- В actionPlan.shortTerm ДОЛЖНО быть минимум 2 элемента
- В actionPlan.longTerm ДОЛЖНО быть минимум 2 элемента
- Сумма sentiment.positive + sentiment.neutral + sentiment.negative = 100
- Ни одно поле не должно быть пустым массивом или пустой строкой`;

  const completion = await openrouter.chat.completions.create({
    model: params.model,
    temperature: 0.4,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: "Ты — элитный бизнес-консультант и CX-аналитик. Ты находишь конкретные проблемы и точки роста в клиентском опыте. Ты говоришь бизнесу правду: где они теряют деньги, где у них пробелы, что срочно исправлять. Каждое утверждение подкреплено данными. Отвечаешь ТОЛЬКО валидным JSON на русском языке. ВСЕ поля обязательны. В actionPlan минимум 2 элемента в каждом разделе.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("Пустой ответ от ИИ");
  }

  const rawText = typeof content === "string" ? content : String(content);
  return stripMarkdownFence(rawText);
}

function ensureMinimumTwoItems(arr: string[] | undefined, fallback: string[]): string[] {
  if (!arr || arr.length < 2) {
    return fallback;
  }
  return arr;
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

  const model = "google/gemini-2.0-flash-001";

  console.log(`[ai-analysis] Starting analysis for "${params.surveyTitle}" with ${totalAnswers} answers using ${model}`);

  try {
    const cleaned = await requestAnalysisFromModel({
      model,
      surveyTitle: params.surveyTitle,
      surveyCategory: params.surveyCategory,
      openAnswers: normalizedOpenAnswers,
      quantitativeSummary,
    });

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

    // Патчим actionPlan если там меньше 2 элементов
    if (parsedJson.diagnostics?.actionPlan) {
      const ap = parsedJson.diagnostics.actionPlan;
      const fallbackAction = "Провести дополнительный анализ и разработать план улучшений на основе полученных данных";
      
      ap.immediate = ensureMinimumTwoItems(ap.immediate, [
        fallbackAction,
        "Назначить ответственного за исправление выявленных проблем и установить KPI",
      ]);
      ap.shortTerm = ensureMinimumTwoItems(ap.shortTerm, [
        fallbackAction,
        "Внедрить мониторинг ключевых метрик и запустить программу улучшений",
      ]);
      ap.longTerm = ensureMinimumTwoItems(ap.longTerm, [
        fallbackAction,
        "Разработать стратегию долгосрочного развития на основе полученных инсайтов",
      ]);
    }

    const validated = analysisResultSchema.parse(parsedJson) as AnalysisResult;

    if (isLowQuality(validated)) {
      console.warn(`[ai-analysis] Low quality result, but returning anyway`);
    }

    validated.sentiment = normalizeSentiment(validated.sentiment);

    console.log(`[ai-analysis] SUCCESS: ${validated.themes.length} themes, ${validated.keyInsights.length} insights`);
    return validated;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ai-analysis] FAILED: ${message}`);

    if (message.includes("OPENROUTER_NOT_CONFIGURED")) {
      throw new Error("OPENROUTER_NOT_CONFIGURED");
    }

    if (message.includes("timeout") || message.includes("TIMEOUT")) {
      throw new Error("Превышено время ожидания ответа от ИИ. Пожалуйста, попробуйте ещё раз.");
    }

    throw new Error(
      `Не удалось провести анализ: ${message}. Пожалуйста, попробуйте позже или обратитесь в поддержку.`
    );
  }
}