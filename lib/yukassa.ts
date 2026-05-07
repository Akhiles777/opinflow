import { YooCheckout } from "@a2seven/yoo-checkout";

const paymentsShopId = process.env.YUKASSA_SHOP_ID;
const paymentsSecretKey = process.env.YUKASSA_SECRET_KEY;
const payoutShopId = process.env.YUKASSA_PAYOUT_SHOP_ID;
const payoutSecretKey = process.env.YUKASSA_PAYOUT_SECRET_KEY;

const yukassaPayments = new YooCheckout({
  shopId: paymentsShopId || "",
  secretKey: paymentsSecretKey || "",
});

function toMoneyString(amount: number) {
  return amount.toFixed(2);
}

function ensurePaymentsConfigured() {
  if (!paymentsShopId || !paymentsSecretKey) {
    throw new Error("YUKASSA_NOT_CONFIGURED");
  }
}

function ensurePayoutsConfigured() {
  if (!payoutShopId || !payoutSecretKey) {
    throw new Error("YUKASSA_PAYOUT_NOT_CONFIGURED");
  }
}

export async function createDepositPayment(params: {
  userId: string;
  amount: number;
  email: string;
  returnUrl: string;
}): Promise<{
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string | null } | null;
}> {
  ensurePaymentsConfigured();

  const payment = await yukassaPayments.createPayment(
    {
      amount: {
        value: toMoneyString(params.amount),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: params.returnUrl,
      },
      description: `Пополнение баланса на ${params.amount} ₽`,
      receipt: {
        customer: {
          email: params.email,
        },
        items: [
          {
            description: `Пополнение баланса на ${params.amount} ₽`,
            quantity: "1.00",
            amount: {
              value: toMoneyString(params.amount),
              currency: "RUB",
            },
            vat_code: 1,
            payment_mode: "full_payment",
            payment_subject: "service",
          },
        ],
      },
      metadata: {
        userId: params.userId,
        type: "deposit",
      },
    },
    `deposit-${params.userId}-${Date.now()}`,
  );

  return payment as {
    id: string;
    status: string;
    confirmation?: { confirmation_url?: string | null } | null;
  };
}

export async function getDepositPaymentStatus(yukassaId: string): Promise<{
  id: string;
  status: string;
  paid?: boolean;
}> {
  ensurePaymentsConfigured();

  const auth = Buffer.from(`${paymentsShopId}:${paymentsSecretKey}`).toString("base64");
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${yukassaId}`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YUKASSA_PAYMENT_STATUS_FAILED: ${response.status} ${text}`);
  }

  return (await response.json()) as { id: string; status: string; paid?: boolean };
}

function getPayoutDestinationData(params: {
  method: "card" | "sbp" | "wallet";
  requisites: Record<string, string>;
}) {
  if (params.method === "card") {
    return {
      type: "bank_card",
      card: {
        number: params.requisites.cardNumber,
      },
    };
  }

  if (params.method === "sbp") {
    return {
      type: "sbp",
      phone: params.requisites.phone,
      bank_id: params.requisites.bankId,
    };
  }

  return {
    type: "yoo_money",
    account_number: params.requisites.walletNumber,
  };
}

export async function createPayout(params: {
  amount: number;
  method: "card" | "sbp" | "wallet";
  requisites: Record<string, string>;
  description: string;
}): Promise<{ id: string; status: string }> {
  ensurePayoutsConfigured();

  const auth = Buffer.from(`${payoutShopId}:${payoutSecretKey}`).toString("base64");
  const response = await fetch("https://yookassa.ru/api/v3/payouts", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      "Idempotence-Key": `payout-${Date.now()}-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({
      amount: {
        value: toMoneyString(params.amount),
        currency: "RUB",
      },
      payout_destination_data: getPayoutDestinationData(params),
      description: params.description,
      metadata: { type: "payout" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YUKASSA_PAYOUT_FAILED: ${response.status} ${text}`);
  }

  return (await response.json()) as { id: string; status: string };
}
