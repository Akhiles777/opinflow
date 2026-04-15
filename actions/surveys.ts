"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { checkFraud } from "@/lib/antifrod";
import type { SurveyDraft } from "@/types/survey";

function toDate(value: string) {
  return value ? new Date(value) : null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function estimateSurveyTime(questions: SurveyDraft["questions"]) {
  return Math.max(
    2,
    questions.reduce((total, question) => {
      switch (question.type) {
        case "OPEN_TEXT":
          return total + 2;
        case "MATRIX":
        case "RANKING":
          return total + 2;
        default:
          return total + 1;
      }
    }, 0),
  );
}

function validateQuestionDraft(draft: SurveyDraft) {
  for (const question of draft.questions) {
    if (!question.title.trim()) {
      return "У каждого вопроса должен быть заполнен заголовок";
    }

    if (
      ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANKING"].includes(question.type) &&
      question.options.filter((item) => item.trim()).length < 2
    ) {
      return "У вопросов с вариантами должно быть минимум 2 варианта ответа";
    }

    if (question.type === "MATRIX") {
      if (question.matrixRows.filter((item) => item.trim()).length < 1) {
        return "У матричного вопроса должна быть хотя бы одна строка";
      }
      if (question.matrixCols.filter((item) => item.trim()).length < 2) {
        return "У матричного вопроса должно быть минимум 2 столбца";
      }
    }
  }

  return null;
}

async function canSurveyBeStarted(surveyId: string) {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      maxResponses: true,
    },
  });

  if (!survey || survey.status !== "ACTIVE") {
    return { survey: null, error: "Опрос недоступен" as const };
  }

  const now = new Date();
  if (survey.startsAt && survey.startsAt > now) {
    return { survey, error: "Опрос ещё не начался" as const };
  }

  if (survey.endsAt && survey.endsAt <= now) {
    return { survey, error: "Срок прохождения опроса уже закончился" as const };
  }

  if (survey.maxResponses) {
    const completedCount = await prisma.surveySession.count({
      where: { surveyId, status: "COMPLETED", isValid: true },
    });

    if (completedCount >= survey.maxResponses) {
      return { survey, error: "Опрос уже набрал нужное количество ответов" as const };
    }
  }

  return { survey, error: null };
}

function toQuestionOptions(question: SurveyDraft["questions"][number]) {
  if (question.type === "MATRIX") {
    return {
      rows: question.matrixRows.filter((item) => item.trim()),
      cols: question.matrixCols.filter((item) => item.trim()),
    };
  }

  const options = question.options.map((item) => item.trim()).filter(Boolean);
  return options.length > 0 ? options : null;
}

function toJsonValue(value: unknown) {
  return (value ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull;
}

export async function createSurveyAction(draft: SurveyDraft) {
  const session = await requireRole("CLIENT");

  if (draft.title.trim().length < 5) return { error: "Название должно содержать минимум 5 символов" };
  if (!draft.category.trim()) return { error: "Выберите категорию" };
  if (!draft.questions.length) return { error: "Добавьте хотя бы один вопрос" };
  const questionError = validateQuestionDraft(draft);
  if (questionError) return { error: questionError };
  if (draft.maxResponses < 10) return { error: "Минимум 10 респондентов" };
  if (draft.reward < 20) return { error: "Минимальное вознаграждение — 20 ₽" };
  if (draft.targetAgeMin > draft.targetAgeMax) return { error: "Минимальный возраст не может быть больше максимального" };
  if (!draft.endsAt) return { error: "Укажите дату окончания" };

  const startsAt = toDate(draft.startsAt);
  const endsAt = toDate(draft.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) {
    return { error: "Дата окончания должна быть позже даты начала" };
  }

  const estimatedTime = estimateSurveyTime(draft.questions);
  const budget = roundMoney(draft.maxResponses * draft.reward * 1.15);
  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
  if (!wallet) return { error: "Кошелёк не найден" };
  if (Number(wallet.balance) < budget) {
    return { error: `Недостаточно средств. Нужно ${budget.toFixed(0)} ₽` };
  }

  const survey = await prisma.$transaction(async (tx) => {
    const createdSurvey = await tx.survey.create({
      data: {
        creatorId: session.user.id,
        title: draft.title.trim(),
        description: draft.description || null,
        category: draft.category || null,
        status: "PENDING_MODERATION",
        maxResponses: draft.maxResponses,
        reward: new Prisma.Decimal(draft.reward),
        budget: new Prisma.Decimal(budget),
        estimatedTime,
        targetGender: draft.targetGender,
        targetAgeMin: draft.targetAgeMin,
        targetAgeMax: draft.targetAgeMax,
        targetCities: draft.targetCities,
        targetIncomes: draft.targetIncomes,
        targetInterests: draft.targetInterests,
        startsAt,
        endsAt,
      },
    });

    await tx.surveyQuestion.createMany({
      data: draft.questions.map((question, index) => ({
        surveyId: createdSurvey.id,
        order: index,
        type: question.type,
        title: question.title.trim(),
        description: question.description.trim() || null,
        required: question.required,
        mediaUrl: question.mediaUrl,
        options: toJsonValue(toQuestionOptions(question)),
        settings: toJsonValue(Object.keys(question.settings).length > 0 ? question.settings : null),
        logic: toJsonValue(question.logic.length > 0 ? question.logic : null),
      })),
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: new Prisma.Decimal(budget) },
        totalSpent: { increment: new Prisma.Decimal(budget) },
      },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "SPENDING",
        amount: new Prisma.Decimal(budget),
        description: `Запуск опроса: \"${draft.title.trim()}\"`,
        status: "COMPLETED",
      },
    });

    return createdSurvey;
  });

  revalidatePath("/client/surveys");
  revalidatePath(`/client/surveys/${survey.id}`);
  revalidatePath("/admin/moderation");
  revalidatePath("/client");

  return { success: true, surveyId: survey.id };
}

