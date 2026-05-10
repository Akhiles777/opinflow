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

// Вспомогательная функция для классификации ответа
function classifyAnswer(answer: string): {
  isComplaint: boolean;
  isSuggestion: boolean;
  isPraise: boolean;
  isQuestion: boolean;
  problemAreas: string[];
  positiveAspects: string[];
  suggestions: string[];
} {
  const lower = answer.toLowerCase();
  
  // Индикаторы жалоб
  const complaintPatterns = [
    "не работает", "проблема", "ошибка", "сломано", "неудобно", "медленно",
    "дорого", "плохо", "ужасно", "отвратительно", "разочарован", "не нравится",
    "хотелось бы", "не хватает", "отсутствует", "нет возможности", "сложно",
    "непонятно", "долго", "опаздывает", "холодное", "невкусное", "грязное",
    "хамят", "игнорируют", "не отвечают", "некачественное", "испорченное",
  ];
  
  // Индикаторы предложений
  const suggestionPatterns = [
    "добавить", "улучшить", "изменить", "сделать", "внедрить", "исправить",
    "пересмотреть", "обновить", "доработать", "оптимизировать", "было бы лучше",
    "предлагаю", "можно", "стоит", "необходимо", "нужно бы",
  ];
  
  // Индикаторы похвалы
  const praisePatterns = [
    "отлично", "прекрасно", "замечательно", "нравится", "доволен", "супер",
    "лучший", "рекомендую", "вкусно", "быстро", "удобно", "качественно",
    "профессионально", "вежливо", "приятно", "красиво", "надёжно",
  ];
  
  const isComplaint = complaintPatterns.some(p => lower.includes(p));
  const isSuggestion = suggestionPatterns.some(p => lower.includes(p));
  const isPraise = praisePatterns.some(p => lower.includes(p));
  const isQuestion = lower.includes("?") || lower.includes("как") || lower.includes("почему");
  
  // Извлечение конкретных проблем
  const problemAreas: string[] = [];
  const problemIndicators: Record<string, string[]> = {
    "Доставка": ["доставк", "привоз", "курьер", "опозда", "долг", "достав"],
    "Качество еды": ["вкус", "холодн", "горяч", "свеж", "качеств", "порц", "ингредиент"],
    "Упаковка": ["упаковк", "контейн", "проли", "помя", "развали"],
    "Цена": ["дорог", "цен", "стоимост", "переплат", "дешев"],
    "Сервис": ["обслуживан", "поддержк", "вежлив", "хам", "отношен", "реакц"],
    "Приложение/сайт": ["приложен", "сайт", "интерфейс", "заказ", "оформлен", "оплат"],
    "Ассортимент": ["выбор", "ассортимент", "меню", "разнообраз", "позиц"],
    "Время": ["врем", "долг", "быстр", "минут", "час"],
  };
  
  for (const [area, indicators] of Object.entries(problemIndicators)) {
    if (indicators.some(ind => lower.includes(ind))) {
      problemAreas.push(area);
    }
  }
  
  // Извлечение позитивных аспектов
  const positiveAspects: string[] = [];
  if (isPraise) {
    for (const [area, indicators] of Object.entries(problemIndicators)) {
      if (indicators.some(ind => lower.includes(ind))) {
        positiveAspects.push(area);
      }
    }
  }
  
  // Извлечение предложений
  const suggestions: string[] = [];
  if (isSuggestion) {
    const sentences = answer.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (suggestionPatterns.some(p => sentence.toLowerCase().includes(p))) {
        suggestions.push(sentence.trim());
      }
    }
  }
  
  return {
    isComplaint,
    isSuggestion,
    isPraise,
    isQuestion,
    problemAreas: [...new Set(problemAreas)],
    positiveAspects: [...new Set(positiveAspects)],
    suggestions,
  };
}

