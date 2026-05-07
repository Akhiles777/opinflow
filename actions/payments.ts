"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { createDepositPayment, createPayout } from "@/lib/yukassa";

function getPaymentErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message.includes("YUKASSA_NOT_CONFIGURED")) {
    return "Платёжный сервис пока не настроен.";
  }

  return fallback;
}

export async function createDepositAction(amount: number) {
  const session = await requireRole("CLIENT");

  if (amount < 100 || amount > 500000) {
    return { error: "Сумма пополнения должна быть от 100 до 500 000 ₽" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user?.email) {
      return { error: "Не удалось определить email пользователя" };
    }

    const returnUrl =
      process.env.YUKASSA_RETURN_URL ||
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/client/wallet?payment=success`;

    const payment = await createDepositPayment({
      userId: session.user.id,
      amount,
      email: user.email,
      returnUrl,
    });

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        yukassaId: payment.id,
        type: "DEPOSIT",
        amount: new Prisma.Decimal(amount),
        status: "WAITING",
        description: `Пополнение баланса на ${amount} ₽`,
        metadata: { source: "client-wallet" },
        confirmationUrl: payment.confirmation?.confirmation_url || null,
      },
    });

    return { success: true, confirmationUrl: payment.confirmation?.confirmation_url || null };
  } catch (error) {
    console.error("[payments][create-deposit-error]", error);
    return { error: getPaymentErrorMessage(error, "Ошибка создания платежа") };
  }
}

export async function createWithdrawalAction(params: {
  amount: number;
  method: "CARD" | "SBP" | "WALLET";
  requisites: Record<string, string>;
}) {
  const session = await requireRole("RESPONDENT");

  if (params.amount < 100) {
    return { error: "Минимальная сумма вывода — 100 ₽" };
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    select: { id: true, balance: true },
  });

  if (!wallet || Number(wallet.balance) < params.amount) {
    return { error: "Недостаточно средств для вывода" };
  }

  try {
    let payoutId: string | null = null;
    let requestStatus = "PENDING";

    // Автоматическая выплата
    const payout = await createPayout({
      amount: params.amount,
      method: params.method.toLowerCase() as "card" | "sbp" | "wallet",
      requisites: params.requisites,
      description: `Выплата респонденту ${session.user.id}`,
    });
    
    payoutId = payout.id;
    requestStatus = "PROCESSING";

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: new Prisma.Decimal(params.amount) },
        },
      });

      const requestRecord = await tx.withdrawalRequest.create({
        data: {
          userId: session.user.id,
          amount: new Prisma.Decimal(params.amount),
          method: params.method,
          requisites: params.requisites,
          status: requestStatus as any,
          yukassaPayoutId: payoutId,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAWAL",
          amount: new Prisma.Decimal(params.amount),
          description: `Заявка на вывод #${requestRecord.id}`,
          status: requestStatus as any,
        },
      });
    });

    revalidatePath("/respondent/wallet");
    revalidatePath("/admin/finance");
    return { success: true };
  } catch (error) {
    console.error("[payments][create-withdrawal-error]", error);
    return { error: getPaymentErrorMessage(error, "Не удалось выполнить автоматическую выплату. Пожалуйста, обратитесь в поддержку.") };
  }
}

export async function approveWithdrawalAction(requestId: string) {
  await requireRole("ADMIN");

  const requestRecord = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      amount: true,
      method: true,
      requisites: true,
      status: true,
    },
  });

  if (!requestRecord || requestRecord.status !== "PENDING") {
    return { error: "Заявка не найдена или уже обработана" };
  }

  try {
    const payout = await createPayout({
      amount: Number(requestRecord.amount),
      method: requestRecord.method.toLowerCase() as "card" | "sbp" | "wallet",
      requisites: (requestRecord.requisites ?? {}) as Record<string, string>,
      description: `Выплата респонденту ${requestRecord.userId}`,
    });

    await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: "PROCESSING",
        yukassaPayoutId: payout.id,
      },
    });

    revalidatePath("/admin/finance");
    revalidatePath("/respondent/wallet");
    return { success: true };
  } catch (error) {
    console.error("[payments][approve-withdrawal-error]", error);
    return { error: getPaymentErrorMessage(error, "Не удалось отправить выплату") };
  }
}

export async function rejectWithdrawalAction(requestId: string, reason: string) {
  await requireRole("ADMIN");

  if (!reason.trim()) {
    return { error: "Укажите причину отклонения" };
  }

  const requestRecord = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      amount: true,
      status: true,
    },
  });

  if (!requestRecord || requestRecord.status !== "PENDING") {
    return { error: "Заявка не найдена или уже обработана" };
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: requestRecord.userId },
    select: { id: true },
  });

  if (!wallet) {
    return { error: "Кошелёк пользователя не найден" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: requestRecord.amount },
      },
    });

    await tx.transaction.updateMany({
      where: {
        walletId: wallet.id,
        type: "WITHDRAWAL",
        status: "PENDING",
        description: { contains: requestRecord.id },
      },
      data: {
        status: "CANCELLED",
      },
    });

    await tx.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        adminNote: reason.trim(),
      },
    });
  });

  revalidatePath("/admin/finance");
  revalidatePath("/respondent/wallet");
  return { success: true };
}
