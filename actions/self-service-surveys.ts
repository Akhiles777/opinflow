"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { ensureUserSetup } from "@/lib/user-setup";
import { getCommissionRate } from "@/lib/platform-settings";
import { sendRespondentWelcomeViaSelfServiceEmail } from "@/lib/email";
import { updateSurveyAnalysisWithDiagnosticsFallback } from "@/lib/analysis-diagnostics-db";
import { analyzeSurveyResponses } from "@/lib/ai-analysis";
import { buildQuantitativeBlocks, quantitativeSummaryForPrompt } from "@/lib/survey-quantitative";
import type { Question } from "@/types/survey";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SELF_SERVICE_FREE_LIMIT = 5;
const AI_ANALYTICS_FEE = new Prisma.Decimal(1000);
const IP_RATE_LIMIT = 5; // max submissions per IP per survey per hour

function generateSlug(): string {
  return randomBytes(16).toString("hex"); // 32 hex chars = 128 bits entropy
}

function roundMoney(v: number) {
  return Math.round(v * 100) / 100;
}

function estimateTime(questions: Question[]) {
  return Math.max(
    2,
    questions.reduce((t, q) => {
      return t + (["OPEN_TEXT", "MATRIX", "RANKING"].includes(q.type) ? 2 : 1);
    }, 0),
  );
}

function toJsonValue(v: unknown) {
  return (v ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull;
}

function toQuestionOptions(q: Question) {
  if (q.type === "MATRIX") {
    return { rows: q.matrixRows.filter((r) => r.trim()), cols: q.matrixCols.filter((c) => c.trim()) };
  }
  const opts = q.options.map((o) => o.trim()).filter(Boolean);
  return opts.length > 0 ? opts : null;
}

function validateQuestions(questions: Question[]): string | null {
  if (questions.length === 0) return "Добавьте хотя бы один вопрос";
  const ids = new Set(questions.map((q) => q.id));
  for (const [i, q] of questions.entries()) {
    if (!q.title.trim()) return "У каждого вопроса должен быть заголовок";
    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"].includes(q.type) &&
      q.options.filter((o) => o.trim()).length < 2) {
      return "У вопросов с вариантами должно быть минимум 2 варианта";
    }
    if (q.type === "MATRIX") {
      if (q.matrixRows.filter((r) => r.trim()).length < 1) return "Матрица: нужна хотя бы одна строка";
      if (q.matrixCols.filter((c) => c.trim()).length < 2) return "Матрица: нужно минимум 2 столбца";
    }
    for (const rule of q.logic) {
      if (!ids.has(rule.ifQuestionId)) return "Условная логика ссылается на удалённый вопрос";
      const srcIdx = questions.findIndex((x) => x.id === rule.ifQuestionId);
      if (srcIdx === -1 || srcIdx >= i) return "Условная логика может ссылаться только на предыдущие вопросы";
      if (!rule.value.trim()) return "Для правил показа нужно указать значение";
    }
  }
  return null;
}

// ─── Count free self-service surveys ─────────────────────────────────────────

export async function getSelfServiceCountAction(): Promise<number> {
  const session = await requireRole("CLIENT");
  return prisma.survey.count({
    where: { creatorId: session.user.id, surveyMode: "SELF_SERVICE" },
  });
}

// ─── Create self-service survey (free or paid) ────────────────────────────────

export type FreeSSInput = {
  title: string;
  description: string;
  category: string;
  questions: Question[];
};

export type PaidSSInput = FreeSSInput & {
  maxResponses: number;
  reward: number;
  startsAt?: string;
  endsAt?: string;
};

export type SSInput = FreeSSInput | PaidSSInput;

export async function createSelfServiceSurveyAction(input: SSInput): Promise<
  { success: true; surveyId: string; slug: string; isPaid: boolean } | { error: string }
