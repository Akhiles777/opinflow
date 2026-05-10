import { prisma } from "@/lib/prisma";
import { getDepositPaymentStatus, getPayoutStatus } from "@/lib/yukassa";
import { Prisma } from "@prisma/client";

async function creditDepositPayment(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        userId: true,
        yukassaId: true,
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

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount: payment.amount,
        description: `Пополнение баланса через ЮKassa (${payment.yukassaId ?? payment.id})`,
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

export async function syncWaitingDepositPayments(userId: string) {
  const payments = await prisma.payment.findMany({
    where: {
      userId,
      type: "DEPOSIT",
      status: "WAITING",
      yukassaId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, yukassaId: true },
  });

  for (const payment of payments) {
    if (!payment.yukassaId) {
      continue;
    }

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
      console.error("[payments][deposit-sync-error]", error);
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

  for (const row of processing) {
    const payoutId = row.yukassaPayoutId;
    if (!payoutId) continue;
    checked += 1;
    try {
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
