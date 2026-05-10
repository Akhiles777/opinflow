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

function buildHeuristicFallback(params: {
  surveyTitle: string;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary: string;
}): AnalysisResult {
  const allAnswers = params.openAnswers.flatMap((group) => group.answers);
  const totalAnswers = allAnswers.length || 1;

  // Расширенная классификация слов по категориям
  const wordCategories = {
    positive: {
      strong: ["отлично", "превосходно", "великолепно", "потрясающе", "идеально", "супер", "замечательно", "восхитительно"],
      service: ["быстро", "оперативно", "вежливо", "профессионально", "качественно", "вовремя", "аккуратно"],
      product: ["вкусно", "свежее", "горячее", "удобно", "красиво", "стильно", "надёжно", "функционально"],
      general: ["нравится", "доволен", "рекомендую", "хороший", "лучший", "любимый", "постоянный"],
    },
    negative: {
      strong: ["ужасно", "отвратительно", "кошмар", "безнадёжно", "никуда не годится", "разочарован"],
      service: ["долго", "медленно", "опаздывает", "хамят", "невнимательно", "некомпетентно", "игнорируют"],
      product: ["холодное", "невкусное", "испорченное", "грязное", "сломанное", "некачественное", "просроченное"],
      general: ["дорого", "проблема", "ошибка", "неудобно", "сложно", "непонятно", "хуже", "никогда"],
    },
    improvement: ["улучшить", "добавить", "изменить", "исправить", "пересмотреть", "обновить", "доработать", "внедрить"],
    expectations: ["хотелось", "ожидал", "надеялся", "рассчитывал", "предполагал", "планировал"],
  };

  // Инициализация структур анализа
  const answerAnalysis = allAnswers.map(answer => {
    const lower = answer.toLowerCase();
    const words = lower.split(/[^a-zа-я0-9]+/i).filter(w => w.length >= 3);
    
    let positiveScore = 0;
    let negativeScore = 0;
    const matchedCategories: string[] = [];
    const matchedWords: string[] = [];
    
    // Подсчёт тональности
    for (const [category, wordLists] of Object.entries(wordCategories.positive)) {
      for (const word of wordLists) {
        if (lower.includes(word)) {
          positiveScore += category === "strong" ? 3 : category === "service" || category === "product" ? 2 : 1;
          matchedCategories.push(`+${category}`);
          matchedWords.push(word);
        }
      }
    }
    
    for (const [category, wordLists] of Object.entries(wordCategories.negative)) {
      for (const word of wordLists) {
        if (lower.includes(word)) {
          negativeScore += category === "strong" ? 3 : category === "service" || category === "product" ? 2 : 1;
          matchedCategories.push(`-${category}`);
          matchedWords.push(word);
        }
      }
    }
    
    // Проверка на предложения по улучшению
    const hasImprovements = wordCategories.improvement.some(w => lower.includes(w)) ||
                           wordCategories.expectations.some(w => lower.includes(w));
    
    const sentiment = positiveScore > negativeScore ? "positive" as const :
                     negativeScore > positiveScore ? "negative" as const :
                     "neutral" as const;
    
    return {
      original: answer,
      words,
      positiveScore,
      negativeScore,
      sentiment,
      hasImprovements,
      matchedCategories,
      matchedWords,
      length: answer.length,
    };
  });

  // Группировка ответов по вопросам с глубоким анализом
  const questionAnalysis = params.openAnswers.map(group => {
    const answers = group.answers.map(a => 
      answerAnalysis.find(aa => aa.original === a)!
    ).filter(Boolean);
    
    const totalQ = answers.length;
    const positiveCount = answers.filter(a => a.sentiment === "positive").length;
    const negativeCount = answers.filter(a => a.sentiment === "negative").length;
    const neutralCount = answers.filter(a => a.sentiment === "neutral").length;
    const improvementCount = answers.filter(a => a.hasImprovements).length;
    
    // Выделение ключевых слов для вопроса
    const questionWords = new Map<string, number>();
    answers.forEach(a => {
      a.matchedWords.forEach(w => {
        questionWords.set(w, (questionWords.get(w) ?? 0) + 1);
      });
    });
    
    const topWords = Array.from(questionWords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    return {
      questionTitle: group.questionTitle,
      answers,
      totalQ,
      positiveCount,
      negativeCount,
      neutralCount,
      improvementCount,
      topWords,
      dominantSentiment: positiveCount > negativeCount ? "positive" as const :
                        negativeCount > positiveCount ? "negative" as const :
                        "neutral" as const,
      // Анализ контекста вопроса
      isProblemArea: negativeCount > totalQ * 0.3 || improvementCount > totalQ * 0.5,
      isStrengthArea: positiveCount > totalQ * 0.6,
      needsAttention: improvementCount > 0 || negativeCount > 0,
    };
  });

  // Общий сентимент
  const totalPositive = answerAnalysis.filter(a => a.sentiment === "positive").length;
  const totalNegative = answerAnalysis.filter(a => a.sentiment === "negative").length;
  const totalNeutral = answerAnalysis.filter(a => a.sentiment === "neutral").length;
  
  let positive = clampPercent((totalPositive / totalAnswers) * 100);
  let negative = clampPercent((totalNegative / totalAnswers) * 100);
  let neutral = clampPercent((totalNeutral / totalAnswers) * 100);
  
  // Корректировка для суммы 100%
  const total = positive + negative + neutral;
  if (total !== 100) {
    neutral += (100 - total);
    neutral = Math.max(0, neutral);
  }

  // Формирование тем на основе вопросов
  const themes = questionAnalysis.map(qa => {
    const examples = qa.answers
      .filter(a => a.sentiment === qa.dominantSentiment)
      .slice(0, 3)
      .map(a => a.original);
    
    let actionableInsight = "";
    if (qa.isProblemArea) {
      actionableInsight = `Критическая зона: ${qa.negativeCount} из ${qa.totalQ} респондентов (${clampPercent((qa.negativeCount/qa.totalQ)*100)}%) недовольны. ` +
        `Ключевые проблемы: ${qa.topWords.join(", ")}. ` +
        `Необходим срочный план улучшений с конкретными KPI на ближайшие 2 недели.`;
    } else if (qa.isStrengthArea) {
      actionableInsight = `Сильная сторона: ${qa.positiveCount} из ${qa.totalQ} респондентов (${clampPercent((qa.positiveCount/qa.totalQ)*100)}%) довольны. ` +
        `Ключевые преимущества: ${qa.topWords.join(", ")}. ` +
        `Рекомендуется усилить это направление в маркетинговых коммуникациях и программах лояльности.`;
    } else if (qa.needsAttention && qa.improvementCount > 0) {
      actionableInsight = `Зона роста: ${qa.improvementCount} респондентов предложили улучшения. ` +
        `Основные направления: ${qa.topWords.join(", ")}. ` +
        `Проведите A/B-тестирование предложенных изменений в течение месяца.`;
    } else {
      actionableInsight = `Стабильная зона: мнения распределены равномерно. ` +
        `Рекомендуется углубить исследование через дополнительные вопросы или интервью для выявления скрытых потребностей.`;
    }
    
    return {
      theme: qa.questionTitle,
      count: qa.totalQ,
      sentiment: qa.dominantSentiment,
      examples: examples.length > 0 ? examples : qa.answers.slice(0, 3).map(a => a.original),
      actionableInsight,
    };
  });

  // Детальный анализ текста для word cloud
  const wordFrequency = new Map<string, number>();
  const contextPhrases = new Map<string, number>();
  
  allAnswers.forEach(answer => {
    const lower = answer.toLowerCase();
    const words = lower.split(/[^a-zа-я0-9]+/i).filter(w => w.length >= 4);
    
    // Отдельные слова
    words.forEach(word => {
      wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
    });
    
    // Фразы из 2-3 слов для контекста
    for (let i = 0; i < words.length - 1; i++) {
      const phrase2 = words.slice(i, i + 2).join(" ");
      contextPhrases.set(phrase2, (contextPhrases.get(phrase2) ?? 0) + 1);
      
      if (i < words.length - 2) {
        const phrase3 = words.slice(i, i + 3).join(" ");
        contextPhrases.set(phrase3, (contextPhrases.get(phrase3) ?? 0) + 1);
      }
    }
  });

  const wordCloud = Array.from(wordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, weight: Math.min(100, Math.round((count / totalAnswers) * 100)) }));

  // Формирование глубокого summary
  const problemAreas = questionAnalysis.filter(q => q.isProblemArea);
  const strengthAreas = questionAnalysis.filter(q => q.isStrengthArea);
  const improvementAreas = questionAnalysis.filter(q => q.improvementCount > 0);
  
  let summary = `Детальный анализ ${totalAnswers} открытых ответов опроса "${params.surveyTitle}". `;
  
  if (positive > negative) {
    summary += `Общая тональность положительная (${positive}% позитивных против ${negative}% негативных ответов). `;
  } else if (negative > positive) {
    summary += `Общая тональность негативная (${negative}% негативных против ${positive}% позитивных ответов) — требуется немедленное внимание. `;
  } else {
    summary += `Тональность сбалансирована (${positive}% позитивных, ${negative}% негативных, ${neutral}% нейтральных). `;
  }
  
  if (strengthAreas.length > 0) {
    summary += `Сильные стороны: ${strengthAreas.map(q => q.questionTitle).join(", ")}. `;
  }
  
  if (problemAreas.length > 0) {
    summary += `Проблемные зоны: ${problemAreas.map(q => q.questionTitle).join(", ")}. `;
  }
  
  if (improvementAreas.length > 0) {
    summary += `${improvementAreas.length} направлений требуют улучшений. `;
    summary += `Респонденты чаще всего упоминают: ${wordCloud.slice(0, 5).map(w => w.word).join(", ")}. `;
  }
  
  if (totalAnswers < 20) {
    summary += `Примечание: выборка из ${totalAnswers} ответов позволяет выявить основные тенденции, но для статистически значимых выводов рекомендуется увеличить выборку до 30+ ответов.`;
  } else {
    summary += `Объём выборки (${totalAnswers} ответов) достаточен для выявления устойчивых паттернов и принятия предварительных решений.`;
  }

  // Формирование детальных инсайтов
  const keyInsights: string[] = [
    `Проанализировано ${totalAnswers} открытых ответа по ${questionAnalysis.length} вопросам в опросе "${params.surveyTitle}"`,
    `Общая тональность: ${positive}% позитивных, ${neutral}% нейтральных, ${negative}% негативных ответов`,
  ];

  if (problemAreas.length > 0) {
    keyInsights.push(
      `Выявлены проблемные зоны: ${problemAreas.map(q => 
        `${q.questionTitle} (${q.negativeCount} из ${q.totalQ} негативных)`
      ).join("; ")}`
    );
  }

  if (strengthAreas.length > 0) {
    keyInsights.push(
      `Сильные стороны: ${strengthAreas.map(q => 
        `${q.questionTitle} (${q.positiveCount} из ${q.totalQ} положительных)`
      ).join("; ")}`
    );
  }

  if (improvementAreas.length > 0) {
    keyInsights.push(
      `${improvementAreas.length} из ${questionAnalysis.length} направлений имеют конкретные предложения по улучшению от респондентов`
    );
  }

  if (wordCloud.length > 0) {
    keyInsights.push(
      `Ключевые темы и слова: ${wordCloud.slice(0, 7).map(w => `"${w.word}" (${w.weight}%)`).join(", ")}`
    );
  }

  // Конкретные предложения по улучшению
  const allImprovementWords = answerAnalysis
    .filter(a => a.hasImprovements)
    .flatMap(a => a.words)
    .filter(w => w.length > 5);
  
  if (allImprovementWords.length > 0) {
    const improvementThemes = Array.from(new Set(allImprovementWords)).slice(0, 5);
    keyInsights.push(
      `Основные направления для улучшений: ${improvementThemes.join(", ")}`
    );
  }

  keyInsights.push(
    totalAnswers >= 20 
      ? "Рекомендуется провести сегментный анализ для выявления различий в восприятии между группами пользователей"
      : "Для более точных выводов рекомендуется увеличить выборку до 30+ ответов и провести дополнительные интервью"
  );

  // Бизнес-импликации
  const businessImplications: string[] = [];
  
  if (negative > 30) {
    businessImplications.push(
      `Критический уровень негатива (${negative}%) может привести к оттоку клиентов и снижению NPS. Приоритет: решение ключевых проблем в течение 2-4 недель для предотвращения репутационных потерь.`
    );
  }
  
  if (strengthAreas.length > 0) {
    businessImplications.push(
      `Сильные стороны (${strengthAreas.map(s => s.questionTitle).join(", ")}) — основа для дифференциации от конкурентов и усиления бренда. Рекомендуется выделить бюджет на развитие этих направлений.`
    );
  }
  
  if (improvementAreas.length > 0) {
    businessImplications.push(
      `Наличие конкретных предложений от ${improvementAreas.reduce((sum, q) => sum + q.improvementCount, 0)} респондентов — возможность для быстрых улучшений с измеримым эффектом в течение 1-2 месяцев.`
    );
  }
  
  businessImplications.push(
    "Инвестиции в улучшение клиентского опыта на основе полученных данных могут повысить retention на 15-25% и увеличить средний чек на 10-15% в течение квартала."
  );

  // Формирование диагностики
  const diagnostics: AnalysisDiagnostics = {
    recommendations: [
      problemAreas.length > 0
        ? `Разработать план немедленных действий по улучшению проблемных зон: ${problemAreas.map(q => q.questionTitle).join(", ")}`
        : "Продолжить мониторинг текущих показателей и развивать сильные стороны",
      improvementAreas.length > 0
        ? "Создать рабочую группу для внедрения предложений респондентов в течение 2 недель"
        : "Провести дополнительные исследования для выявления скрытых потребностей",
      "Настроить регулярный сбор обратной связи (еженедельно/ежемесячно) для отслеживания динамики",
      "Внедрить систему быстрого реагирования на негативные отзывы (в течение 24 часов)",
      totalAnswers < 30
        ? "Увеличить выборку до 30-50 ответов для повышения статистической значимости"
        : "Провести A/B-тестирование предлагаемых улучшений на контрольной группе",
    ],
    hypotheses: [
      problemAreas.length > 0
        ? `Проблемы в зонах ${problemAreas.map(q => q.questionTitle).join(", ")} могут быть связаны с конкретными этапами клиентского пути`
        : "Отсутствие явных проблем может указывать на недостаточную детализацию вопросов",
      "Разные сегменты пользователей (новые vs постоянные) могут иметь противоположное восприятие",
      strengthAreas.length > 0
        ? `Высокая удовлетворённость в зонах ${strengthAreas.map(q => q.questionTitle).join(", ")} может быть конкурентным преимуществом`
        : "Отсутствие явных сильных сторон требует дополнительного анализа",
      improvementAreas.length > 0
        ? "Активные респонденты, предлагающие улучшения, — потенциальные адвокаты бренда при внедрении их предложений"
        : "Низкая вовлечённость в предложения может говорить о пассивности аудитории",
    ],
    riskFactors: [
      totalAnswers < 30
        ? `Малая выборка (${totalAnswers} ответов) — выводы могут быть нерепрезентативны`
        : "Возможно смещение выборки в сторону наиболее активных пользователей",
      "Эвристический анализ может не учитывать сарказм и сложные контексты",
      "Отсутствие демографических данных ограничивает возможности сегментации",
      "Единовременный срез не показывает динамику изменений во времени",
    ],
    metricsToWatch: [
      "NPS (Net Promoter Score) — целевой показатель: +20 и выше",
      "CSAT (Customer Satisfaction) — отслеживать еженедельно",
      "Уровень оттока клиентов (Churn Rate) — целевое снижение на 5-10%",
      "Время реакции на негативные отзывы — целевой показатель: < 24 часов",
      "Конверсия в повторные покупки — отслеживать по сегментам",
    ],
    actionPlan: {
      immediate: [
        problemAreas.length > 0
          ? `Провести экстренное совещание команды по проблемным зонам: ${problemAreas.map(q => q.questionTitle).join(", ")}`
          : "Подготовить отчёт для руководства с текущими выводами",
        "Связаться с респондентами, оставившими наиболее критичные отзывы",
        "Проверить работу проблемных участков/процессов",
      ],
      shortTerm: [
        "Разработать и согласовать план улучшений на основе предложений респондентов",
        "Запустить пилотные изменения в 1-2 наиболее критичных зонах",
        "Обучить персонал работе с обратной связью и стандартам качества",
        "Внедрить систему мониторинга ключевых метрик в реальном времени",
      ],
      longTerm: [
        "Создать программу непрерывного улучшения клиентского опыта (CEM)",
        "Внедрить предиктивную аналитику для прогнозирования удовлетворённости",
        "Разработать программу лояльности с учётом выявленных предпочтений",
        "Построить систему регулярных исследований (ежеквартальных/ежемесячных)",
      ],
    },
    segmentsAnalysis: questionAnalysis.slice(0, 4).map(qa => ({
      segment: qa.questionTitle,
      insight: `${qa.totalQ} ответов: ${qa.positiveCount} позитивных, ${qa.negativeCount} негативных, ${qa.neutralCount} нейтральных. ${
        qa.improvementCount > 0 ? `${qa.improvementCount} респондентов предложили улучшения.` : ""
      } Ключевые слова: ${qa.topWords.slice(0, 3).join(", ")}`,
      action: qa.isProblemArea
        ? `Срочно разработать план исправления. Целевой KPI: снижение негатива на 50% за 2 недели.`
        : qa.isStrengthArea
        ? `Усилить направление в маркетинге. Целевой KPI: увеличение позитивных отзывов на 20%.`
        : qa.needsAttention
        ? `Провести A/B-тест улучшений. Целевой KPI: рост удовлетворённости на 15%.`
        : `Мониторить показатели. Целевой KPI: удержание текущего уровня.`,
    })),
  };

  return {
    themes,
    sentiment: { positive, neutral, negative },
    wordCloud,
    summary,
    keyInsights,
    diagnostics,
    businessImplications,
    confidenceScore: totalAnswers >= 30 ? 75 : totalAnswers >= 15 ? 60 : 45,
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

  const prompt = `Ты — ведущий аналитик по клиентскому опыту (CX) с 15-летним опытом работы с крупными компаниями. Твоя специализация — превращать сырые данные опросов в конкретные бизнес-решения, которые напрямую влияют на revenue и retention.

# ИНФОРМАЦИЯ ОБ ИССЛЕДОВАНИИ
Название опроса: "${params.surveyTitle}"
${params.surveyCategory ? `Категория бизнеса: ${params.surveyCategory}` : ""}
Всего открытых ответов: ${totalAnswers}
Количество вопросов: ${params.openAnswers.length}

${params.quantitativeSummary.trim() ? `# ДАННЫЕ ЗАКРЫТЫХ ВОПРОСОВ\n${params.quantitativeSummary}\n` : ""}

# ОТКРЫТЫЕ ОТВЕТЫ
${answersText}

# ЗАДАЧА
Проведи глубокий анализ открытых ответов, учитывая данные закрытых вопросов. Твоя цель — дать руководителю продукта конкретные, измеримые рекомендации, которые можно внедрить завтра.

Обязательно:
1. Выяви ВСЕ темы, даже если они упоминаются 1-2 раза
2. Для каждой темы дай КОНКРЕТНЫЙ action plan
3. Свяжи тональность открытых ответов с данными закрытых вопросов
4. Выдели сегменты аудитории с разными потребностями
5. Дай численные оценки и KPI для каждой рекомендации
6. Укажи временные рамки для каждого действия
7. Оцени риски и дай план их минимизации

# ФОРМАТ ОТВЕТА
Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`json):

{
  "themes": [
    {
      "theme": "Название темы (5-10 слов, отражающее суть)",
      "count": количество упоминаний,
      "sentiment": "positive|negative|neutral",
      "examples": ["цитата 1 (полная, без сокращений)", "цитата 2", "цитата 3"],
      "actionableInsight": "Конкретное действие: что делать, кто ответственный, в какие сроки, какой KPI"
    }
  ],
  "sentiment": {
    "positive": число 0-100,
    "neutral": число 0-100,
    "negative": число 0-100
  },
  "wordCloud": [
    {"word": "слово или фраза из 2-3 слов", "weight": число 1-100}
  ],
  "summary": "Развёрнутое резюме (8-12 предложений): контекст бизнеса, ключевые находки, скрытые паттерны, корреляции с закрытыми вопросами, потенциальное влияние на бизнес-метрики, конкретные числа и проценты",
  "keyInsights": [
    "Инсайт 1: конкретный факт + цифры + бизнес-последствия",
    "Инсайт 2: ...",
    ...
    (5-10 инсайтов)
  ],
  "diagnostics": {
    "recommendations": [
      "Рекомендация 1: действие + ожидаемый эффект в цифрах + срок + ответственный",
      ...
      (3-6 рекомендаций)
    ],
    "hypotheses": [
      "Гипотеза 1: предположение + метод проверки + ожидаемый результат",
      ...
      (3-6 гипотез)
    ],
    "riskFactors": [
      "Риск 1: описание + вероятность (низкая/средняя/высокая) + влияние + способ минимизации",
      ...
      (3-5 рисков)
    ],
    "metricsToWatch": [
      "Метрика 1: название + текущее значение (если известно) + целевое значение + частота измерения",
      ...
      (4-7 метрик)
    ],
    "actionPlan": {
      "immediate": ["Действие на эту неделю (конкретное, с KPI)", ...],
      "shortTerm": ["Действие на 1-3 месяца (конкретное, с KPI)", ...],
      "longTerm": ["Действие на 3-12 месяцев (конкретное, с KPI)", ...]
    },
    "segmentsAnalysis": [
      {
        "segment": "Название сегмента (на основе паттернов в ответах)",
        "insight": "Что отличает этот сегмент (с цифрами)",
        "action": "Что делать для этого сегмента (конкретно, с KPI)"
      },
      ...
    ]
  },
  "businessImplications": [
    "Последствие для бизнеса 1: потенциальное влияние на revenue/costs/retention в цифрах",
    ...
    (3-6 импликаций)
  ],
  "confidenceScore": число 0-100
}

# ПРАВИЛА
- Сумма sentiment ДОЛЖНА быть ровно 100
- Каждая рекомендация должна иметь измеримый KPI
- Не пиши общие фразы типа "всё хорошо" или "нужно улучшить"
- Указывай конкретные проценты, суммы, сроки
- Пиши так, как будто от этого зависит твой годовой бонус
- Анализируй ВСЕ ответы, не игнорируй единичные, но важные комментарии
- Если видишь противоречия — укажи их и предложи объяснение
- Учитывай контекст бизнеса (${params.surveyCategory || params.surveyTitle})`;

  const completion = await openrouter.chat.completions.create({
    model: params.model,
    temperature: 0.35,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: "Ты — элитный бизнес-аналитик уровня Partner в McKinsey. Твоя экспертиза — превращать качественные данные в количественные бизнес-решения. Каждый твой ответ содержит конкретные цифры, сроки и KPI. Ты не используешь water-down language и общие фразы. Ты даёшь рекомендации, которые генерят ROI. Отвечаешь ТОЛЬКО JSON на русском языке (термины можно на английском).",
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
    return getFallbackAnalysis(params.surveyTitle, 0);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[ai-analysis] OPENROUTER_API_KEY not configured");
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const quantitativeSummary = params.quantitativeSummary?.trim() ?? "";

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

  console.log(`[ai-analysis] Starting analysis for "${params.surveyTitle}" with ${totalAnswers} answers`);
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
        
        if (!isLowQuality(parsed)) {
          console.log(`[ai-analysis] Analysis successful with model ${model}`);
          return {
            ...parsed,
            sentiment: normalizeSentiment(parsed.sentiment),
          };
        } else {
          console.warn(`[ai-analysis] Low quality result from model ${model}`);
        }
      } catch (parseError) {
        console.warn(`[ai-analysis] Parse error with model ${model}:`, 
          parseError instanceof Error ? parseError.message : "Unknown error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI_ANALYSIS_FAILED";
      
      if (message.includes("OPENROUTER_NOT_CONFIGURED")) {
        throw error;
      }
      
      console.warn(`[ai-analysis] Model ${model} failed: ${message}`);
    }
  }

  // Если все модели не дали результат, используем УЛУЧШЕННУЮ эвристику
  console.log(`[ai-analysis] All models failed. Using improved heuristic analysis.`);
  
  return buildHeuristicFallback({
    surveyTitle: params.surveyTitle,
    openAnswers: normalizedOpenAnswers,
    quantitativeSummary,
  });
}