> {
  const session = await requireRole("CLIENT");

  if (!input.title.trim() || input.title.trim().length < 5)
    return { error: "Название должно содержать минимум 5 символов" };
  if (!input.category.trim()) return { error: "Выберите категорию" };
  const qErr = validateQuestions(input.questions);
  if (qErr) return { error: qErr };

  const existingCount = await prisma.survey.count({
    where: { creatorId: session.user.id, surveyMode: "SELF_SERVICE" },
  });

  const isFree = existingCount < SELF_SERVICE_FREE_LIMIT;

  // Paid path: require budget params
  if (!isFree) {
    const paid = input as PaidSSInput;
    if (!paid.maxResponses || paid.maxResponses < 10) return { error: "Минимум 10 респондентов" };
    if (!paid.reward || paid.reward < 20) return { error: "Минимальное вознаграждение — 20 ₽" };
    if (!paid.endsAt) return { error: "Укажите дату окончания" };
  }

  let slug: string;
  let attempts = 0;
  while (true) {
    slug = generateSlug();
    const conflict = await prisma.survey.findUnique({ where: { publicLinkSlug: slug } });
    if (!conflict) break;
    if (++attempts > 5) return { error: "Не удалось сгенерировать уникальную ссылку. Попробуйте ещё раз." };
  }

  const estimatedTime = estimateTime(input.questions);

  if (isFree) {
    const survey = await prisma.$transaction(async (tx) => {
      const s = await tx.survey.create({
        data: {
          creatorId: session.user.id,
          title: input.title.trim(),
          description: input.description.trim() || null,
          category: input.category.trim(),
          status: "PENDING_MODERATION",
          surveyMode: "SELF_SERVICE",
          publicLinkSlug: slug,
          estimatedTime,
        },
      });
      await tx.surveyQuestion.createMany({
        data: input.questions.map((q, i) => ({
          surveyId: s.id,
          order: i,
          type: q.type,
          title: q.title.trim(),
          description: q.description.trim() || null,
          required: q.required,
          mediaUrl: q.mediaUrl,
          options: toJsonValue(toQuestionOptions(q)),
          settings: toJsonValue(Object.keys(q.settings).length > 0 ? q.settings : null),
          logic: toJsonValue(q.logic.length > 0 ? q.logic : null),
        })),
      });
      return s;
    });
    revalidatePath("/client/surveys/self-service");
    return { success: true, surveyId: survey.id, slug: survey.publicLinkSlug!, isPaid: false };
  }

  // Paid path
  const paid = input as PaidSSInput;
  const commissionRate = await getCommissionRate();
  const budget = roundMoney(paid.maxResponses * paid.reward * (1 + commissionRate));
  const platformFee = roundMoney(paid.maxResponses * paid.reward * commissionRate);

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
  if (!wallet) return { error: "Кошелёк не найден" };
  if (Number(wallet.balance) < budget) {
    return { error: `Недостаточно средств. Нужно ${budget.toFixed(0)} ₽` };
  }

  const survey = await prisma.$transaction(async (tx) => {
    const s = await tx.survey.create({
      data: {
        creatorId: session.user.id,
        title: paid.title.trim(),
        description: paid.description.trim() || null,
        category: paid.category.trim(),
        status: "PENDING_MODERATION",
        surveyMode: "SELF_SERVICE",
        publicLinkSlug: slug,
        estimatedTime,
        maxResponses: paid.maxResponses,
        reward: new Prisma.Decimal(paid.reward),
        budget: new Prisma.Decimal(budget),
        platformFee: new Prisma.Decimal(platformFee),
        startsAt: paid.startsAt ? new Date(paid.startsAt) : null,
        endsAt: paid.endsAt ? new Date(paid.endsAt) : null,
      },
    });
    await tx.surveyQuestion.createMany({
      data: paid.questions.map((q, i) => ({
        surveyId: s.id,
        order: i,
        type: q.type,
        title: q.title.trim(),
        description: q.description.trim() || null,
        required: q.required,
        mediaUrl: q.mediaUrl,
        options: toJsonValue(toQuestionOptions(q)),
        settings: toJsonValue(Object.keys(q.settings).length > 0 ? q.settings : null),
        logic: toJsonValue(q.logic.length > 0 ? q.logic : null),
      })),
    });
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: new Prisma.Decimal(budget) }, totalSpent: { increment: new Prisma.Decimal(budget) } },
    });
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "SPENDING",
        amount: new Prisma.Decimal(budget),
        description: `Создание анкеты для своей базы: "${paid.title.trim()}"`,
        status: "COMPLETED",
      },
    });
    return s;
  });

  revalidatePath("/client/surveys/self-service");
  return { success: true, surveyId: survey.id, slug: survey.publicLinkSlug!, isPaid: true };
}

// ─── Deactivate self-service survey ──────────────────────────────────────────

export async function deactivateSelfServiceSurveyAction(surveyId: string) {
  const session = await requireRole("CLIENT");
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId, creatorId: session.user.id, surveyMode: "SELF_SERVICE" },
    select: { id: true },
  });
  if (!survey) return { error: "Опрос не найден" };
  await prisma.survey.update({ where: { id: surveyId }, data: { status: "COMPLETED" } });
  revalidatePath(`/client/surveys/self-service/${surveyId}`);
  revalidatePath("/client/surveys/self-service");
  return { success: true };
}

