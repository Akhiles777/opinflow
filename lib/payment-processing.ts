import { prisma } from "@/lib/prisma";
import { getDepositPaymentStatus } from "@/lib/yukassa";

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
