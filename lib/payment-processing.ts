import { prisma } from "@/lib/prisma";
import { getDepositPaymentStatus, getPayoutStatus } from "@/lib/yukassa";
import { getMozenPayoutStatus, mapMozenStatus } from "@/lib/mozen";
import { getOzonPaymentStatus, isOzonPaymentConfirmed, isOzonPaymentFailed } from "@/lib/ozon-acquiring";
import { Prisma } from "@prisma/client";
import { notify } from "@/lib/notifications";

function isMozenProvider(): boolean {
  return (process.env.PAYOUT_PROVIDER ?? "").trim().toLowerCase() === "mozen";
}

async function creditDepositPayment(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        yukassaId: true,
        ozonPaymentId: true,
        type: true,
        amount: true,
        status: true,
      },
    });

    if (!payment || payment.type !== "DEPOSIT" || payment.status === "SUCCEEDED") {
      return false;
    }

    const wallet = await tx.wallet.findUnique({
      where: { userId: payment.userId },
      select: { id: true },
    });

    if (!wallet) {
      return false;
    }

    const updated = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "SUCCEEDED" } },
      data: { status: "SUCCEEDED" },
    });

    if (updated.count === 0) {
      return false;
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: payment.amount },
      },
    });

    const description = payment.yukassaId
      ? `Пополнение баланса через ЮKassa (${payment.yukassaId})`
      : payment.ozonPaymentId
        ? `Пополнение баланса через Ozon СБП (${payment.ozonPaymentId})`
        : `Пополнение баланса (${payment.id})`;

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount: payment.amount,
        description,
        status: "COMPLETED",
      },
    });

    return true;
  });
}

export async function creditDepositPaymentByYukassaId(yukassaId: string) {
  const payment = await prisma.payment.findUnique({
    where: { yukassaId },
    select: { id: true },
  });

  if (!payment) {
    return false;
  }

  return creditDepositPayment(payment.id);
}

export async function creditDepositPaymentByOzonExtId(ozonExtId: string) {
  const payment = await prisma.payment.findUnique({
    where: { ozonExtId },
    select: { id: true, status: true },
  });

  if (!payment || payment.status === "SUCCEEDED") {
    return false;
  }

  return creditDepositPayment(payment.id);
}

export async function syncWaitingDepositPayments(userId: string) {
  const payments = await prisma.payment.findMany({
    where: {
      userId,
      type: "DEPOSIT",
      status: "WAITING",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, yukassaId: true, ozonExtId: true, ozonPaymentId: true },
  });

  for (const payment of payments) {
    // ── YuKassa ──────────────────────────────────────────────────────────────
    if (payment.yukassaId) {
      try {
        const remote = await getDepositPaymentStatus(payment.yukassaId);
        if (remote.status === "succeeded" && remote.paid === true) {
          await creditDepositPayment(payment.id);
        }
        if (remote.status === "canceled") {
          await prisma.payment.updateMany({
            where: { id: payment.id, status: { not: "SUCCEEDED" } },
            data: { status: "CANCELED" },
          });
        }
      } catch (error) {
        console.error("[payments][deposit-sync-yukassa]", error);
      }
      continue;
    }

    // ── Ozon Acquiring ───────────────────────────────────────────────────────
    if (payment.ozonPaymentId) {
      try {
        const remote = await getOzonPaymentStatus(payment.ozonPaymentId);
        if ("error" in remote) continue;

        if (isOzonPaymentConfirmed(remote.operations)) {
          await creditDepositPayment(payment.id);
        } else if (isOzonPaymentFailed(remote.operations)) {
          await prisma.payment.updateMany({
            where: { id: payment.id, status: { not: "SUCCEEDED" } },
            data: { status: "CANCELED" },
          });
        }
      } catch (error) {
        console.error("[payments][deposit-sync-ozon]", error);
      }
    }
  }
}