// ─── Submit public response ───────────────────────────────────────────────────

export async function submitSelfServiceResponseAction(params: {
  slug: string;
  email: string;
  name: string;
  answers: Record<string, unknown>;
}): Promise<{ success: true } | { error: string }> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  // Server-side email validation
  const normalized = params.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: "Введите корректный email" };
  }
  const trimmedName = params.name.trim();
  if (!trimmedName) return { error: "Введите ваше имя" };

  // Load survey
  const survey = await prisma.survey.findUnique({
    where: { publicLinkSlug: params.slug },
    select: {
      id: true,
      title: true,
      status: true,
      surveyMode: true,
      maxResponses: true,
      questions: { orderBy: { order: "asc" }, select: { id: true } },
    },
  });

  if (!survey || (survey.surveyMode ?? "POOL") !== "SELF_SERVICE") {
    return { error: "Опрос не найден" };
  }
  if (survey.status !== "ACTIVE") {
    return { error: "Этот опрос завершён или недоступен" };
  }

  // Check max responses
  if (survey.maxResponses) {
    const count = await prisma.surveySession.count({ where: { surveyId: survey.id, status: "COMPLETED", isValid: true } });
    if (count >= survey.maxResponses) return { error: "Опрос уже набрал нужное количество ответов" };
  }

  // IP rate limit: max 5 submissions per IP per survey per hour
  if (ip !== "unknown") {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const ipCount = await prisma.surveySession.count({
      where: { surveyId: survey.id, ipAddress: ip, startedAt: { gte: hourAgo } },
    });
    if (ipCount >= IP_RATE_LIMIT) {
      return { error: "Слишком много попыток с вашего IP. Попробуйте позже." };
    }
  }

  // Find or create respondent
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, role: true, name: true },
  });

  if (existing && existing.role !== "RESPONDENT") {
    return { error: "Этот email зарегистрирован с другой ролью. Используйте другой email." };
  }

  let userId: string;
  let isNewUser = false;

  if (existing) {
    userId = existing.id;
  } else {
    // Create new RESPONDENT
    const tempPassword = randomBytes(20).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const referralCode = Math.random().toString(36).slice(2, 9).toUpperCase();

    const newUser = await prisma.user.create({
      data: {
        email: normalized,
        name: trimmedName,
        passwordHash,
        referralCode,
        role: "RESPONDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });
    await ensureUserSetup(newUser.id, "RESPONDENT");
    userId = newUser.id;
    isNewUser = true;

    // Send welcome email with password-setup link (don't fail the submission if email fails)
    void (async () => {
      try {
        const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
        const token = await prisma.emailToken.create({
          data: { userId, type: "PASSWORD_RESET", expiresAt: addDays(new Date(), 7) },
        });
        await sendRespondentWelcomeViaSelfServiceEmail(normalized, trimmedName, token.token, survey.title);
      } catch (err) {
        console.error("[self-service] welcome email failed:", { userId, email: normalized, err });
      }
    })();
  }

  // Save response atomically
  const validIds = new Set(survey.questions.map((q) => q.id));
  const answersToSave = Object.entries(params.answers)
    .filter(([qId]) => validIds.has(qId))
    .map(([questionId, value]) => ({ questionId, value: value as Prisma.InputJsonValue }));

  try {
    await prisma.$transaction(async (tx) => {
      const sessionRecord = await tx.surveySession.create({
        data: {
          surveyId: survey.id,
          userId,
          status: "COMPLETED",
          completedAt: new Date(),
          ipAddress: ip,
          userAgent,
          isValid: true,
          fraudFlags: [],
        },
      });

      if (answersToSave.length > 0) {
        await tx.surveyAnswer.createMany({
          data: answersToSave.map((a) => ({ sessionId: sessionRecord.id, ...a })),
        });
      }

      await tx.surveyResponse.create({
        data: {
          surveyId: survey.id,
          userId,
          sessionId: sessionRecord.id,
          moderationStatus: "APPROVED",
        },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Вы уже прошли этот опрос" };
    }
    console.error("[self-service] response save error:", err);
    return { error: "Не удалось сохранить ответы. Попробуйте ещё раз." };
  }

  void isNewUser; // used for logging purposes above
  return { success: true };
}

// ─── Purchase AI Analytics ────────────────────────────────────────────────────

export async function purchaseAiAnalyticsAction(surveyId: string): Promise<
  { success: true; alreadyPaid?: boolean } | { error: string }
> {
  const session = await requireRole("CLIENT");

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId, creatorId: session.user.id },
    select: {
      id: true,
      title: true,
      category: true,
      surveyMode: true,
      aiAnalyticsPaid: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          required: true,
          mediaUrl: true,
          options: true,
          settings: true,
          logic: true,
          answers: {
            where: { session: { status: "COMPLETED", isValid: true } },
            select: { value: true },
          },
        },
      },
      _count: { select: { sessions: { where: { status: "COMPLETED", isValid: true } } } },
    },
  });

  if (!survey || (survey.surveyMode ?? "POOL") !== "SELF_SERVICE") return { error: "Опрос не найден" };
  if (survey.aiAnalyticsPaid) return { success: true, alreadyPaid: true };

  if (survey._count.sessions === 0) {
    return { error: "Для анализа нет завершённых ответов. Подождите, пока кто-нибудь пройдёт опрос." };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
  if (!wallet || wallet.balance.lessThan(AI_ANALYTICS_FEE)) {
    return { error: "Недостаточно средств на балансе. Пополните кошелёк на 1 000 ₽." };
  }

  // Debit + mark paid (atomic)
  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.wallet.findUnique({ where: { id: wallet.id }, select: { balance: true } });
      if (!fresh || new Prisma.Decimal(fresh.balance).lessThan(AI_ANALYTICS_FEE)) {
        throw new Error("INSUFFICIENT");
      }
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: AI_ANALYTICS_FEE }, totalSpent: { increment: AI_ANALYTICS_FEE } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "SPENDING",
          amount: AI_ANALYTICS_FEE,
          description: `ИИ-аналитика: "${survey.title}"`,
          status: "COMPLETED",
        },
      });
      await tx.survey.update({
        where: { id: surveyId },
        data: { aiAnalyticsPaid: true, aiAnalyticsPaidAt: new Date() },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT") {
      return { error: "Недостаточно средств на балансе." };
    }
    return { error: "Ошибка при списании средств. Попробуйте ещё раз." };
  }

  // Run AI analysis
  try {
    await prisma.surveyAnalysis.upsert({
      where: { surveyId },
      create: { surveyId, status: "PROCESSING" },
      update: { status: "PROCESSING", summary: null, error: null },
    });

    const openAnswers = survey.questions
      .filter((q) => q.type === "OPEN_TEXT")
      .map((q) => ({
        questionTitle: q.title,
        answers: q.answers
          .map((a) => (typeof a.value === "string" ? a.value.trim() : ""))
          .filter(Boolean),
      }))
      .filter((g) => g.answers.length > 0);

    const quantBlocks = buildQuantitativeBlocks(survey.questions);
    const quantSummary = quantitativeSummaryForPrompt(quantBlocks);

    const result = await analyzeSurveyResponses({
      surveyTitle: survey.title,
      surveyCategory: survey.category,
      openAnswers,
      quantitativeSummary: quantSummary,
    });

    await updateSurveyAnalysisWithDiagnosticsFallback({
      surveyId,
      data: {
        status: "COMPLETED",
        themes: result.themes as unknown as Prisma.InputJsonValue,
        sentimentData: result.sentiment as unknown as Prisma.InputJsonValue,
        wordCloud: result.wordCloud as unknown as Prisma.InputJsonValue,
        diagnostics: result.diagnostics ? (result.diagnostics as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        summary: result.summary,
        keyInsights: result.keyInsights as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
        error: null,
      },
    });
  } catch (err) {
    // AI failed — refund
    const msg = err instanceof Error ? err.message : "Неизвестная ошибка анализа";
    try {
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: AI_ANALYTICS_FEE }, totalSpent: { decrement: AI_ANALYTICS_FEE } },
        });
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "REFUND",
            amount: AI_ANALYTICS_FEE,
            description: `Возврат: ИИ-анализ не выполнен`,
            status: "COMPLETED",
          },
        });
        await tx.survey.update({
          where: { id: surveyId },
          data: { aiAnalyticsPaid: false, aiAnalyticsPaidAt: null },
        });
        await tx.surveyAnalysis.update({ where: { surveyId }, data: { status: "FAILED", error: msg } });
      });
    } catch (refundErr) {
      console.error("[self-service] refund failed:", refundErr);
    }
    return { error: "ИИ-анализ не выполнен. Средства возвращены на баланс." };
  }

  revalidatePath(`/client/surveys/self-service/${surveyId}`);
  return { success: true };
}
