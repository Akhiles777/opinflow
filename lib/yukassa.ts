import { createHash, randomUUID } from "node:crypto";
import { YooCheckout } from "@a2seven/yoo-checkout";
import { buildPayoutDestinationForApi, isValidSbpBankId } from "@/lib/yukassa-payout-requisites";

export { normalizeRuPhoneForYukassa } from "@/lib/yukassa-payout-requisites";

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

/** Невидимые символы и «особые» пробелы при копировании из ЛК/PDF — ломали нашу валидацию */
const CREDENTIAL_INVISIBLE = /[\uFEFF\u200B-\u200D\u2060\u00A0]/g;
/** Юникод‑дефисы в интерфейсах ЮKassa/браузера — не совпадают с ASCII "-" в regex */
const UNICODE_TO_ASCII_HYPHEN = /[\u2010\u2011\u2012\u2013\u2014\u2212\uFF0D]/g;

/** Gateway agentId (логин Basic Auth для выплат): только сам id, без пробелов/невидимых символов */
function normalizePayoutAgentId(raw: string): string {
  let s = stripCredentialOuter(raw);
  s = s.replace(CREDENTIAL_INVISIBLE, "");
  s = s.replace(UNICODE_TO_ASCII_HYPHEN, "-");
  s = s.replace(/\s+/g, "");
  return s;
}

/** Секрет шлюза выплат — одна строка */
function normalizePayoutSecretKey(raw: string): string {
  let s = stripCredentialOuter(raw);
  s = s.replace(CREDENTIAL_INVISIBLE, "");
  s = s.replace(/[\r\n\t]+/g, "");
  return s.trim();
}

/**
 * Идентификатор шлюза выплат (agentId) — НЕ shopId магазина для приёма платежей.
 * Сначала явные имена (часто в .env остаётся старое YUKASSA_PAYOUT_SHOP_ID с неверным значением).
 * @see https://yookassa.ru/developers/using-api/interaction-format — «For those who make payouts»
 */
function getPayoutAgentId(): string {
  const raw =
    process.env.YUKASSA_PAYOUT_AGENT_ID ||
    process.env.YUKASSA_GATEWAY_ID ||
    process.env.YUKASSA_PAYOUT_SHOP_ID ||
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

  if (/[\u0000-\u001F\u007F]/.test(agentId)) {
    throw new Error(
      "YUKASSA_PAYOUT_AGENT_FORMAT: В agentId есть управляющие символы. Скопируйте значение заново из личного кабинета (только строка идентификатора шлюза).",
    );
  }

  if (agentId.length > 256) {
    throw new Error(
      "YUKASSA_PAYOUT_AGENT_FORMAT: Слишком длинное значение agentId. Вероятно, в переменную попал не тот текст — нужен только идентификатор шлюза из «Настройки выплат».",
    );
  }

  // Частая ошибка: в буфер попала подпись поля или пояснение на русском
  if (/[а-яА-ЯёЁ]/.test(agentId)) {
    throw new Error(
      "YUKASSA_PAYOUT_AGENT_FORMAT: В agentId есть кириллица — обычно скопирована не та часть текста. Нужен только идентификатор шлюза (латиница/цифры), из раздела «Настройки выплат» / API шлюза.",
    );
  }

  if (secret.includes(" ") || secret.includes("\n") || secret.includes("\r") || secret.includes("\t")) {
    throw new Error(
      "YUKASSA_PAYOUT_SECRET_FORMAT: Секретный ключ шлюза не должен содержать пробелов или переносов. Вставьте ключ одной строкой.",
    );
  }

  if (/[\u0000-\u001F\u007F]/.test(secret)) {
    throw new Error(
      "YUKASSA_PAYOUT_SECRET_FORMAT: В секретном ключе есть управляющие символы. Скопируйте ключ целиком из «Интеграция → API» шлюза выплат.",
    );
  }

  if (secret.length < 10 || secret.length > 512) {
    throw new Error(
      "YUKASSA_PAYOUT_SECRET_FORMAT: Некорректная длина секретного ключа. Возьмите актуальный ключ в личном кабинете шлюза выплат (ЮKassa → интеграция API шлюза, не магазина приёма платежей).",
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

function getPayoutDestinationForRequest(params: {
  method: "card" | "sbp" | "wallet";
  requisites: Record<string, string>;
}) {
  return buildPayoutDestinationForApi(params.method, params.requisites);
}

/** Кэш списка СБП: снижает нагрузку и улучшает UX при повторном открытии модалки */
let sbpBanksCache: { expiresMs: number; banks: Array<{ bank_id: string; name: string }> } | null = null;
const SBP_BANKS_CACHE_TTL_MS = 20 * 60 * 1000;

function parseSbpBankItems(payload: unknown): Array<{ bank_id: string; name: string }> {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  let items = root.items;
  if (!Array.isArray(items) && root.data && typeof root.data === "object") {
    const data = root.data as Record<string, unknown>;
    if (Array.isArray(data.items)) {
      items = data.items;
    }
  }
  if (!Array.isArray(items)) {
    return [];
  }

  const out: Array<{ bank_id: string; name: string }> = [];
  for (const row of items) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const bank_id = typeof r.bank_id === "string" ? r.bank_id.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!bank_id || !name || !isValidSbpBankId(bank_id)) {
      continue;
    }
    out.push({ bank_id, name });
  }
  out.sort((a, b) => a.bank_id.localeCompare(b.bank_id));
  return out;
}

export async function listSbpParticipantBanks(): Promise<Array<{ bank_id: string; name: string }>> {
  ensurePayoutsConfigured();

  if (sbpBanksCache && Date.now() < sbpBanksCache.expiresMs) {
    return sbpBanksCache.banks;
  }

  const agentId = getPayoutAgentId();
  const secret = getPayoutSecretKey();
  const auth = Buffer.from(`${agentId}:${secret}`, "utf8").toString("base64");
  const response = await fetch("https://api.yookassa.ru/v3/sbp_banks", {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Accept-Charset": "utf-8",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YUKASSA_SBP_BANKS_FAILED: ${response.status} ${text}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("YUKASSA_SBP_BANKS_FAILED: INVALID_JSON_BODY");
  }

  const banks = parseSbpBankItems(payload);

  sbpBanksCache = {
    banks,
    expiresMs: Date.now() + SBP_BANKS_CACHE_TTL_MS,
  };

  return banks;
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
      payout_destination_data: getPayoutDestinationForRequest(params),
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
