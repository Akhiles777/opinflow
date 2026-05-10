import { createHash, randomUUID } from "node:crypto";
import { YooCheckout } from "@a2seven/yoo-checkout";

const paymentsShopId = process.env.YUKASSA_SHOP_ID;
const paymentsSecretKey = process.env.YUKASSA_SECRET_KEY;

const yukassaPayments = new YooCheckout({
  shopId: paymentsShopId || "",
  secretKey: paymentsSecretKey || "",
});

function toMoneyString(amount: number) {
  return amount.toFixed(2);
}

/** Trim, strip BOM, strip wrapping quotes (typical .env / Vercel paste issues) */
function stripCredentialOuter(raw: string): string {
  let s = (raw ?? "").toString();
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1);
  }
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/** Gateway agentId (логин Basic Auth для выплат) — без пробелов и переводов строк внутри */
function normalizePayoutAgentId(raw: string): string {
  return stripCredentialOuter(raw).replace(/\s+/g, "");
}

/** Секрет шлюза выплат — одна строка, без переносов */
function normalizePayoutSecretKey(raw: string): string {
  return stripCredentialOuter(raw).replace(/[\r\n\t]+/g, "").trim();
}

/**
 * Идентификатор шлюза выплат (agentId) — НЕ shopId магазина для приёма платежей.
 * @see https://yookassa.ru/developers/using-api/interaction-format — раздел «For those who make payouts»
 */
function getPayoutAgentId(): string {
  const raw =
    process.env.YUKASSA_PAYOUT_SHOP_ID ||
    process.env.YUKASSA_PAYOUT_AGENT_ID ||
    process.env.YUKASSA_GATEWAY_ID ||
    "";
  return normalizePayoutAgentId(raw);
}

function getPayoutSecretKey(): string {
  const raw =
    process.env.YUKASSA_PAYOUT_SECRET_KEY ||
    process.env.YUKASSA_GATEWAY_SECRET_KEY ||
    "";
  return normalizePayoutSecretKey(raw);
}

/** ЮKassa: длина ключа идемпотентности не более 64 символов */
function toYukassaIdempotenceKey(key: string): string {
  const trimmed = stripCredentialOuter(key);
  if (trimmed.length <= 64) {
    return trimmed;
  }
  return createHash("sha256").update(trimmed, "utf8").digest("hex");
}

function ensurePaymentsConfigured() {
  if (!paymentsShopId || !paymentsSecretKey) {
    throw new Error("YUKASSA_NOT_CONFIGURED");
  }
}

function ensurePayoutsConfigured() {
  const agentId = getPayoutAgentId();
  const secret = getPayoutSecretKey();

  if (!agentId || !secret) {
    throw new Error("YUKASSA_PAYOUT_NOT_CONFIGURED");
  }

  if (agentId.includes(":")) {
    throw new Error(
      "YUKASSA_PAYOUT_AGENT_FORMAT: В логин Basic Auth попало значение с «:». Укажите отдельно только agentId шлюза (поле в кабинете ЮKassa), без секретного ключа. Секрет — только в YUKASSA_PAYOUT_SECRET_KEY.",
    );
  }

  if (!/^[A-Za-z0-9_.-]+$/.test(agentId)) {
    throw new Error(
      "YUKASSA_PAYOUT_AGENT_FORMAT: agentId шлюза выплат содержит недопустимые символы. Скопируйте идентификатор из «Настройки выплат» без кавычек и пробелов.",
    );
  }

  if (secret.includes(" ") || secret.includes("\n")) {
    throw new Error(
      "YUKASSA_PAYOUT_SECRET_FORMAT: Секретный ключ шлюза не должен содержать пробелов или переносов. Вставьте ключ одной строкой.",
    );
  }

  if (!/^[\x21-\x7E]+$/.test(secret)) {
    throw new Error(
      "YUKASSA_PAYOUT_SECRET_FORMAT: Секретный ключ должен быть в видимых ASCII-символах. Проверьте .env на невидимые символы.",
    );
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

  const auth = Buffer.from(`${paymentsShopId}:${paymentsSecretKey}`, "utf8").toString("base64");
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

/** E.164-style 11 digits for RU mobile, as expected by YooMoney SBP payouts */
export function normalizeRuPhoneForYukassa(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) {
    digits = `7${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }
  return digits;
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
      phone: normalizeRuPhoneForYukassa(params.requisites.phone),
      bank_id: params.requisites.bankId,
    };
  }

  return {
    type: "yoo_money",
    account_number: params.requisites.walletNumber,
  };
}

export async function listSbpParticipantBanks(): Promise<Array<{ bank_id: string; name: string }>> {
  ensurePayoutsConfigured();

  const agentId = getPayoutAgentId();
  const secret = getPayoutSecretKey();
  const auth = Buffer.from(`${agentId}:${secret}`, "utf8").toString("base64");
  const response = await fetch("https://api.yookassa.ru/v3/sbp_banks", {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YUKASSA_SBP_BANKS_FAILED: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{ bank_id?: string; name?: string }>;
  };
  const items = payload.items ?? [];
  return items
    .filter((row) => typeof row.bank_id === "string" && typeof row.name === "string")
    .map((row) => ({ bank_id: row.bank_id as string, name: row.name as string }));
}

export async function createPayout(params: {
  amount: number;
  method: "card" | "sbp" | "wallet";
  requisites: Record<string, string>;
  description: string;
  metadata?: Record<string, string>;
  idempotenceKey?: string;
}): Promise<{ id: string; status: string }> {
  ensurePayoutsConfigured();

  const agentId = getPayoutAgentId();
  const secret = getPayoutSecretKey();
  const auth = Buffer.from(`${agentId}:${secret}`, "utf8").toString("base64");
  const idempotenceKey = toYukassaIdempotenceKey(params.idempotenceKey ?? randomUUID());
  const metadata = { type: "payout", ...params.metadata };

  const response = await fetch("https://api.yookassa.ru/v3/payouts", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: toMoneyString(params.amount),
        currency: "RUB",
      },
      payout_destination_data: getPayoutDestinationData(params),
      description: params.description,
      metadata,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YUKASSA_PAYOUT_FAILED: ${response.status} ${text}`);
  }

  return (await response.json()) as { id: string; status: string };
}
