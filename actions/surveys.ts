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

function toQuestionOptions(question: SurveyDraft["questions"][number]) {
  if (question.type === "MATRIX") {
    return {
      rows: question.matrixRows,
      cols: question.matrixCols,
    };
  }

  return question.options.length > 0 ? question.options : null;
}

function toJsonValue(value: unknown) {
  return (value ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull;
}

export async function createSurveyAction(draft: SurveyDraft) {
  const session = await requireRole("CLIENT");

  if (!draft.title.trim()) return { error: "Введите название опроса" };
  if (!draft.questions.length) return { error: "Добавьте хотя бы один вопрос" };
  if (draft.maxResponses < 10) return { error: "Минимум 10 респондентов" };
  if (draft.reward < 20) return { error: "Минимальное вознаграждение — 20 ₽" };

  const budget = draft.maxResponses * draft.reward * 1.15;
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
        targetGender: draft.targetGender,
        targetAgeMin: draft.targetAgeMin,
        targetAgeMax: draft.targetAgeMax,
        targetCities: draft.targetCities,
        targetIncomes: draft.targetIncomes,
        targetInterests: draft.targetInterests,
        startsAt: toDate(draft.startsAt),
        endsAt: toDate(draft.endsAt),
      },
    });

    await tx.surveyQuestion.createMany({
      data: draft.questions.map((question, index) => ({
        surveyId: createdSurvey.id,
        order: index,
        type: question.type,
        title: question.title.trim(),
        description: question.description || null,
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

  return { success: true, surveyId: survey.id };
}

export async function startSurveyAction(surveyId: string) {
  const session = await requireRole("RESPONDENT");
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey || survey.status !== "ACTIVE") return { error: "Опрос недоступен" };

  const existing = await prisma.surveySession.findUnique({
    where: { surveyId_userId: { surveyId, userId: session.user.id } },
  });

  if (existing) {
    if (existing.status === "IN_PROGRESS") {
      return { success: true, sessionId: existing.id, isResume: true };
    }
    return { error: "Вы уже проходили этот опрос" };
  }

  const created = await prisma.surveySession.create({
    data: {
      surveyId,
      userId: session.user.id,
      status: "IN_PROGRESS",
    },
  });

  return { success: true, sessionId: created.id, isResume: false };
}

export async function completeSurveyAction(params: {
  surveyId: string;
  sessionId: string;
  answers: Record<string, unknown>;
  timeSpent: number;
  deviceId: string;
}) {
  const session = await requireRole("RESPONDENT");
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  const survey = await prisma.survey.findUnique({
    where: { id: params.surveyId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!survey) return { error: "Опрос не найден" };

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
  revalidatePath("/respondent/surveys");
  revalidatePath("/admin/moderation");
  return { success: true };
}
