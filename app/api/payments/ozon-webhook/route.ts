import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  type OzonWebhookPayload,
  verifyOzonWebhookSignature,
} from "@/lib/ozon-acquiring";
import { creditDepositPaymentByOzonExtId } from "@/lib/payment-processing";
import { notify } from "@/lib/notifications";

export async function POST(request: Request) {
  let payload: OzonWebhookPayload;

  try {
    const text = await request.text();
    payload = JSON.parse(text) as OzonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  // ── Signature verification ───────────────────────────────────────────────
  if (!verifyOzonWebhookSignature(payload)) {
    console.warn("[ozon-webhook] invalid signature", { extTransactionID: payload.extTransactionID });
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  const { extTransactionID, status, errorCode, errorMessage } = payload;

  // ── Respond 200 immediately before heavy processing ──────────────────────
  // (prevents Ozon from treating slow DB operations as failures and retrying)
  void processWebhook({ extTransactionID, status, errorCode, errorMessage });

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processWebhook(params: {
  extTransactionID: string;
  status: string;
  errorCode?: number;
  errorMessage?: string;
}) {
  const { extTransactionID, status, errorCode, errorMessage } = params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { ozonExtId: extTransactionID },
      select: { id: true, userId: true, amount: true, status: true },
    });

    if (!payment) {
      console.error("[ozon-webhook] payment not found", { extTransactionID });
      return;
    }

    if (status === "Completed") {
      // Idempotent — creditDepositPaymentByOzonExtId checks status before crediting
      const credited = await creditDepositPaymentByOzonExtId(extTransactionID);
      if (credited) {
        void notify({
          userId: payment.userId,
          type: "SYSTEM",
          title: "Баланс пополнен",
          body: `${Number(payment.amount)} ₽ зачислено через Ozon СБП`,
          link: "/client/wallet",
        }).catch(console.error);
      }
      return;
    }

    if (status === "Rejected") {
      await prisma.payment.updateMany({
        where: { id: payment.id, status: { not: "SUCCEEDED" } },
        data: {
          status: "CANCELED",
          metadata: {
            ozonError: errorCode ?? null,
            ozonErrorMessage: errorMessage ?? null,
          },
        },
      });
      return;
    }

    // "Authorized" — two-stage capture (not used in self-service SBP flow),
    // log and ignore
    console.info("[ozon-webhook] unhandled status", { status, extTransactionID });
  } catch (error) {
    console.error("[ozon-webhook] processing error", { extTransactionID, error });
  }
}