export async function startSurveyAction(surveyId: string) {
  const session = await requireRole("RESPONDENT");
  const availability = await canSurveyBeStarted(surveyId);
  if (availability.error) return { error: availability.error };

  const existing = await prisma.surveySession.findUnique({
    where: { surveyId_userId: { surveyId, userId: session.user.id } },
  });

  if (existing) {
    if (existing.status === "IN_PROGRESS") {
      return { success: true, sessionId: existing.id, isResume: true };
    }
    return { error: "Вы уже проходили этот опрос" };
  }

  try {
    const created = await prisma.surveySession.create({
      data: {
        surveyId,
        userId: session.user.id,
        status: "IN_PROGRESS",
      },
    });

    return { success: true, sessionId: created.id, isResume: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await prisma.surveySession.findUnique({
        where: { surveyId_userId: { surveyId, userId: session.user.id } },
      });

      if (concurrent?.status === "IN_PROGRESS") {
        return { success: true, sessionId: concurrent.id, isResume: true };
      }
      return { error: "Вы уже проходили этот опрос" };
    }

    throw error;
  }
}

export async function completeSurveyAction(params: {
  surveyId: string;
  sessionId: string;
  answers: Record<string, unknown>;
  timeSpent: number;
  deviceId: string;
}) {
  const session = await requireRole("RESPONDENT");
  const availability = await canSurveyBeStarted(params.surveyId);
  if (availability.error) return { error: availability.error };
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  const survey = await prisma.survey.findUnique({
    where: { id: params.surveyId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!survey) return { error: "Опрос не найден" };
  if (Object.keys(params.answers).length === 0) {
    return { error: "Нужно ответить хотя бы на один вопрос" };
  }

  const sessionRecord = await prisma.surveySession.findUnique({
    where: { id: params.sessionId },
    select: { id: true, userId: true, status: true },
  });

  if (!sessionRecord || sessionRecord.userId !== session.user.id || sessionRecord.status !== "IN_PROGRESS") {
    return { error: "Сессия опроса недействительна" };
  }

  const fraud = await checkFraud({
    userId: session.user.id,
    surveyId: params.surveyId,
    timeSpent: params.timeSpent,
    answers: params.answers,
    ipAddress: ip,
    userAgent,
    deviceId: params.deviceId,
  });

  await prisma.$transaction(async (tx) => {
    const updatedSession = await tx.surveySession.update({
      where: { id: params.sessionId },
      data: {
        status: fraud.isValid ? "COMPLETED" : "REJECTED",
        completedAt: new Date(),
        timeSpent: params.timeSpent,
        ipAddress: ip,
        userAgent,
        deviceId: params.deviceId,
        isValid: fraud.isValid,
        fraudFlags: fraud.flags,
      },
    });

    const validIds = new Set(survey.questions.map((question) => question.id));
    const answersToSave = Object.entries(params.answers)
      .filter(([questionId]) => validIds.has(questionId))
      .map(([questionId, value]) => ({
        sessionId: updatedSession.id,
        questionId,
        value: value as Prisma.InputJsonValue,
      }));

    if (answersToSave.length > 0) {
      await tx.surveyAnswer.createMany({ data: answersToSave });
    }

    if (fraud.isValid && survey.reward) {
      const wallet = await tx.wallet.findUnique({ where: { userId: session.user.id } });
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: survey.reward },
            totalEarned: { increment: survey.reward },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "EARNING",
            amount: survey.reward,
            description: `Опрос: \"${survey.title}\"`,
            status: "COMPLETED",
          },
        });
      }
    }
  });

  if (fraud.isValid && survey.maxResponses) {
    const count = await prisma.surveySession.count({
      where: { surveyId: params.surveyId, isValid: true, status: "COMPLETED" },
    });

    if (count >= survey.maxResponses) {
      await prisma.survey.update({ where: { id: params.surveyId }, data: { status: "COMPLETED" } });
    }
  }

  revalidatePath("/respondent/surveys");
  revalidatePath("/respondent/wallet");
  revalidatePath("/respondent");
  revalidatePath("/client");
  revalidatePath("/client/surveys");
  revalidatePath(`/client/surveys/${params.surveyId}`);

  return {
    success: true,
    rewarded: fraud.isValid,
    amount: fraud.isValid ? Number(survey.reward ?? 0) : 0,
  };
}

