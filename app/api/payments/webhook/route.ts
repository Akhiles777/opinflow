import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { creditDepositPaymentByYukassaId } from "@/lib/payment-processing";

type PayoutWebhookObject = {
  id?: string;
  metadata?: { withdrawalRequestId?: string };
};

function normalizeWebhookSignatureHeader(raw: string | null) {
  const s = (raw ?? "").trim();
  if (!s) return "";
  
  const m = /^sha256\s*=\s*([0-9a-f]+)$/i.exec(s);
  return (m?.[1] ?? s).toLowerCase();
}

function verifyWebhookSignature(body: string, signatureHex: string) {
  const enabled = process.env.YUKASSA_WEBHOOK_VERIFY === "1" || /^true$/i.test((process.env.YUKASSA_WEBHOOK_VERIFY ?? "").trim());
  if (!enabled) {
    return true;
  }
  const secret = (process.env.YUKASSA_WEBHOOK_SECRET ?? process.env.YUKASSA_SECRET_KEY ?? "").trim();
  if (!secret) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(body).digest("hex").toLowerCase();
  return expected === signatureHex;
}

async function findWithdrawalForPayout(object: PayoutWebhookObject | undefined) {
  if (!object) {
    return null;
  }

  const payoutId = object.id;
  const metaId = object.metadata?.withdrawalRequestId;

  if (payoutId) {
    const byPayout = await prisma.withdrawalRequest.findFirst({
      where: { yukassaPayoutId: payoutId },
      select: { id: true, userId: true, amount: true, status: true, yukassaPayoutId: true },
    });
    if (byPayout) {
      return byPayout;
    }
  }

  if (metaId) {
    return prisma.withdrawalRequest.findUnique({
      where: { id: metaId },
      select: { id: true, userId: true, amount: true, status: true, yukassaPayoutId: true },
    });
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const signatureHex = normalizeWebhookSignatureHeader(request.headers.get("authorization"));
    if (!verifyWebhookSignature(text, signatureHex)) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }
    const event = JSON.parse(text) as {
      type?: string;
      event?: string;
      object?: {
        id?: string;
        amount?: { value?: string };
        metadata?: { userId?: string; withdrawalRequestId?: string };
      };
    };
    const eventName = event.event ?? event.type;

    if (eventName === "payment.succeeded") {
      const yukassaId = event.object?.id;

      if (yukassaId) {
        await creditDepositPaymentByYukassaId(yukassaId);
      }
    }

    if (eventName === "payment.canceled") {
      const yukassaId = event.object?.id;
      if (yukassaId) {
        await prisma.payment.updateMany({
          where: { yukassaId, status: { not: "SUCCEEDED" } },
          data: { status: "CANCELED" },
        });
      }
    }

    if (eventName === "payout.succeeded") {
      const payoutObject = event.object as PayoutWebhookObject | undefined;
      const payoutId = payoutObject?.id;
      const requestRecord = await findWithdrawalForPayout(payoutObject);

      if (requestRecord && requestRecord.status !== "COMPLETED") {
        const wallet = await prisma.wallet.findUnique({
          where: { userId: requestRecord.userId },
          select: { id: true },
        });

        await prisma.$transaction(async (tx) => {
          await tx.withdrawalRequest.update({
            where: { id: requestRecord.id },
            data: {
              status: "COMPLETED",
              ...(payoutId ? { yukassaPayoutId: payoutId } : {}),
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
      }
    }

    if (eventName === "payout.failed") {
      const payoutObject = event.object as PayoutWebhookObject | undefined;
      const requestRecord = await findWithdrawalForPayout(payoutObject);

      if (requestRecord && requestRecord.status !== "FAILED" && requestRecord.status !== "COMPLETED") {
        const wallet = await prisma.wallet.findUnique({
          where: { userId: requestRecord.userId },
          select: { id: true },
        });

        if (wallet) {
          await prisma.$transaction(async (tx) => {
            await tx.withdrawalRequest.update({
              where: { id: requestRecord.id },
              data: {
                status: "FAILED",
                ...(payoutObject?.id ? { yukassaPayoutId: payoutObject.id } : {}),
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
        }
      }
    }

    if (eventName === "payout.canceled") {
      const payoutObject = event.object as PayoutWebhookObject | undefined;
      const requestRecord = await findWithdrawalForPayout(payoutObject);

      if (requestRecord && requestRecord.status !== "FAILED" && requestRecord.status !== "COMPLETED") {
        const wallet = await prisma.wallet.findUnique({
          where: { userId: requestRecord.userId },
          select: { id: true },
        });

        if (wallet) {
          await prisma.$transaction(async (tx) => {
            await tx.withdrawalRequest.update({
              where: { id: requestRecord.id },
              data: {
                status: "FAILED",
                ...(payoutObject?.id ? { yukassaPayoutId: payoutObject.id } : {}),
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
                description: `Возврат по отменённой выплате (${requestRecord.id})`,
                status: "COMPLETED",
              },
            });
          });
        }
      }
    }
  } catch (error) {
    console.error("[payments][webhook-error]", error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
