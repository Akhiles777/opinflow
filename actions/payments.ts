"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { assertPayoutRequisitesValid, normalizeWithdrawalRequisitesForStorage } from "@/lib/yukassa-payout-requisites";
import { createDepositPayment, createPayout } from "@/lib/yukassa";

function withdrawalMethodToPayoutApi(method: "CARD" | "SBP" | "WALLET"): "card" | "sbp" | "wallet" {
  if (method === "CARD") return "card";
  if (method === "SBP") return "sbp";
  return "wallet";
}

function yukassaPayoutDescription(message: string): string | null {
  if (!message.includes("YUKASSA_PAYOUT_FAILED:")) {
    return null;
  }
  const withoutPrefix = message.replace(/^YUKASSA_PAYOUT_FAILED:\s*\d+\s+/, "").trim();
  try {
    const data = JSON.parse(withoutPrefix) as { description?: string; code?: string };
    if (typeof data.description === "string" && data.description.trim()) {
      return data.description.trim();
    }
  } catch {
    // not JSON
  }
  return withoutPrefix.length > 320 ? `${withoutPrefix.slice(0, 320)}…` : withoutPrefix;
}

function getPaymentErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message.includes("YUKASSA_NOT_CONFIGURED")) {
    return "Платёжный сервис пока не настроен.";
  }
  if (error.message.includes("YUKASSA_PAYOUT_NOT_CONFIGURED")) {
    return "Сервис выплат не настроен. В .env укажите agentId шлюза выплат и секрет: YUKASSA_PAYOUT_AGENT_ID (или YUKASSA_PAYOUT_SHOP_ID / YUKASSA_GATEWAY_ID) и YUKASSA_PAYOUT_SECRET_KEY — из раздела «Интеграция → API» именно шлюза выплат, не магазина приёма платежей. Подробнее: https://yookassa.ru/developers/using-api/interaction-format";
  }

  if (error.message.includes("YUKASSA_PAYOUT_AGENT_FORMAT") || error.message.includes("YUKASSA_PAYOUT_SECRET_FORMAT")) {
    const trimmed = error.message.replace(/^[^:]+:\s*/, "").trim();
    return trimmed.length > 0 ? trimmed : "Проверьте переменные выплат в .env: логин — только agentId шлюза, секрет — отдельной строкой, без пробелов и кавычек.";
  }

  if (error.message.startsWith("PAYOUT_REQUISITES:")) {
    return error.message.replace(/^PAYOUT_REQUISITES:\s*/, "").trim();
  }

  const payoutHuman = yukassaPayoutDescription(error.message);
  if (payoutHuman && /login.*illegal format|illegal format.*login/i.test(payoutHuman)) {
    return "ЮKassa: неверный логин (agentId) или секрет для Basic Auth. Для выплат нужен идентификатор шлюза из «Настройки выплат» и секрет из «Интеграция → API» этого шлюза — не shopId магазина и не ключ приёма платежей. Уберите пробелы, кавычки и переносы в переменных окружения.";
  }
  if (payoutHuman && /illegal_account_number/i.test(payoutHuman)) {
    return "ЮKassa отклонила выплату: неверный номер получателя. Номер кошелька ЮMoney — 11–33 цифры (не путайте с номером карты). Номер карты — 16–19 цифр; перевод на карту по номеру с вашей стороны допустим только при PCI DSS. По СБП: телефон 11 цифр с 7, банк — из списка ЮKassa (идентификатор 12 символов).";
  }
  if (payoutHuman) {
    return `ЮKassa отклонила выплату: ${payoutHuman}`;
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

  try {
    assertPayoutRequisitesValid(withdrawalMethodToPayoutApi(params.method), params.requisites);
  } catch (validationError) {
    if (validationError instanceof Error && validationError.message.startsWith("PAYOUT_REQUISITES:")) {
      return { error: validationError.message.replace(/^PAYOUT_REQUISITES:\s*/, "").trim() };
    }
    throw validationError;
  }

  const cleanedRequisites = normalizeWithdrawalRequisitesForStorage(params.method, params.requisites);

  const reserve = await prisma.$transaction(async (tx) => {
    const walletRow = await tx.wallet.findUnique({
      where: { userId: session.user.id },
      select: { id: true, balance: true },
    });

    if (!walletRow || Number(walletRow.balance) < params.amount) {
      return { ok: false as const, reason: "INSUFFICIENT" as const };
    }

    await tx.wallet.update({
      where: { id: walletRow.id },
      data: {
        balance: { decrement: new Prisma.Decimal(params.amount) },
      },
    });

    const requestRecord = await tx.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        amount: new Prisma.Decimal(params.amount),
        method: params.method,
        requisites: cleanedRequisites,
        status: "PENDING",
        yukassaPayoutId: null,
      },
    });

    await tx.transaction.create({
      data: {
        walletId: walletRow.id,
        type: "WITHDRAWAL",
        amount: new Prisma.Decimal(params.amount),
        description: `Заявка на вывод #${requestRecord.id}`,
        status: "PENDING",
      },
    });

    return { ok: true as const, walletId: walletRow.id, requestId: requestRecord.id };
  });

  if (!reserve.ok) {
    return { error: "Недостаточно средств для вывода" };
  }

  try {
    const payout = await createPayout({
      amount: params.amount,
      method: withdrawalMethodToPayoutApi(params.method),
      requisites: cleanedRequisites,
      description: `Выплата респонденту ${session.user.id}`,
      metadata: { withdrawalRequestId: reserve.requestId },
      idempotenceKey: `wd-req-${reserve.requestId}`,
    });

    await prisma.withdrawalRequest.update({
      where: { id: reserve.requestId },
      data: {
        status: "PROCESSING",
        yukassaPayoutId: payout.id,
      },
    });

    revalidatePath("/respondent/wallet");
    revalidatePath("/admin/finance");
    return { success: true };
  } catch (error) {
    console.error("[payments][create-withdrawal-error]", error);

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: reserve.walletId },
        data: {
          balance: { increment: new Prisma.Decimal(params.amount) },
        },
      });

      await tx.withdrawalRequest.update({
        where: { id: reserve.requestId },
        data: { status: "FAILED" },
      });

      await tx.transaction.updateMany({
        where: {
          walletId: reserve.walletId,
          type: "WITHDRAWAL",
          status: "PENDING",
          description: { contains: reserve.requestId },
        },
        data: { status: "FAILED" },
      });

      await tx.transaction.create({
        data: {
          walletId: reserve.walletId,
          type: "REFUND",
          amount: new Prisma.Decimal(params.amount),
          description: `Возврат: ЮKassa не приняла выплату (заявка #${reserve.requestId})`,
          status: "COMPLETED",
        },
      });
    });

    revalidatePath("/respondent/wallet");
    revalidatePath("/admin/finance");

    return {
      error: getPaymentErrorMessage(
        error,
        "Не удалось выполнить автоматическую выплату. Пожалуйста, обратитесь в поддержку.",
      ),
    };
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

  const storedRequisites = (requestRecord.requisites ?? {}) as Record<string, string>;

  try {
    assertPayoutRequisitesValid(withdrawalMethodToPayoutApi(requestRecord.method), storedRequisites);
  } catch (validationError) {
    if (validationError instanceof Error && validationError.message.startsWith("PAYOUT_REQUISITES:")) {
      return { error: validationError.message.replace(/^PAYOUT_REQUISITES:\s*/, "").trim() };
    }
    throw validationError;
  }

  const cleanedRequisites = normalizeWithdrawalRequisitesForStorage(requestRecord.method, storedRequisites);

  try {
    const payout = await createPayout({
      amount: Number(requestRecord.amount),
      method: withdrawalMethodToPayoutApi(requestRecord.method),
      requisites: cleanedRequisites,
      description: `Выплата респонденту ${requestRecord.userId}`,
      metadata: { withdrawalRequestId: requestId },
      idempotenceKey: `admin-approve-${requestId}`,
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

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        amount: requestRecord.amount,
        description: `Возврат по отклонённой заявке #${requestRecord.id}`,
        status: "COMPLETED",
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