export async function completeWithdrawalRequest(params: { requestId: string; payoutId?: string | null }) {
  const requestRecord = await prisma.withdrawalRequest.findUnique({
    where: { id: params.requestId },
    select: { id: true, userId: true, amount: true, status: true },
  });

  if (!requestRecord || requestRecord.status === "COMPLETED") {
    return false;
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: requestRecord.userId },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.withdrawalRequest.update({
      where: { id: requestRecord.id },
      data: {
        status: "COMPLETED",
        ...(params.payoutId ? { yukassaPayoutId: params.payoutId } : {}),
      },
    });

    if (wallet) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          totalSpent: { increment: requestRecord.amount as Prisma.Decimal },
        },
      });

      await tx.transaction.updateMany({
        where: {
          walletId: wallet.id,
          type: "WITHDRAWAL",
          status: "PENDING",
          description: { contains: requestRecord.id },
        },
        data: { status: "COMPLETED" },
      });
    }
  });

  await notify({
    userId: requestRecord.userId,
    type: "WITHDRAWAL_STATUS",
    title: "Вывод средств выполнен",
    body: `Заявка на ${Number(requestRecord.amount)} ₽ успешно обработана`,
    link: "/respondent/wallet",
    emailData: {
      amount: Number(requestRecord.amount),
      status: "COMPLETED",
    },
  });

  return true;
}

export async function failWithdrawalRequest(params: { requestId: string; payoutId?: string | null }) {
  const requestRecord = await prisma.withdrawalRequest.findUnique({
    where: { id: params.requestId },
    select: { id: true, userId: true, amount: true, status: true },
  });

  if (!requestRecord || requestRecord.status === "FAILED" || requestRecord.status === "COMPLETED") {
    return false;
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: requestRecord.userId },
    select: { id: true },
  });

  if (!wallet) {
    await prisma.withdrawalRequest.update({
      where: { id: requestRecord.id },
      data: {
        status: "FAILED",
        ...(params.payoutId ? { yukassaPayoutId: params.payoutId } : {}),
      },
    });
    return true;
  }

  await prisma.$transaction(async (tx) => {
    await tx.withdrawalRequest.update({
      where: { id: requestRecord.id },
      data: {
        status: "FAILED",
        ...(params.payoutId ? { yukassaPayoutId: params.payoutId } : {}),
      },
    });

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
      data: { status: "FAILED" },
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        amount: requestRecord.amount,
        description: `Возврат по неуспешной выплате (${requestRecord.id})`,
        status: "COMPLETED",
      },
    });
  });

  await notify({
    userId: requestRecord.userId,
    type: "WITHDRAWAL_STATUS",
    title: "Выплата не выполнена",
    body: `Не удалось выполнить вывод ${Number(requestRecord.amount)} ₽, средства возвращены на баланс`,
    link: "/respondent/wallet",
    emailData: {
      amount: Number(requestRecord.amount),
      status: "FAILED",
    },
  });

  return true;
}

export async function syncProcessingWithdrawals(params?: { limit?: number }) {
  const limit = Math.max(1, Math.min(200, params?.limit ?? 50));
  const processing = await prisma.withdrawalRequest.findMany({
    where: { status: "PROCESSING", yukassaPayoutId: { not: null } },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { id: true, yukassaPayoutId: true },
  });

  let completed = 0;
  let failed = 0;
  let checked = 0;

  const useMozen = isMozenProvider();

  for (const row of processing) {
    const payoutId = row.yukassaPayoutId;
    if (!payoutId) continue;
    checked += 1;
    try {
      if (useMozen) {
        const remote = await getMozenPayoutStatus(payoutId);
        const status = mapMozenStatus(remote.status);

        if (status === "succeeded") {
          if (await completeWithdrawalRequest({ requestId: row.id, payoutId })) completed += 1;
        } else if (status === "failed") {
          if (await failWithdrawalRequest({ requestId: row.id, payoutId })) failed += 1;
        }
        continue;
      }

      const remote = await getPayoutStatus(payoutId);
      const status = (remote.status ?? "").toLowerCase();

      if (status === "succeeded") {
        if (await completeWithdrawalRequest({ requestId: row.id, payoutId: remote.id })) {
          completed += 1;
        }
        continue;
      }

      if (status === "canceled" || status === "failed") {
        if (await failWithdrawalRequest({ requestId: row.id, payoutId: remote.id })) {
          failed += 1;
        }
      }
    } catch (error) {
      console.error("[payments][payout-sync-error]", { payoutId, requestId: row.id, error });
    }
  }

  return { checked, completed, failed };
}
