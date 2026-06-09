"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { getExpertReviewPrice, isValidExpertName } from "@/lib/expert-review";
import { notify } from "@/lib/notifications";
import { getPlatformSettings } from "@/lib/platform-settings";
import { sendAdminNotificationEmail } from "@/lib/email";

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

  try {
    const { adminEmail } = await getPlatformSettings();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, clientProfile: { select: { companyName: true } } },
    });
    const displayName = user?.clientProfile?.companyName ?? user?.name ?? user?.email ?? session.user.id;
    await sendAdminNotificationEmail(
      adminEmail,
      "Новый запрос экспертного заключения",
      [
        { label: "Заказчик", value: displayName },
        { label: "Email", value: user?.email ?? "—" },
        { label: "Опрос", value: survey.title },
        { label: "Сумма", value: `${amount.toLocaleString("ru-RU")} ₽` },
      ],
      `${process.env.NEXTAUTH_URL ?? ""}/admin/experts`,
      "Перейти к заявкам",
    );
  } catch {
    // не блокируем основной флоу
  }

  return { success: true };
}

export async function assignExpertReviewAction(requestId: string, expertName: string) {
  await requireRole("ADMIN");

  if (!expertName.trim()) {
    return { error: "Выберите эксперта из списка" };
  }

  if (!(await isValidExpertName(expertName.trim()))) {
    return { error: "Эксперт не найден в базе" };
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

  try {
    await notify({
      userId: request.userId,
      type: "SYSTEM",
      title: "Назначен эксперт",
      body: `По опросу "${request.survey.title}" назначен эксперт: ${expertName.trim()}.`,
      link: `/client/surveys/${request.survey.id}`,
    });
  } catch (error) {
    console.error("[expert-reviews][assign] notify error:", error);
  }

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

  try {
    await notify({
      userId: request.userId,
      type: "SYSTEM",
      title: "Экспертный разбор отклонён",
      body: `Заявка по опросу "${request.survey.title}" отклонена: ${reason.trim()}`,
      link: `/client/surveys/${request.survey.id}`,
    });
  } catch (error) {
    console.error("[expert-reviews][reject] notify error:", error);
  }

  revalidatePath("/admin/experts");
  revalidatePath(`/client/surveys/${request.survey.id}`);
  revalidatePath("/client/wallet");
  return { success: true };
}

export async function submitTextConclusionAction(requestId: string, text: string) {
  await requireRole("ADMIN");

  const trimmed = text.trim();
  if (!trimmed) return { error: "Введите текст заключения" };
  if (trimmed.length > 50000) return { error: "Текст слишком длинный (максимум 50 000 символов)" };

  const request = await prisma.expertReviewRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      status: true,
      survey: { select: { id: true, title: true } },
    },
  });

  if (!request || (request.status !== "ASSIGNED" && request.status !== "COMPLETED")) {
    return { error: "Загрузить заключение можно только после назначения эксперта" };
  }

  await prisma.expertReviewRequest.update({
    where: { id: requestId },
    data: {
      status: "COMPLETED",
      reportText: trimmed,
      reportUrl: null,
      completedAt: new Date(),
    },
  });

  try {
    await notify({
      userId: request.userId,
      type: "SYSTEM",
      title: "Экспертный разбор готов",
      body: `По опросу "${request.survey.title}" готово экспертное заключение.`,
      link: `/client/surveys/${request.survey.id}`,
    });
  } catch (error) {
    console.error("[expert-reviews][text-conclusion] notify error:", error);
  }

  revalidatePath("/admin/experts");
  revalidatePath(`/client/surveys/${request.survey.id}`);
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

  try {
    await notify({
      userId: request.userId,
      type: "SYSTEM",
      title: "Экспертный разбор готов",
      body: `По опросу "${request.survey.title}" загружено экспертное заключение.`,
      link: `/client/surveys/${request.survey.id}`,
    });
  } catch (error) {
    console.error("[expert-reviews][complete] notify error:", error);
  }

  revalidatePath("/admin/experts");
  revalidatePath(`/client/surveys/${request.survey.id}`);
  return { success: true };
}
