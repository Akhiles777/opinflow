"use server";

import OpenAI from "openai";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_QUESTION_TYPES = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "SCALE",
  "RANKING",
  "OPEN_TEXT",
] as const;

type AllowedQuestionType = (typeof ALLOWED_QUESTION_TYPES)[number];

const inputSchema = z.object({
  taskDescription: z
    .string()
    .min(20, "Минимум 20 символов")
    .max(1000, "Максимум 1000 символов"),
  industry: z
    .enum(["ecommerce", "services", "horeca", "education", "healthcare", "other"])
    .optional(),
  targetAudience: z.string().max(200).optional(),
});

const generatedQuestionSchema = z.object({
  text: z.string().min(3).max(500),
  type: z.enum(ALLOWED_QUESTION_TYPES),
  options: z.array(z.string().min(1)).optional(),
  isRequired: z.boolean(),
});

const generatedSurveySchema = z.object({
  title: z.string().min(3).max(200),
  questions: z.array(generatedQuestionSchema).min(8).max(12),
  targetingRecommendation: z.string().min(10).max(1000),
});

export type GeneratedSurveyDraft = z.infer<typeof generatedSurveySchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type AiQuestionType = AllowedQuestionType;

function getOpenRouter() {
  return new OpenAI({
    baseURL: "https://routerai.ru/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      "X-Title": "PotokMneniy",
    },
  });
}

const INDUSTRY_LABELS: Record<string, string> = {
  ecommerce: "E-commerce / Интернет-магазины",
  services: "Услуги",
  horeca: "HoReCa (Рестораны / Отели)",
  education: "Образование",
  healthcare: "Здравоохранение",
  other: "Другое",
};

const AI_COST = new Prisma.Decimal(50);

function buildPrompt(
  taskDescription: string,
  industry: string | undefined,
  targetAudience: string | undefined
): { system: string; user: string } {
  const system = `Ты — эксперт по маркетинговым исследованиям. Твоя задача — сгенерировать профессиональный опрос для платформы опросов.
Верни ТОЛЬКО валидный JSON без markdown-обёрток, без комментариев.

Допустимые типы вопросов (используй СТРОГО только эти значения):
- SINGLE_CHOICE — один вариант ответа из списка
- MULTIPLE_CHOICE — несколько вариантов из списка
- SCALE — числовая шкала оценки
- RANKING — ранжирование вариантов по приоритету
- OPEN_TEXT — свободный текстовый ответ

Правила:
- Для SINGLE_CHOICE и MULTIPLE_CHOICE: всегда указывай "options" (3-6 вариантов)
- Для RANKING: указывай "options" (3-5 элементов)
- Для SCALE и OPEN_TEXT: поле "options" не нужно
- Количество вопросов: СТРОГО от 8 до 12
- Используй разнообразные типы вопросов, не повторяй один тип подряд более 2 раз

Формат JSON:
{
  "title": "название опроса",
  "questions": [
    {
      "text": "текст вопроса",
      "type": "SINGLE_CHOICE",
      "options": ["вариант 1", "вариант 2", "вариант 3"],
      "isRequired": true
    }
  ],
  "targetingRecommendation": "краткая рекомендация по целевой аудитории (2-3 предложения)"
}`;

  const industryLine = industry ? `\nОтрасль: ${INDUSTRY_LABELS[industry] ?? industry}` : "";
  const audienceLine = targetAudience ? `\nЦелевая аудитория: ${targetAudience}` : "";

  const user = `Создай опрос для маркетингового исследования.

Задача заказчика: ${taskDescription}${industryLine}${audienceLine}

Верни только JSON, без пояснений.`;

  return { system, user };
}

function sanitizeAndValidate(
  raw: unknown
): { success: true; data: GeneratedSurveyDraft } | { success: false; error: string } {
  if (!raw || typeof raw !== "object" || !("questions" in raw)) {
    return { success: false, error: "ИИ вернул некорректный формат." };
  }

  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.questions)) {
    return { success: false, error: "ИИ вернул некорректный формат вопросов." };
  }

  // Filter out questions with invalid types, clamp to 12
  const validQuestions = (obj.questions as unknown[])
    .filter((q) => {
      if (!q || typeof q !== "object") return false;
      const qObj = q as Record<string, unknown>;
      return ALLOWED_QUESTION_TYPES.includes(qObj.type as AllowedQuestionType);
    })
    .slice(0, 12);

  const adjusted = { ...obj, questions: validQuestions };
  const result = generatedSurveySchema.safeParse(adjusted);

  if (!result.success) {
    const firstErr = result.error.issues[0];
    return {
      success: false,
      error:
        firstErr?.path.includes("questions") && validQuestions.length < 8
          ? `ИИ сгенерировал только ${validQuestions.length} корректных вопросов (нужно минимум 8). Попробуйте более детально описать задачу.`
          : "ИИ сгенерировал некорректный формат. Попробуйте ещё раз.",
    };
  }

  return { success: true, data: result.data };
}

export async function generateSurveyWithAI(
  input: z.infer<typeof inputSchema>
): Promise<{ success: true; survey: GeneratedSurveyDraft } | { success: false; error: string }> {
  // 1. Auth
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") {
    return { success: false, error: "Функция доступна только для заказчиков." };
  }
  const userId = session.user.id;

  // 2. Validate input
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Некорректный запрос." };
  }
  const { taskDescription, industry, targetAudience } = parsed.data;

  // 3. Balance check — fail fast before AI call
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true, balance: true },
  });
  if (!wallet || wallet.balance.lessThan(AI_COST)) {
    return {
      success: false,
      error: "Недостаточно средств на балансе. Пополните баланс для генерации опроса.",
    };
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return { success: false, error: "Сервис генерации временно недоступен." };
  }

  // 4. AI call
  const { system, user } = buildPrompt(taskDescription, industry, targetAudience);
  let survey: GeneratedSurveyDraft;

  try {
    const client = getOpenRouter();
    const response = await client.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content ?? "";
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Не удалось извлечь JSON из ответа.");
      rawJson = JSON.parse(match[0]);
    }

    const validation = sanitizeAndValidate(rawJson);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }
    survey = validation.data;
  } catch (err) {
    console.error("[ai-survey-generation] AI call failed:", err);
    return { success: false, error: "Ошибка при обращении к ИИ. Попробуйте ещё раз." };
  }

  // 5. Debit 50 RUB — only after successful generation
  try {
    await prisma.$transaction(async (tx) => {
      const freshWallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balance: true },
      });
      if (!freshWallet || freshWallet.balance.lessThan(AI_COST)) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
      await tx.wallet.update({
        where: { id: freshWallet.id },
        data: {
          balance: { decrement: AI_COST },
          totalSpent: { increment: AI_COST },
        },
      });
      await tx.transaction.create({
        data: {
          walletId: freshWallet.id,
          type: "SPENDING",
          amount: AI_COST,
          description: "Генерация опроса ИИ",
          status: "COMPLETED",
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return { success: false, error: "Недостаточно средств на балансе." };
    }
    console.error("[ai-survey-generation] wallet debit failed:", err);
    return { success: false, error: "Ошибка списания средств. Обратитесь в поддержку." };
  }

  return { success: true, survey };
}