function buildHeuristicFallback(params: {
  surveyTitle: string;
  openAnswers: OpenAnswerGroup[];
  quantitativeSummary: string;
}): AnalysisResult {
  const allAnswers = params.openAnswers.flatMap((group) => group.answers);
  const totalAnswers = allAnswers.length || 1;

  // Классифицируем каждый ответ
  const classifiedAnswers = allAnswers.map(answer => ({
    original: answer,
    classification: classifyAnswer(answer),
  }));

  // Собираем статистику по проблемам
  const problemStats = new Map<string, { count: number; examples: string[]; complaints: number; suggestions: number }>();
  const praiseStats = new Map<string, { count: number; examples: string[] }>();
  
  classifiedAnswers.forEach(({ original, classification }) => {
    // Считаем проблемы
    classification.problemAreas.forEach(area => {
      if (!problemStats.has(area)) {
        problemStats.set(area, { count: 0, examples: [], complaints: 0, suggestions: 0 });
      }
      const stats = problemStats.get(area)!;
      stats.count++;
      stats.examples.push(original);
      if (classification.isComplaint) stats.complaints++;
      if (classification.isSuggestion) stats.suggestions++;
    });
    
    // Считаем позитив
    classification.positiveAspects.forEach(aspect => {
      if (!praiseStats.has(aspect)) {
        praiseStats.set(aspect, { count: 0, examples: [] });
      }
      const stats = praiseStats.get(aspect)!;
      stats.count++;
      stats.examples.push(original);
    });
  });

  // Собираем все предложения
  const allSuggestions = classifiedAnswers
    .filter(a => a.classification.isSuggestion)
    .flatMap(a => a.classification.suggestions);

  // Анализ по вопросам
  const questionAnalysis = params.openAnswers.map(group => {
    const answers = group.answers;
    const classified = answers.map(a => ({
      original: a,
      classification: classifyAnswer(a),
    }));
    
    const complaints = classified.filter(c => c.classification.isComplaint);
    const suggestions = classified.filter(c => c.classification.isSuggestion);
    const praises = classified.filter(c => c.classification.isPraise);
    const questions = classified.filter(c => c.classification.isQuestion);
    
    const allProblems = new Map<string, number>();
    classified.forEach(c => {
      c.classification.problemAreas.forEach(area => {
        allProblems.set(area, (allProblems.get(area) ?? 0) + 1);
      });
    });
    
    return {
      questionTitle: group.questionTitle,
      total: answers.length,
      complaints: complaints.length,
      suggestions: suggestions.length,
      praises: praises.length,
      questions: questions.length,
      topProblems: Array.from(allProblems.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
      complaintExamples: complaints.slice(0, 3).map(c => c.original),
      suggestionExamples: suggestions.slice(0, 3).map(c => c.original),
      praiseExamples: praises.slice(0, 3).map(c => c.original),
      dominantType: complaints.length > suggestions.length && complaints.length > praises.length ? "complaints" :
                   suggestions.length > complaints.length && suggestions.length > praises.length ? "suggestions" :
                   praises.length > complaints.length && praises.length > suggestions.length ? "praises" :
                   "mixed",
    };
  });

  // Расчёт тональности
  const totalComplaints = classifiedAnswers.filter(a => a.classification.isComplaint).length;
  const totalPraise = classifiedAnswers.filter(a => a.classification.isPraise).length;
  const totalSuggestions = classifiedAnswers.filter(a => a.classification.isSuggestion).length;
  
  let positive = clampPercent((totalPraise / totalAnswers) * 100);
  let negative = clampPercent((totalComplaints / totalAnswers) * 100);
  let neutral = clampPercent(((totalAnswers - totalPraise - totalComplaints) / totalAnswers) * 100);
  
  // Корректировка
  const total = positive + negative + neutral;
  if (total !== 100) {
    neutral += (100 - total);
    neutral = Math.max(0, neutral);
  }

  // Формирование тем на основе реальных проблем и вопросов
  const themes = questionAnalysis.map(qa => {
    const examples = qa.dominantType === "complaints" ? qa.complaintExamples :
                    qa.dominantType === "suggestions" ? qa.suggestionExamples :
                    qa.dominantType === "praises" ? qa.praiseExamples :
                    answers.slice(0, 3);
    
    let actionableInsight = "";
    
    if (qa.dominantType === "complaints" && qa.topProblems.length > 0) {
      const mainProblem = qa.topProblems[0][0];
      const count = qa.topProblems[0][1];
      actionableInsight = `⚠️ КРИТИЧЕСКАЯ ЗОНА: ${count} из ${qa.total} респондентов сообщили о проблемах с "${mainProblem}". ` +
        `Конкретные жалобы: "${qa.complaintExamples.join('"; "')}". ` +
        `НЕОБХОДИМО: провести аудит ${mainProblem.toLowerCase()} в течение 48 часов и предоставить план исправления.`;
    } else if (qa.dominantType === "suggestions" && qa.suggestions > 0) {
      actionableInsight = `💡 ЗОНА УЛУЧШЕНИЙ: ${qa.suggestions} из ${qa.total} респондентов предложили улучшения. ` +
        `Предложения: "${qa.suggestionExamples.slice(0, 2).join('"; "')}". ` +
        `РЕКОМЕНДАЦИЯ: оценить реализуемость предложений в течение недели, внедрить наиболее востребованные в следующем спринте.`;
    } else if (qa.dominantType === "praises" && qa.praises > 0) {
      actionableInsight = `✅ СИЛЬНАЯ СТОРОНА: ${qa.praises} из ${qa.total} респондентов отметили это направление позитивно. ` +
        `Примеры отзывов: "${qa.praiseExamples.slice(0, 2).join('"; "')}". ` +
        `РЕКОМЕНДАЦИЯ: зафиксировать текущие стандарты как обязательные, использовать позитивные отзывы в маркетинге.`;
    } else {
      actionableInsight = `📊 СМЕШАННЫЕ ОТЗЫВЫ: мнения разделились (${qa.complaints} жалоб, ${qa.praises} похвалы, ${qa.suggestions} предложений). ` +
        `РЕКОМЕНДАЦИЯ: провести дополнительный опрос для уточнения причин разногласий.`;
    }
    
    return {
      theme: qa.questionTitle,
      count: qa.total,
      sentiment: qa.dominantType === "complaints" ? "negative" :
                qa.dominantType === "praises" ? "positive" :
                "neutral",
      examples,
      actionableInsight,
    };
  });

  // Формирование детального резюме
  const problemAreas = Array.from(problemStats.entries())
    .sort((a, b) => b[1].count - a[1].count);
  
  const strengthAreas = Array.from(praiseStats.entries())
    .sort((a, b) => b[1].count - a[1].count);

  let summary = `📋 ДЕТАЛЬНЫЙ АНАЛИЗ ОПРОСА "${params.surveyTitle}"\n`;
  summary += `Всего проанализировано ${totalAnswers} ответов респондентов.\n\n`;
  
  summary += `📊 ОБЩАЯ КАРТИНА:\n`;
  summary += `• Позитивных отзывов: ${positive}% (${totalPraise} чел.)\n`;
  summary += `• Негативных отзывов: ${negative}% (${totalComplaints} чел.)\n`;
  summary += `• Предложений по улучшению: ${totalSuggestions} шт.\n\n`;
  
  if (problemAreas.length > 0) {
    summary += `🚨 ОБЛАСТИ, ТРЕБУЮЩИЕ ВНИМАНИЯ:\n`;
    problemAreas.forEach(([area, stats]) => {
      summary += `• ${area}: ${stats.count} упоминаний (${stats.complaints} жалоб, ${stats.suggestions} предложений)\n`;
    });
    summary += `\n`;
  }
  
  if (strengthAreas.length > 0) {
    summary += `✅ СИЛЬНЫЕ СТОРОНЫ:\n`;
    strengthAreas.forEach(([aspect, stats]) => {
      summary += `• ${aspect}: ${stats.count} позитивных отзывов\n`;
    });
    summary += `\n`;
  }
  
  if (allSuggestions.length > 0) {
    summary += `💡 КЛЮЧЕВЫЕ ПРЕДЛОЖЕНИЯ ОТ КЛИЕНТОВ:\n`;
    allSuggestions.slice(0, 5).forEach((suggestion, i) => {
      summary += `• "${suggestion}"\n`;
    });
    summary += `\n`;
  }
  
  summary += `📈 ВЫВОД: `;
  if (negative > 30) {
    summary += `Ситуация требует немедленных действий — ${negative}% негативных отзывов. Приоритет: устранение проблем в зонах ${problemAreas.slice(0, 3).map(([area]) => area).join(", ")}.`;
  } else if (positive > 50) {
    summary += `Общая удовлетворённость высокая (${positive}%). Фокус на развитии сильных сторон и внедрении предложений клиентов.`;
  } else {
    summary += `Ситуация неоднозначная. Необходимо углубить исследование проблемных зон и протестировать предложения клиентов.`;
  }

  // Word cloud из реальных проблем и предложений
  const wordCloud: { word: string; weight: number }[] = [];
  
  problemAreas.slice(0, 5).forEach(([area, stats]) => {
    wordCloud.push({ word: area, weight: Math.min(100, Math.round((stats.count / totalAnswers) * 100)) });
  });
  
  strengthAreas.slice(0, 5).forEach(([aspect, stats]) => {
    if (!wordCloud.find(w => w.word === aspect)) {
      wordCloud.push({ word: aspect, weight: Math.min(100, Math.round((stats.count / totalAnswers) * 100)) });
    }
  });

  const keyInsights: string[] = [];
  
  // Инсайты о проблемах
  if (problemAreas.length > 0) {
    keyInsights.push(`🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ: ${problemAreas.slice(0, 3).map(([area, stats]) => 
      `"${area}" — ${stats.count} упоминаний (${clampPercent((stats.count/totalAnswers)*100)}% опрошенных)`
    ).join("; ")}`);
  }
  
  // Инсайты о сильных сторонах
  if (strengthAreas.length > 0) {
    keyInsights.push(`🟢 СИЛЬНЫЕ СТОРОНЫ: ${strengthAreas.slice(0, 3).map(([aspect, stats]) => 
      `"${aspect}" — ${stats.count} позитивных отзывов`
    ).join("; ")}`);
  }
  
  // Инсайты о предложениях
  if (allSuggestions.length > 0) {
    keyInsights.push(`💡 КЛИЕНТЫ ПРЕДЛАГАЮТ: получено ${allSuggestions.length} конкретных предложений по улучшению`);
  }
  
  // Инсайты по вопросам
  questionAnalysis.forEach(qa => {
    if (qa.complaints > 0) {
      keyInsights.push(`Вопрос "${qa.questionTitle}": ${qa.complaints} жалоб, основные проблемы — ${qa.topProblems.map(([p, c]) => `${p}(${c})`).join(", ")}`);
    }
  });
  
  // Рекомендации
  keyInsights.push(
    totalAnswers < 15 
      ? `⚠️ Внимание: выборка из ${totalAnswers} ответов мала для окончательных выводов. Рекомендуется собрать минимум 30 ответов.`
      : `На основе ${totalAnswers} ответов можно принимать предварительные решения. Рекомендуется начать с исправления критических проблем.`
  );

  // Диагностика с конкретными действиями
  const diagnostics: AnalysisDiagnostics = {
    recommendations: [],
    hypotheses: [],
    riskFactors: [],
    metricsToWatch: [],
    actionPlan: {
      immediate: [],
      shortTerm: [],
      longTerm: [],
    },
    segmentsAnalysis: [],
  };

  // Рекомендации на основе проблем
  problemAreas.slice(0, 3).forEach(([area, stats]) => {
    diagnostics.recommendations.push(
      `Исправить проблемы с "${area}": ${stats.complaints} жалоб. Провести аудит процесса в течение 48 часов, выявить корневые причины, назначить ответственного. Ожидаемый результат: снижение жалоб на 50% за 2 недели.`
    );
  });
  
  // Рекомендации на основе предложений
  if (allSuggestions.length > 0) {
    diagnostics.recommendations.push(
      `Внедрить ключевые предложения клиентов: получено ${allSuggestions.length} идей. Отобрать топ-3 по соотношению эффект/затраты, реализовать в течение 2 недель. Измерить влияние на удовлетворённость.`
    );
  }
  
  // Общие рекомендации
  diagnostics.recommendations.push(
    "Настроить систему алертов при появлении новых жалоб для оперативного реагирования (цель: реакция в течение 2 часов).",
    "Провести A/B-тестирование изменений на основе предложений клиентов с контрольной группой.",
  );

  // Гипотезы
  problemAreas.slice(0, 2).forEach(([area]) => {
    diagnostics.hypotheses.push(
      `Проблемы с "${area}" могут быть вызваны недостаточным контролем качества на данном этапе. Проверить: провести тайный аудит процесса.`
    );
  });
  
  diagnostics.hypotheses.push(
    "Клиенты, предлагающие улучшения — самые лояльные. Проверить: сравнить retention rate этих клиентов с остальными.",
    "Сезонность может влиять на количество жалоб. Проверить: сравнить данные с аналогичным периодом прошлого месяца/года."
  );

  // Риски
  diagnostics.riskFactors.push(
    totalAnswers < 20 
      ? `Малая выборка (${totalAnswers} ответов) — выводы могут быть нерепрезентативны. Риск: принять неверное решение. Минимизация: собрать дополнительные данные.`
      : "Возможно смещение выборки — активнее отвечают недовольные клиенты. Риск: переоценить масштаб проблем. Минимизация: сравнить с данными закрытых вопросов.",
    "Единовременный срез не показывает динамику. Риск: принять временный всплеск за системную проблему. Минимизация: повторить опрос через 2 недели.",
    "Эвристический анализ не учитывает сарказм и контекст. Риск: неверно интерпретировать отдельные ответы. Минимизация: выборочная ручная проверка."
  );

  // Метрики для отслеживания
  diagnostics.metricsToWatch = [
    "Количество жалоб по категориям (еженедельно, цель: снижение на 30% в месяц)",
    "NPS (ежемесячно, цель: рост на 10 пунктов)",
    "Время реакции на жалобу (ежедневно, цель: < 2 часов)",
    "Конверсия предложений во внедрённые улучшения (ежемесячно, цель: > 30%)",
    "Retention rate клиентов, оставивших обратную связь (ежеквартально)",
  ];

  // План действий
  diagnostics.actionPlan = {
    immediate: [
      problemAreas.length > 0 
        ? `Созвать совещание команды по проблеме "${problemAreas[0][0]}" — назначить ответственного, установить срок исправления: 48 часов`
        : "Подготовить отчёт для команды с текущими выводами",
      "Ответить на все негативные отзывы персонально в течение 24 часов",
      `Проанализировать ${allSuggestions.length} предложений клиентов, отобрать топ-3 для немедленного внедрения`,
    ],
    shortTerm: [
      `Внедрить изменения по проблемным зонам: ${problemAreas.slice(0, 3).map(([area]) => area).join(", ")}. Срок: 2 недели`,
      "Запустить программу лояльности для клиентов, предлагающих улучшения",
      "Провести обучение персонала по выявленным проблемным зонам",
      "Настроить дашборд для мониторинга ключевых метрик в реальном времени",
    ],
    longTerm: [
      "Внедрить систему непрерывного сбора обратной связи (post-purchase survey, NPS-опросы)",
      "Создать программу «Голос клиента» с регулярными интервью и фокус-группами",
      "Разработать систему предиктивной аналитики для прогнозирования проблем до их появления",
    ],
  };

  // Сегментный анализ
  diagnostics.segmentsAnalysis = questionAnalysis.slice(0, 3).map(qa => ({
    segment: `Респонденты по вопросу "${qa.questionTitle}"`,
    insight: `${qa.total} ответов: ${qa.complaints} жалоб (${qa.topProblems.map(([p, c]) => `${p}: ${c}`).join(", ")}), ${qa.praises} позитивных, ${qa.suggestions} предложений`,
    action: qa.complaints > 0
      ? `Приоритет: исправить ${qa.topProblems[0][0]} в течение 48 часов`
      : qa.suggestions > 0
      ? `Внедрить топ предложений в следующем спринте`
      : "Мониторить показатели, цель: сохранить текущий уровень",
  }));

  const businessImplications = [];
  
  if (totalComplaints > 0) {
    businessImplications.push(
      `${totalComplaints} жалоб могут указывать на системные проблемы. Если не исправить — потенциальная потеря до ${clampPercent(negative)}% клиентов. Стоимость привлечения нового клиента в 5-7 раз выше удержания.`
    );
  }
  
  if (totalPraise > 0) {
    businessImplications.push(
      `${totalPraise} позитивных отзывов — потенциал для программы адвокатов бренда. Клиенты-промоутеры приводят в среднем 3 новых клиента.`
    );
  }
  
  if (allSuggestions.length > 0) {
    businessImplications.push(
      `${allSuggestions.length} предложений от клиентов — возможность улучшить продукт без затрат на дорогостоящие исследования. Средний ROI от внедрения клиентских предложений: 200-300%.`
    );
  }
  
  businessImplications.push(
    `Общие выводы по опросу "${params.surveyTitle}" указывают на необходимость системной работы с обратной связью. Ожидаемый эффект от внедрения рекомендаций: рост retention на 15-25% и увеличение среднего чека на 10-15% в течение 6 месяцев.`
  );

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

  const prompt = `Ты — ведущий CX-аналитик, который помогает бизнесу находить КОНКРЕТНЫЕ ПРОБЛЕМЫ и ПРОБЕЛЫ в клиентском опыте. Твоя задача — не просто анализировать, а показывать где именно бизнес теряет клиентов, где есть проблемы и что с этим делать.

Контекст: ${params.surveyTitle}
${params.surveyCategory ? `Категория бизнеса: ${params.surveyCategory}` : ""}
Всего ответов: ${totalAnswers}
${params.quantitativeSummary.trim() ? `\nДанные закрытых вопросов:\n${params.quantitativeSummary}` : ""}

Открытые ответы:
${answersText}

# ЧТО НУЖНО СДЕЛАТЬ
Найди в ответах:
1. ГДЕ БОЛИТ? — конкретные проблемы и жалобы клиентов
2. ГДЕ ТЕРЯЕМ? — пробелы в сервисе/продукте, о которых говорят клиенты
3. ЧТО ХОТЯТ? — предложения и ожидания клиентов
4. ЧТО УЖЕ ХОРОШО? — сильные стороны, которые нужно сохранить

Для каждой проблемы укажи:
- Масштаб (сколько клиентов затронуто)
- Конкретные примеры
- Влияние на бизнес
- Что делать прямо сейчас

Верни JSON (без markdown, без \`\`\`json):

{
  "themes": [
    {
      "theme": "Название проблемы/темы (например: Долгая доставка в вечернее время)",
      "count": число,
      "sentiment": "negative/positive/neutral",
      "examples": ["цитата", "цитата"],
      "actionableInsight": "Конкретное действие: что исправить, кому поручить, срок, KPI"
    }
  ],
  "sentiment": {"positive": 0-100, "neutral": 0-100, "negative": 0-100},
  "wordCloud": [{"word": "слово", "weight": 1-100}],
  "summary": "Детальный разбор ситуации: где проблемы, где потери, что делать (6-10 предложений с цифрами)",
  "keyInsights": [
    "Инсайт с конкретной проблемой и цифрами",
    ...
  ],
  "diagnostics": {
    "recommendations": ["Действие + ответственный + срок + KPI", ...],
    "hypotheses": ["Гипотеза + метод проверки", ...],
    "riskFactors": ["Риск + вероятность + влияние + что делать", ...],
    "metricsToWatch": ["Метрика + цель + периодичность", ...],
    "actionPlan": {
      "immediate": ["На этой неделе: конкретное действие + KPI"],
      "shortTerm": ["1-3 месяца: действие + KPI"],
      "longTerm": ["3-12 месяцев: действие + KPI"]
    },
    "segmentsAnalysis": [
      {
        "segment": "Группа клиентов",
        "insight": "Что у них болит",
        "action": "Что делать для них"
      }
    ]
  },
  "businessImplications": [
    "Как проблема влияет на деньги: потеря клиентов, revenue, репутация",
    ...
  ],
  "confidenceScore": 0-100
}`;

  const completion = await openrouter.chat.completions.create({
    model: params.model,
    temperature: 0.35,
    max_tokens: 6000,
    messages: [
      {
        role: "system",
        content: "Ты — аналитик, который находит конкретные проблемы бизнеса в отзывах клиентов. Ты не пишешь общие фразы. Ты говоришь: вот здесь проблема, вот столько клиентов затронуто, вот что делать, вот ответственный, вот срок, вот KPI. Ты отвечаешь ТОЛЬКО JSON в указанном формате.",
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

      try {
        const parsed = analysisResultSchema.parse(JSON.parse(cleaned)) as AnalysisResult;
        
        if (!isLowQuality(parsed)) {
          console.log(`[ai-analysis] Success with ${model}, attempt ${attempt}`);
          return {
            ...parsed,
            sentiment: normalizeSentiment(parsed.sentiment),
          };
        }
      } catch (parseError) {
        console.warn(`[ai-analysis] Parse error with ${model}`);
      }
    } catch (error) {
      console.warn(`[ai-analysis] Model ${model} failed`);
    }
  }

  console.log(`[ai-analysis] All models failed. Using heuristic with real problem analysis.`);
  
  return buildHeuristicFallback({
    surveyTitle: params.surveyTitle,
    openAnswers: normalizedOpenAnswers,
    quantitativeSummary,
  });
}