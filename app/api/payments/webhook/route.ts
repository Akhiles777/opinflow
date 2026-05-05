import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const event = JSON.parse(text) as {
      type?: string;
      object?: {
        id?: string;
        amount?: { value?: string };
        metadata?: { userId?: string };
      };
    };

    if (event.type === "payment.succeeded") {
      const yukassaId = event.object?.id;
      const amount = Number(event.object?.amount?.value ?? 0);
      const userId = event.object?.metadata?.userId;

      if (yukassaId && userId) {
        const payment = await prisma.payment.findUnique({
          where: { yukassaId },
          select: { id: true, userId: true, status: true },
        });

        if (payment && payment.status !== "SUCCEEDED") {
          const wallet = await prisma.wallet.findUnique({
            where: { userId: payment.userId },
            select: { id: true },
          });

          if (wallet) {
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: { status: "SUCCEEDED" },
              });

              await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                  balance: { increment: new Prisma.Decimal(amount) },
                },
              });

              await tx.transaction.create({
                data: {
                  walletId: wallet.id,
                  type: "DEPOSIT",
                  amount: new Prisma.Decimal(amount),
                  description: `Пополнение баланса через ЮKassa (${yukassaId})`,
                  status: "COMPLETED",
                },
              });
            });
          }
        }
      }
    }

    if (event.type === "payment.canceled") {
      const yukassaId = event.object?.id;
      if (yukassaId) {
        await prisma.payment.updateMany({
          where: { yukassaId, status: { not: "SUCCEEDED" } },
          data: { status: "CANCELED" },
        });
      }
    }

    if (event.type === "payout.succeeded") {
      const payoutId = event.object?.id;
      if (payoutId) {
        const requestRecord = await prisma.withdrawalRequest.findFirst({
          where: { yukassaPayoutId: payoutId },
          select: { id: true, userId: true, amount: true, status: true },
        });

        if (requestRecord && requestRecord.status !== "COMPLETED") {
          const wallet = await prisma.wallet.findUnique({
            where: { userId: requestRecord.userId },
            select: { id: true },
          });

          await prisma.$transaction(async (tx) => {
            await tx.withdrawalRequest.update({
              where: { id: requestRecord.id },
              data: { status: "COMPLETED" },
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
        }
      }
    }

    if (event.type === "payout.failed") {
      const payoutId = event.object?.id;
      if (payoutId) {
        const requestRecord = await prisma.withdrawalRequest.findFirst({
          where: { yukassaPayoutId: payoutId },
          select: { id: true, userId: true, amount: true, status: true },
        });

        if (requestRecord && requestRecord.status !== "FAILED" && requestRecord.status !== "COMPLETED") {
          const wallet = await prisma.wallet.findUnique({
            where: { userId: requestRecord.userId },
            select: { id: true },
          });

          if (wallet) {
            await prisma.$transaction(async (tx) => {
              await tx.withdrawalRequest.update({
                where: { id: requestRecord.id },
                data: { status: "FAILED" },
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
          }
        }
      }
    }
  } catch (error) {
    console.error("[payments][webhook-error]", error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