export async function approveSurveyAction(surveyId: string) {
  await requireRole("ADMIN");
  await prisma.survey.update({ where: { id: surveyId }, data: { status: "ACTIVE", moderationNote: null } });
  revalidatePath("/admin/moderation");
  revalidatePath(`/client/surveys/${surveyId}`);
  revalidatePath("/client/surveys");
  revalidatePath("/client");
  revalidatePath("/respondent/surveys");
  return { success: true };
}

export async function rejectSurveyAction(surveyId: string, reason: string) {
  await requireRole("ADMIN");
  if (!reason.trim()) return { error: "Укажите причину" };

  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) return { error: "Опрос не найден" };

  await prisma.$transaction(async (tx) => {
    await tx.survey.update({
      where: { id: surveyId },
      data: { status: "REJECTED", moderationNote: reason.trim() },
    });

    if (survey.budget) {
      const wallet = await tx.wallet.findUnique({ where: { userId: survey.creatorId } });
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: survey.budget },
            totalSpent: { decrement: survey.budget },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: "REFUND",
            amount: survey.budget,
            description: `Возврат: \"${survey.title}\"`,
            status: "COMPLETED",
          },
        });
      }
    }
  });

  revalidatePath("/admin/moderation");
  revalidatePath(`/client/surveys/${surveyId}`);
  revalidatePath("/client/surveys");
  revalidatePath("/client");
  revalidatePath("/client/wallet");
  return { success: true };
}

export async function toggleSurveyPauseAction(surveyId: string) {
  const session = await requireRole("CLIENT");
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });

  if (!survey || survey.creatorId !== session.user.id) {
    return { error: "Опрос не найден" };
  }

  if (survey.status !== "ACTIVE" && survey.status !== "PAUSED") {
    return { error: "Опрос нельзя приостановить" };
  }

  const nextStatus = survey.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  await prisma.survey.update({ where: { id: surveyId }, data: { status: nextStatus } });

  revalidatePath(`/client/surveys/${surveyId}`);
  revalidatePath("/client/surveys");
  revalidatePath("/client");
  revalidatePath("/respondent/surveys");
  return { success: true, status: nextStatus };
}

export async function stopSurveyAction(surveyId: string) {
  const session = await requireRole("CLIENT");
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });

  if (!survey || survey.creatorId !== session.user.id) {
    return { error: "Опрос не найден" };
  }

  if (!["ACTIVE", "PAUSED", "PENDING_MODERATION"].includes(survey.status)) {
    return { error: "Опрос уже завершён" };
  }

  await prisma.survey.update({ where: { id: surveyId }, data: { status: "COMPLETED" } });

  revalidatePath(`/client/surveys/${surveyId}`);
  revalidatePath("/client/surveys");
  revalidatePath("/client");
  revalidatePath("/respondent/surveys");
  revalidatePath("/admin/moderation");
  return { success: true };
}
