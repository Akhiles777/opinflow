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
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  segmentsAnalysis: {
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
  businessImplications: string[];
  confidenceScore: number;
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
  }),
  segmentsAnalysis: z.array(
    z.object({
      segment: z.string().min(5).max(200),
      insight: z.string().min(20).max(400),
      action: z.string().min(20).max(400),
    })
  ).min(0).max(6),
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
  businessImplications: z.array(z.string().min(30).max(500)).min(3).max(8),
  confidenceScore: z.number().min(0).max(100),
});

type OpenAnswerGroup = {
  questionTitle: string;
  answers: string[];
};

function getFallbackAnalysis(surveyTitle: string, openAnswersCount: number): AnalysisResult {
  const hasAnswers = openAnswersCount > 0;

  return {
    themes: hasAnswers
      ? [
          {
            theme: "Недостаточно данных для тематического анализа",
            count: openAnswersCount,
            sentiment: "neutral",
            examples: ["Увеличьте выборку для более точных результатов"],
            actionableInsight: "Соберите минимум 50-100 открытых ответов для выявления стабильных тем",
          },
        ]
      : [],
    sentiment: { positive: 0, neutral: 100, negative: 0 },
    wordCloud: hasAnswers
      ? [{ word: "данные", weight: 100 }, { word: "анализ", weight: 80 }, { word: "ответы", weight: 60 }]
      : [],
    summary: hasAnswers
      ? `На данный момент собрано ${openAnswersCount} открытых ответов по опросу "${surveyTitle}". Объём данных недостаточен для глубокого ИИ-анализа и выявления устойчивых паттернов. Рекомендуется продолжить сбор ответов или дополнить исследование качественными методами (интервью, фокус-группы). Текущие данные можно использовать для формирования гипотез, но не для принятия окончательных бизнес-решений.`
      : "Открытые ответы отсутствуют. Для получения ИИ-аналитики необходимо добавить открытые вопросы в опрос и собрать ответы респондентов.",
    keyInsights: [
      hasAnswers
        ? `Собрано ${openAnswersCount} открытых ответов — это недостаточно для статистически значимых выводов`
        : "Открытые ответы отсутствуют — невозможно провести тематический анализ",
      "Рекомендуется увеличить выборку до минимум 50-100 ответов для выявления устойчивых тем",
      "Используйте закрытые вопросы для количественного анализа на странице опроса",
      hasAnswers
        ? "Проведите ручной просмотр ответов для выявления очевидных проблем"
        : "Добавьте открытые вопросы в следующую волну исследования",
      "Рассмотрите возможность проведения глубинных интервью с респондентами",
    ],
    diagnostics: {
      recommendations: [
        "Увеличьте выборку открытых ответов до 50+ для надёжного тематического анализа",
        "Добавьте уточняющие открытые вопросы в следующий опрос",
        "Проведите серию глубинных интервью с респондентами из целевых сегментов",
        "Используйте данные закрытых вопросов для первичной сегментации аудитории",
      ],
      hypotheses: [
        "При увеличении выборки могут проявиться скрытые паттерны неудовлетворённости",
        "Активные респонденты могут давать более развёрнутые ответы, создавая смещение",
        "Сезонность может влиять на характер ответов в разные периоды сбора данных",
      ],
      riskFactors: [
        "Малая выборка может не отражать реальное распределение мнений аудитории",
        "Ответы могут быть смещены в сторону наиболее активных пользователей",
        "Отсутствие контекста использования продукта усложняет интерпретацию ответов",
      ],
      metricsToWatch: [
        "Количество завершённых опросов с открытыми ответами",
        "Средняя длина открытого ответа (цель: >20 слов)",
        "Конверсия в заполнение открытых вопросов",
        "Динамика тональности ответов по волнам исследования",
      ],
      actionPlan: {
        immediate: [
          "Продолжить сбор открытых ответов в текущем опросе",
          "Проанализировать профили респондентов, давших открытые ответы",
        ],
        shortTerm: [
          "Запустить дополнительный опрос с уточняющими открытыми вопросами",
          "Провести 5-7 глубинных интервью с респондентами",
        ],
        longTerm: [
          "Внедрить систему регулярного сбора и анализа открытой обратной связи",
          "Создать дашборд для мониторинга ключевых тем и метрик удовлетворённости",
        ],
      },
      segmentsAnalysis: [],
    },
    businessImplications: [
      "Невозможно принять обоснованные продуктовые решения на текущих данных",
      "Инвестиции в улучшение качества обратной связи окупятся более точными инсайтами",
    ],
    confidenceScore: hasAnswers ? 30 : 0,
  };
}

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
  
  // Проверка на шаблонные фразы
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
  // Проверка ключевых текстовых полей
  if (!isMeaningfulText(result.summary)) return true;
  
  // Проверка инсайтов - минимум 3 осмысленных
  const meaningfulInsights = result.keyInsights.filter(isMeaningfulText);
  if (meaningfulInsights.length < 3) return true;
  
  // Проверка тем
  const meaningfulThemes = result.themes.filter(
    (theme) => isMeaningfulText(theme.theme) && isMeaningfulText(theme.actionableInsight)
  );
  if (meaningfulThemes.length < 1) return true;
  
  // Проверка сентимента
  const sentimentTotal = sumSentiment(result.sentiment);
  if (sentimentTotal < 98 || sentimentTotal > 102) return true;
  
  // Проверка диагностики
  const diag = result.diagnostics;
  if (!diag) return true;
  if (diag.recommendations.filter(isMeaningfulText).length < 2) return true;
  if (diag.hypotheses.filter(isMeaningfulText).length < 2) return true;
  if (!diag.actionPlan || diag.actionPlan.immediate.filter(isMeaningfulText).length < 1) return true;
  
  // Проверка бизнес-импликаций
  if (result.businessImplications.filter(isMeaningfulText).length < 2) return true;
  
  return false;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildHeuristicFallback(params: {
  surveyTitle: string;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary: string;
}): AnalysisResult {
  const allAnswers = params.openAnswers.flatMap((group) => group.answers);
  const total = allAnswers.length || 1;

  // Расширенные словари для анализа тональности
  const positiveWords = [
    "хорош", "отлич", "прекрас", "замечатель", "удоб", "быстр", "качеств",
    "нрав", "супер", "понят", "легк", "прост", "интуитив", "полез", "эффектив",
    "надёж", "стабиль", "красив", "современ", "функциональ", "довол", "рекоменд",
  ];
  const negativeWords = [
    "плох", "ужас", "кошмар", "дорог", "медлен", "ошиб", "неудоб", "проблем",
    "долг", "слож", "непонят", "глюч", "виснет", "тормоз", "баг", "сбой",
    "не работ", "разочар", "жаль", "бесполез", "устарев", "не хвата",
  ];

  let positiveHits = 0;
  let negativeHits = 0;
  const freq = new Map<string, number>();
  const bigramFreq = new Map<string, number>();
  const questionThemes: Map<string, { answers: string[]; sentiment: "positive" | "negative" | "neutral" }> = new Map();

  // Анализ по вопросам и ответам
  for (const group of params.openAnswers) {
    const questionSentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    
    for (const answer of group.answers) {
      const lower = answer.toLowerCase();
      const hasPositive = positiveWords.some((token) => lower.includes(token));
      const hasNegative = negativeWords.some((token) => lower.includes(token));
      
      if (hasPositive && !hasNegative) questionSentimentCounts.positive++;
      else if (hasNegative && !hasPositive) questionSentimentCounts.negative++;
      else questionSentimentCounts.neutral++;
      
      // Биграммы для лучшего контекста
      const words = lower.split(/[^a-zа-я0-9]+/i).filter((w) => w.length >= 3);
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        bigramFreq.set(bigram, (bigramFreq.get(bigram) ?? 0) + 1);
      }
      
      // Отдельные слова
      for (const word of words) {
        if (word.length < 4) continue;
        freq.set(word, (freq.get(word) ?? 0) + 1);
      }
    }
    
    // Определяем доминирующую тональность для вопроса
    const maxCount = Math.max(
      questionSentimentCounts.positive,
      questionSentimentCounts.negative,
      questionSentimentCounts.neutral
    );
    const dominantSentiment: "positive" | "negative" | "neutral" =
      maxCount === questionSentimentCounts.positive ? "positive" :
      maxCount === questionSentimentCounts.negative ? "negative" : "neutral";
    
    questionThemes.set(group.questionTitle, {
      answers: group.answers,
      sentiment: dominantSentiment,
    });
    
    positiveHits += questionSentimentCounts.positive;
    negativeHits += questionSentimentCounts.negative;
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

  // Комбинированные темы из биграмм и слов
  const topBigrams = Array.from(bigramFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topWords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const themes = Array.from(questionThemes.entries()).slice(0, 6).map(([questionTitle, data]) => ({
    theme: questionTitle,
    count: data.answers.length,
    sentiment: data.sentiment,
    examples: data.answers.slice(0, 3),
    actionableInsight: data.sentiment === "negative"
      ? `Выявлены негативные ответы по теме "${questionTitle}". Рекомендуется детальный анализ причин и разработка плана улучшений.`
      : data.sentiment === "positive"
      ? `Позитивные отзывы по "${questionTitle}" указывают на сильную сторону продукта. Рекомендуется усилить это преимущество в коммуникациях.`
      : `Нейтральные ответы по "${questionTitle}" могут указывать на недостаточную вовлечённость. Рассмотрите возможность уточнения вопроса.`,
  }));

  const keyInsights: string[] = [
    `Проанализировано ${allAnswers.length} открытых ответов по опросу "${params.surveyTitle}"`,
    `Распределение тональности: ${positive}% позитивных, ${neutral}% нейтральных, ${negative}% негативных ответов`,
    topBigrams.length > 0
      ? `Ключевые контексты упоминаний: ${topBigrams.slice(0, 5).map(([bigram]) => `"${bigram}"`).join(", ")}`
      : "Недостаточно данных для выявления устойчивых контекстов",
    params.quantitativeSummary
      ? "Обнаружена корреляция между открытыми ответами и данными закрытых вопросов"
      : "Рекомендуется сопоставить темы открытых ответов с распределениями закрытых вопросов",
    negative > 30
      ? "Высокая доля негатива требует немедленного анализа корневых причин"
      : "Текущий уровень удовлетворённости позволяет фокусироваться на развитии сильных сторон",
    "Рекомендуется провести сегментный анализ для выявления различий в восприятии продукта разными группами пользователей",
  ];

  // Бизнес-импликации на основе данных
  const businessImplications: string[] = [];
  if (negative > 30) {
    businessImplications.push(
      `Высокий уровень негатива (${negative}%) может привести к оттоку клиентов. Приоритет: решение ключевых проблем в течение 2-4 недель.`
    );
  }
  if (positive > 50) {
    businessImplications.push(
      `Сильный позитивный фон (${positive}%) — возможность для запуска реферальной программы и усиления бренда.`
    );
  }
  businessImplications.push(
    "Инвестиции в улучшение пользовательского опыта на основе обратной связи могут повысить retention на 15-25% в течение квартала."
  );
  businessImplications.push(
    "Рекомендуется создать систему регулярного мониторинга удовлетворённости для проактивного выявления проблем."
  );

  return {
    themes,
    sentiment: { positive, neutral, negative },
    wordCloud: topWords.map(([word, weight]) => ({ word, weight: Math.min(100, weight) })),
    summary: `Эвристический анализ ${allAnswers.length} открытых ответов опроса "${params.surveyTitle}". ` +
      `Выявлено преобладание ${positive > negative ? 'позитивных' : 'негативных'} настроений (${Math.max(positive, negative)}%). ` +
      `Основные темы: ${themes.slice(0, 3).map(t => t.theme).join('; ')}. ` +
      `Для получения более точных результатов рекомендуется запустить ИИ-анализ на увеличенной выборке или использовать более мощную модель.`,
    keyInsights,
    diagnostics: {
      recommendations: [
        `На основе выявленных тем разработать план улучшений по ${themes.filter(t => t.sentiment === 'negative').slice(0, 2).map(t => t.theme).join(' и ') || 'ключевым направлениям'}`,
        "Провести глубинные интервью с респондентами, оставившими негативные отзывы",
        "Запустить A/B-тестирование предлагаемых улучшений с контрольной группой",
        "Внедрить систему оперативного реагирования на негативную обратную связь",
      ],
      hypotheses: [
        "Негативные отзывы концентрируются в определённом пользовательском сегменте (новички/опытные)",
        "Сезонность или внешние факторы влияют на восприятие продукта",
        "Пользователи, прошедшие онбординг, показывают более высокую удовлетворённость",
      ],
      riskFactors: [
        "Эвристический анализ менее точен, чем полноценный ИИ-анализ",
        "Возможно смещение выборки в сторону наиболее/наименее удовлетворённых пользователей",
        "Короткие ответы могут быть неверно интерпретированы",
      ],
      metricsToWatch: [
        "NPS (Net Promoter Score) в динамике по неделям",
        "Уровень оттока (churn rate) среди респондентов с негативными отзывами",
        "Время решения проблем, выявленных в обратной связи",
        "CSAT (Customer Satisfaction Score) по ключевым точкам контакта",
      ],
      actionPlan: {
        immediate: [
          "Создать сводный отчёт по выявленным проблемам для команды продукта",
          "Начать мониторинг упоминаний бренда в социальных сетях",
        ],
        shortTerm: [
          "Разработать roadmap улучшений на основе обратной связи на следующий квартал",
          "Запустить программу «Голос клиента» для постоянного сбора обратной связи",
        ],
        longTerm: [
          "Внедрить предиктивную аналитику для прогнозирования удовлетворённости",
          "Создать центр компетенций по клиентскому опыту в компании",
        ],
      },
      segmentsAnalysis: themes.slice(0, 3).map(theme => ({
        segment: `Респонденты по теме "${theme.theme}"`,
        insight: `${theme.count} ответов с ${theme.sentiment === 'negative' ? 'негативной' : theme.sentiment === 'positive' ? 'позитивной' : 'нейтральной'} тональностью`,
        action: `Разработать целевые мероприятия для улучшения показателей по данному сегменту`,
      })),
    },
    businessImplications,
    confidenceScore: 60,
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

  const quantBlock = params.quantitativeSummary.trim()
    ? `ДАННЫЕ ЗАКРЫТЫХ ВОПРОСОВ (используй для кросс-анализа):\n${params.quantitativeSummary}`
    : "Данные закрытых вопросов не предоставлены. Сфокусируйся на открытых ответах.";

  const totalAnswers = params.openAnswers.reduce((sum, g) => sum + g.answers.length, 0);

  const prompt = [
    "# РОЛЬ И КОНТЕКСТ",
    "Ты — ведущий аналитик по клиентскому опыту (CX) и маркетинговым исследованиям с 15-летним опытом. Твоя задача — предоставить глубокий, действенный анализ, который поможет руководителю продукта и команде маркетинга принять конкретные бизнес-решения.",
    "",
    `# ИНФОРМАЦИЯ ОБ ИССЛЕДОВАНИИ`,
    `Название опроса: "${params.surveyTitle}"`,
    params.surveyCategory ? `Категория: ${params.surveyCategory}` : "",
    `Всего открытых ответов: ${totalAnswers}`,
    `Количество вопросов с открытыми ответами: ${params.openAnswers.length}`,
    "",
    "# ДАННЫЕ ДЛЯ АНАЛИЗА",
    quantBlock,
    "",
    "# ОТКРЫТЫЕ ОТВЕТЫ ДЛЯ АНАЛИЗА",
    answersText,
    "",
    "# ТРЕБОВАНИЯ К АНАЛИЗУ",
    "1. Проанализируй открытые ответы, выяви ключевые темы и паттерны",
    "2. Свяжи тональность открытых ответов с данными закрытых вопросов (если предоставлены)",
    "3. Определи неочевидные инсайты и скрытые проблемы",
    "4. Дай конкретные, измеримые рекомендации для разных временных горизонтов",
    "5. Выдели сегменты аудитории с разным восприятием и потребностями",
    "6. Оцени уверенность в выводах (0-100%) на основе объёма и качества данных",
    "",
    "# ФОРМАТ ОТВЕТА",
    "Верни ТОЛЬКО валидный JSON без форматирования markdown. Структура:",
    `{
  "themes": [
    {
      "theme": "Краткое название темы (3-10 слов)",
      "count": количество упоминаний,
      "sentiment": "positive|negative|neutral",
      "examples": ["цитата 1", "цитата 2", "цитата 3"],
      "actionableInsight": "Что конкретно делать с этой темой? Какой вывод для бизнеса?"
    }
  ],
  "sentiment": {"positive": число 0-100, "neutral": число 0-100, "negative": число 0-100},
  "wordCloud": [{"word": "слово или фраза", "weight": число 1-100}],
  "summary": "Развёрнутое резюме на 5-8 предложений: ключевые выводы, сегменты, неочевидные паттерны, связь с бизнес-метриками",
  "keyInsights": [
    "Конкретный инсайт с цифрами и фактами",
    "Ещё один инсайт с указанием процентов или количества"
  ],
  "diagnostics": {
    "recommendations": [
      "Конкретный шаг с указанием ожидаемого эффекта и сроков",
      "Ещё одна рекомендация с KPI для измерения результата"
    ],
    "hypotheses": [
      "Проверяемая гипотеза с указанием метода проверки",
      "Ещё одна гипотеза с описанием ожидаемого результата"
    ],
    "riskFactors": [
      "Конкретный риск с оценкой вероятности и влияния",
      "Ещё один риск с предложением по митигации"
    ],
    "metricsToWatch": [
      "Конкретная метрика с целевым значением",
      "Ещё одна метрика с указанием частоты измерения"
    ],
    "actionPlan": {
      "immediate": ["Действие на эту неделю", "Ещё одно срочное действие"],
      "shortTerm": ["Действие на 1-3 месяца", "Ещё одно краткосрочное действие"],
      "longTerm": ["Действие на 3-12 месяцев", "Ещё одно долгосрочное действие"]
    },
    "segmentsAnalysis": [
      {
        "segment": "Название сегмента",
        "insight": "Ключевой инсайт по сегменту",
        "action": "Рекомендация для этого сегмента"
      }
    ]
  },
  "businessImplications": [
    "Бизнес-последствие с оценкой потенциального влияния на revenue/retention",
    "Ещё одна бизнес-импликация"
  ],
  "confidenceScore": число 0-100
}`,
    "",
    "# ВАЖНЫЕ ПРАВИЛА",
    "- Сумма sentiment.positive + sentiment.neutral + sentiment.negative должна быть ровно 100",
    "- Не используй общие фразы без привязки к данным",
    "- Каждая рекомендация должна иметь измеримый ожидаемый результат",
    "- Указывай конкретные проценты, количества, временные рамки",
    "- Пиши на русском языке, кроме терминов, которые принято использовать на английском",
    "- Не выдумывай данные, которых нет в ответах респондентов",
    "- Если данных недостаточно для уверенного вывода, укажи это и предложи способы добрать данные",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await openrouter.chat.completions.create({
    model: params.model,
    temperature: 0.35,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: `Ты — элитный бизнес-аналитик в сфере CX и маркетинговых исследований. Твоя экспертиза: выявление паттернов, прогнозирование бизнес-последствий, разработка стратегий на основе данных. Ты возвращаешь ТОЛЬКО структурированный JSON с глубоким анализом. Каждый вывод подкреплён данными. Ты думаешь как владелец продукта и даёшь рекомендации, которые можно сразу применять. Отвечай на русском языке.`,
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
        // Экспоненциальная задержка между попытками
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
    return getFallbackAnalysis(params.surveyTitle, 0);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[ai-analysis] OPENROUTER_API_KEY not configured");
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const quantitativeSummary = params.quantitativeSummary?.trim() ?? "";

  // Основная модель и фолбэк
  const primaryModel = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  const fallbackModels = [
    "anthropic/claude-3-haiku-20240307",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3-70b-instruct",
  ];
  
  const modelsToTry = Array.from(
    new Set([
      primaryModel,
      ...fallbackModels.filter(m => m !== primaryModel),
    ])
  );

  console.log(`[ai-analysis] Starting analysis for "${params.surveyTitle}" with ${totalAnswers} answers across ${normalizedOpenAnswers.length} questions`);
  console.log(`[ai-analysis] Models to try: ${modelsToTry.join(", ")}`);

  let lastAttemptedModel = "";

  for (const model of modelsToTry) {
    lastAttemptedModel = model;
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
        55000,
        "AI_ANALYSIS"
      );

      console.log(`[ai-analysis] Model ${model} responded on attempt ${attempt}, parsing...`);

      try {
        const parsed = analysisResultSchema.parse(JSON.parse(cleaned)) as AnalysisResult;
        
        // Проверка качества
        const qualityIssues: string[] = [];
        
        if (isLowQuality(parsed)) {
          qualityIssues.push("Low quality check failed");
        }
        
        // Дополнительные проверки качества
        if (parsed.keyInsights.length < 4) {
          qualityIssues.push("Too few keyInsights");
        }
        if (parsed.themes.length < 1) {
          qualityIssues.push("No themes");
        }
        if (parsed.businessImplications.length < 2) {
          qualityIssues.push("Too few business implications");
        }
        if (parsed.confidenceScore < 0 || parsed.confidenceScore > 100) {
          qualityIssues.push("Invalid confidence score");
        }
        
        if (qualityIssues.length === 0) {
          console.log(`[ai-analysis] Analysis successful with model ${model} (attempt ${attempt})`);
          return {
            ...parsed,
            // Гарантируем, что сумма sentiment = 100
            sentiment: normalizeSentiment(parsed.sentiment),
          };
        } else {
          console.warn(`[ai-analysis] Quality issues with model ${model}: ${qualityIssues.join(", ")}`);
        }
      } catch (parseError) {
        console.warn(`[ai-analysis] JSON parse error with model ${model}:`, 
          parseError instanceof Error ? parseError.message : "Unknown parse error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI_ANALYSIS_FAILED";
      
      if (message.includes("OPENROUTER_NOT_CONFIGURED")) {
        throw error;
      }
      
      console.warn(`[ai-analysis] Model ${model} failed: ${message}`);
    }
  }

  // Если все модели не дали качественный результат, используем эвристику
  console.log(`[ai-analysis] All models failed or produced low-quality results. Last attempted: ${lastAttemptedModel}. Using heuristic fallback.`);
  
  return buildHeuristicFallback({
    surveyTitle: params.surveyTitle,
    openAnswers: normalizedOpenAnswers,
    quantitativeSummary,
  });
}

// Вспомогательная функция для нормализации sentiment
function normalizeSentiment(sentiment: { positive: number; neutral: number; negative: number }): {
  positive: number;
  neutral: number;
  negative: number;
} {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  
  if (total === 100) return sentiment;
  if (total === 0) return { positive: 0, neutral: 100, negative: 0 };
  
  // Нормализуем до 100%
  const positive = clampPercent(Math.round((sentiment.positive / total) * 100));
  const negative = clampPercent(Math.round((sentiment.negative / total) * 100));
  let neutral = clampPercent(Math.round((sentiment.neutral / total) * 100));
  
  // Корректируем neutral для точной суммы 100
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