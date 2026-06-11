"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { notify } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

async function requireAdmin() {
  const session = await requireRole("ADMIN");
  return session.user.id;
}

export async function approveResponseAction(responseId: string) {
  const adminId = await requireAdmin();

  const response = await prisma.surveyResponse.findUnique({
    where: { id: responseId },
    include: { survey: true, user: { include: { wallet: true } } },
  });

  if (!response) throw new Error("Response not found");
  if (response.moderationStatus !== "PENDING") throw new Error("Response is not pending");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.surveyResponse.update({
      where: { id: responseId },
      data: {
        moderationStatus: "APPROVED",
        moderatedAt: new Date(),
        moderatedBy: adminId,
      },
    });

    if (response.survey.reward && response.user.wallet) {
      await tx.wallet.update({
        where: { id: response.user.wallet.id },
        data: {
          balance: { increment: response.survey.reward },
          totalEarned: { increment: response.survey.reward },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: response.user.wallet.id,
          type: "EARNING",
          amount: response.survey.reward,
          description: `Опрос: "${response.survey.title}"`,
          status: "COMPLETED",
        },
      });
    }
  });

  if (response.survey.reward) {
    await notify({
      userId: response.userId,
      type: "EARNING_CREDITED",
      title: "Начислено вознаграждение",
      body: `+${Number(response.survey.reward)} ₽ за опрос "${response.survey.title}"`,
      link: "/respondent/wallet",
      emailData: {
        amount: Number(response.survey.reward),
        surveyTitle: response.survey.title,
      },
    });
  }

  revalidatePath("/admin/moderation/responses");
  return { success: true };
}

export async function rejectResponseAction(responseId: string, note?: string) {
  const adminId = await requireAdmin();

  const response = await prisma.surveyResponse.findUnique({
    where: { id: responseId },
    include: { survey: true },
  });

  if (!response) throw new Error("Response not found");
  if (response.moderationStatus !== "PENDING") throw new Error("Response is not pending");

  await prisma.surveyResponse.update({
    where: { id: responseId },
    data: {
      moderationStatus: "REJECTED",
      moderationNote: note ?? null,
      moderatedAt: new Date(),
      moderatedBy: adminId,
    },
  });

  revalidatePath("/admin/moderation/responses");
  return { success: true };
}

export async function bulkApproveResponsesAction(responseIds: string[]) {
  const adminId = await requireAdmin();

  if (responseIds.length === 0) return { success: true, approved: 0 };

  const responses = await prisma.surveyResponse.findMany({
    where: { id: { in: responseIds }, moderationStatus: "PENDING" },
    include: { survey: true, user: { include: { wallet: true } } },
  });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const response of responses) {
      await tx.surveyResponse.update({
        where: { id: response.id },
        data: {
          moderationStatus: "APPROVED",
          moderatedAt: new Date(),
          moderatedBy: adminId,
        },
      });

      if (response.survey.reward && response.user.wallet) {
        await tx.wallet.update({
          where: { id: response.user.wallet.id },
          data: {
            balance: { increment: response.survey.reward },
            totalEarned: { increment: response.survey.reward },
          },
        });

        await tx.transaction.create({
          data: {
            walletId: response.user.wallet.id,
            type: "EARNING",
            amount: response.survey.reward,
            description: `Опрос: "${response.survey.title}"`,
            status: "COMPLETED",
          },
        });
      }
    }
  });

  for (const response of responses) {
    if (response.survey.reward) {
      await notify({
        userId: response.userId,
        type: "EARNING_CREDITED",
        title: "Начислено вознаграждение",
        body: `+${Number(response.survey.reward)} ₽ за опрос "${response.survey.title}"`,
        link: "/respondent/wallet",
        emailData: {
          amount: Number(response.survey.reward),
          surveyTitle: response.survey.title,
        },
      });
    }
  }

  revalidatePath("/admin/moderation/responses");
  return { success: true, approved: responses.length };
}
