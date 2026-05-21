"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { getExpertReviewPrice, isKnownExpertName } from "@/lib/expert-review";
import { notify } from "@/lib/notifications";

export async function createExpertReviewRequestAction(surveyId: string) {
  const session = await requireRole("CLIENT");

  const [survey, wallet] = await Promise.all([
    prisma.survey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        title: true,
        creatorId: true,
        sessions: {
          where: { status: "COMPLETED", isValid: true },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { id: true, balance: true },
    }),
  ]);

  if (!survey || survey.creatorId !== session.user.id) {
    return { error: "Опрос не найден" };
  }

  if (survey.sessions.length === 0) {
    return { error: "Экспертный разбор можно заказать только после получения ответов." };
  }

  const existing = await prisma.expertReviewRequest.findFirst({
    where: {
      surveyId,
      userId: session.user.id,
      status: { in: ["PENDING", "ASSIGNED", "COMPLETED"] },
    },
    select: { id: true, status: true },
  });

  if (existing) {
    return { error: "По этому опросу уже есть активная заявка на экспертный разбор." };
  }

  const amount = getExpertReviewPrice();

  if (!wallet || Number(wallet.balance) < amount) {
    return { error: `Недостаточно средств. Для заказа нужно ${amount.toLocaleString("ru-RU")} ₽.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: new Prisma.Decimal(amount) }, totalSpent: { increment: new Prisma.Decimal(amount) } },
    });

    await tx.expertReviewRequest.create({
      data: {
        surveyId,
        userId: session.user.id,
        amount: new Prisma.Decimal(amount),
        status: "PENDING",
      },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "SPENDING",
        amount: new Prisma.Decimal(amount),
        description: `Экспертный разбор по опросу "${survey.title}"`,
        status: "COMPLETED",
      },
    });
  });

  revalidatePath(`/client/surveys/${surveyId}`);
  revalidatePath("/admin/experts");
  revalidatePath("/client/wallet");

  return { success: true };
}

export async function assignExpertReviewAction(requestId: string, expertName: string) {
  await requireRole("ADMIN");

  if (!expertName.trim() || !isKnownExpertName(expertName.trim())) {
    return { error: "Выберите эксперта из списка" };
  }

  const request = await prisma.expertReviewRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      survey: { select: { id: true, title: true } },
      userId: true,
    },
  });

  if (!request || (request.status !== "PENDING" && request.status !== "ASSIGNED")) {
    return { error: "Заявка не найдена или уже закрыта" };
  }

  await prisma.expertReviewRequest.update({
    where: { id: requestId },
    data: {
      assignedExpert: expertName.trim(),
      status: "ASSIGNED",
      adminNote: null,
    },
  });

  await notify({
    userId: request.userId,
    type: "SYSTEM",
    title: "Назначен эксперт",
    body: `По опросу "${request.survey.title}" назначен эксперт: ${expertName.trim()}.`,
    link: `/client/surveys/${request.survey.id}`,
  });

  revalidatePath("/admin/experts");
  revalidatePath(`/client/surveys/${request.survey.id}`);
  return { success: true };
}

export async function rejectExpertReviewAction(requestId: string, reason: string) {
  await requireRole("ADMIN");

  if (!reason.trim()) {
    return { error: "Укажите причину отклонения" };
  }

  const request = await prisma.expertReviewRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
      survey: { select: { id: true, title: true } },
      user: { select: { wallet: { select: { id: true } } } },
    },
  });

  if (!request || (request.status !== "PENDING" && request.status !== "ASSIGNED")) {
    return { error: "Заявка не найдена или уже закрыта" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.expertReviewRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        adminNote: reason.trim(),
      },
    });

    if (request.user.wallet?.id) {
      await tx.wallet.update({
        where: { id: request.user.wallet.id },
        data: {
          balance: { increment: request.amount },
          totalSpent: { decrement: request.amount },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: request.user.wallet.id,
          type: "REFUND",
          amount: request.amount,
          description: `Возврат за экспертный разбор "${request.survey.title}"`,
          status: "COMPLETED",
        },
      });
    }
  });

  await notify({
    userId: request.userId,
    type: "SYSTEM",
    title: "Экспертный разбор отклонён",
    body: `Заявка по опросу "${request.survey.title}" отклонена: ${reason.trim()}`,
    link: `/client/surveys/${request.survey.id}`,
  });

  revalidatePath("/admin/experts");
  revalidatePath(`/client/surveys/${request.survey.id}`);
  revalidatePath("/client/wallet");
  return { success: true };
}

export async function completeExpertReviewAction(params: {
  requestId: string;
  reportUrl: string;
}) {
  await requireRole("ADMIN");

  const request = await prisma.expertReviewRequest.findUnique({
    where: { id: params.requestId },
    select: {
      id: true,
      userId: true,
      status: true,
      survey: { select: { id: true, title: true } },
    },
  });

  if (!request || (request.status !== "PENDING" && request.status !== "ASSIGNED")) {
    return { error: "Заявка не найдена или уже закрыта" };
  }

  await prisma.expertReviewRequest.update({
    where: { id: params.requestId },
    data: {
      status: "COMPLETED",
      reportUrl: params.reportUrl,
      completedAt: new Date(),
    },
  });

  await notify({
    userId: request.userId,
    type: "SYSTEM",
    title: "Экспертный разбор готов",
    body: `По опросу "${request.survey.title}" загружено экспертное заключение.`,
    link: `/client/surveys/${request.survey.id}`,
  });

  revalidatePath("/admin/experts");
  revalidatePath(`/client/surveys/${request.survey.id}`);
  return { success: true };
}
