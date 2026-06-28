import { createHash } from "node:crypto";

// ─── Config ──────────────────────────────────────────────────────────────────

function getConfig() {
  return {
    baseUrl: (process.env.OZON_ACQUIRING_BASE_URL ?? "https://payapi.ozon.ru").replace(/\/$/, ""),
    accessKey: process.env.OZON_ACQUIRING_ACCESS_KEY ?? "",
    secretKey: process.env.OZON_ACQUIRING_SECRET_KEY ?? "",
    notificationSecret: process.env.OZON_ACQUIRING_NOTIFICATION_SECRET ?? "",
  };
}

function ensureConfigured() {
  const { accessKey, secretKey } = getConfig();
  if (!accessKey || !secretKey) {
    throw new Error("OZON_ACQUIRING_NOT_CONFIGURED");
  }
}

// ─── Signature ────────────────────────────────────────────────────────────────

/**
 * SHA-256 over concatenated field values (no separator) + secretKey appended.
 * Field order is method-specific — caller must pass values in correct order.
 *
 * createPayment  → [extId, accessKey]
 * getPaymentDetails / cancelPayment → [id, accessKey]
 * refundPayment  → [extId, paymentId, accessKey]
 *
 * Verified against documented test vector:
 *   accessKey=63fd43a4-... secretKey=PnHtbKc0...
 *   createPayment sign([extId, accessKey]) → 406d29c45ffcb991eb40c3fbce98e714c1ed8963fee0024d7c3ba80dabc407bd
 */
export function signOzonRequest(values: string[], secretKey: string): string {
  const fingerprint = values.join("") + secretKey;
  return createHash("sha256").update(fingerprint, "utf8").digest("hex");
}

// ─── Amount conversion ────────────────────────────────────────────────────────

/**
 * UNIT NOTE (verify with a real test payment before going live):
 * createPayment amount.value is documented as a string "in the same units as webhook".
 * Webhook amount is explicitly in MINOR UNITS (kopecks), e.g. 1000 = 10.00 RUB.
 * We therefore send kopecks as a string: 100 RUB → "10000".
 * If test payments show wrong amounts, switch to amountRub.toFixed(2).
 */
function rubToMinorUnitsStr(amountRub: number): string {
  return Math.round(amountRub * 100).toString();
}

// ─── createPayment ────────────────────────────────────────────────────────────

export async function createOzonPayment(params: {
  extId: string;
  amountRub: number;
  redirectUrl: string;
  notificationUrl?: string;
  ttlSeconds?: number;
}): Promise<{ paymentId: string; sbpPayload: string } | { error: string }> {
  ensureConfigured();
  const { baseUrl, accessKey, secretKey } = getConfig();

  const requestSign = signOzonRequest([params.extId, accessKey], secretKey);

  const body: Record<string, unknown> = {
    accessKey,
    amount: {
      currencyCode: "643",
      value: rubToMinorUnitsStr(params.amountRub),
    },
    extId: params.extId,
    payType: "SBP",
    redirectUrl: params.redirectUrl,
    requestSign,
  };

  if (params.notificationUrl) body.notificationUrl = params.notificationUrl;
  if (params.ttlSeconds !== undefined) body.ttl = params.ttlSeconds;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/createPayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { error: `OZON_NETWORK_ERROR: ${err instanceof Error ? err.message : String(err)}` };
  }

  const text = await response.text();

  if (!response.ok) {
    return { error: `OZON_PAYMENT_FAILED: ${response.status} ${text.slice(0, 400)}` };
  }

  let data: {
    paymentDetails?: {
      paymentId?: string;
      sbp?: { payload?: string };
      status?: string;
    };
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return { error: `OZON_PAYMENT_INVALID_JSON: ${text.slice(0, 400)}` };
  }

  const paymentId = data.paymentDetails?.paymentId;
  const sbpPayload = data.paymentDetails?.sbp?.payload;

  if (!paymentId || !sbpPayload) {
    return { error: `OZON_PAYMENT_MISSING_FIELDS: ${text.slice(0, 400)}` };
  }

  return { paymentId, sbpPayload };
}

// ─── getPaymentDetails ────────────────────────────────────────────────────────

export type OzonOperation = {
  status: string;
  operationType: string;
  amount: { currencyCode: string; value: string };
  extId: string;
  operationTime: string;
  transactionUid: string;
};

export async function getOzonPaymentStatus(
  paymentId: string,
): Promise<{ operations: OzonOperation[] } | { error: string }> {
  ensureConfigured();
  const { baseUrl, accessKey, secretKey } = getConfig();

  const requestSign = signOzonRequest([paymentId, accessKey], secretKey);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/getPaymentDetails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey, id: paymentId, requestSign }),
    });
  } catch (err) {
    return { error: `OZON_NETWORK_ERROR: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!response.ok) {
    const text = await response.text();
    return { error: `OZON_STATUS_FAILED: ${response.status} ${text.slice(0, 400)}` };
  }

  const data = (await response.json()) as { items?: OzonOperation[] };
  return { operations: data.items ?? [] };
}

// ─── cancelPayment ────────────────────────────────────────────────────────────

export async function cancelOzonPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
  ensureConfigured();
  const { baseUrl, accessKey, secretKey } = getConfig();

  const requestSign = signOzonRequest([paymentId, accessKey], secretKey);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/cancelPayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey, id: paymentId, requestSign }),
    });
  } catch (err) {
    return { success: false, error: `OZON_NETWORK_ERROR: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: `OZON_CANCEL_FAILED: ${response.status} ${text.slice(0, 400)}` };
  }

  return { success: true };
}

// ─── refundPayment ────────────────────────────────────────────────────────────

export async function refundOzonPayment(params: {
  paymentId: string;
  extId: string;
  amountRub: number;
}): Promise<{ success: boolean; error?: string }> {
  ensureConfigured();
  const { baseUrl, accessKey, secretKey } = getConfig();

  const requestSign = signOzonRequest([params.extId, params.paymentId, accessKey], secretKey);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/refundPayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessKey,
        extId: params.extId,
        paymentId: params.paymentId,
        amount: {
          currencyCode: "643",
          value: rubToMinorUnitsStr(params.amountRub),
        },
        requestSign,
      }),
    });
  } catch (err) {
    return { success: false, error: `OZON_NETWORK_ERROR: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!response.ok) {
    const text = await response.text();
    return { success: false, error: `OZON_REFUND_FAILED: ${response.status} ${text.slice(0, 400)}` };
  }

  return { success: true };
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export type OzonWebhookPayload = {
  transactionUID: string;
  /** Amount in minor units (kopecks). 1000 = 10.00 RUB */
  amount: number;
  currencyCode: string;
  paymentTime: string;
  status: "Completed" | "Rejected" | "Authorized" | string;
  operationType: string;
  paymentMethod: string;
  requestSign: string;
  /** Matches the extId we sent in createPayment — used to find our payment record */
  extTransactionID: string;
  errorCode?: number;
  errorMessage?: string;
};

/**
 * Verifies the Ozon standalone-payment webhook signature.
 *
 * Formula (from docs):
 *   SHA256("{accessKey}|||{extTransactionID}|{amount}|{currencyCode}|{notificationSecretKey}")
 *
 * The three consecutive pipes are intentional — positions for orderId and transactionId
 * that are absent in standalone payments but keep the separator structure.
 *
 * Set OZON_WEBHOOK_VERIFY=0 to disable verification in development.
 */
export function verifyOzonWebhookSignature(payload: OzonWebhookPayload): boolean {
  const verifyEnabled = (process.env.OZON_WEBHOOK_VERIFY ?? "1") !== "0";
  if (!verifyEnabled) return true;

  const { accessKey, notificationSecret } = getConfig();
  if (!accessKey || !notificationSecret) return false;

  const fingerprint = `${accessKey}|||${payload.extTransactionID}|${payload.amount}|${payload.currencyCode}|${notificationSecret}`;
  const computed = createHash("sha256").update(fingerprint, "utf8").digest("hex");
  return computed === payload.requestSign;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

/** Terminal success: payment fully settled */
export function isOzonPaymentConfirmed(operations: OzonOperation[]): boolean {
  return operations.some(
    (op) => op.operationType === "PAYMENT" && op.status === "PAYMENT_CONFIRMED",
  );
}

/** Terminal failure: payment rejected or canceled */
export function isOzonPaymentFailed(operations: OzonOperation[]): boolean {
  return operations.some(
    (op) =>
      op.operationType === "PAYMENT" &&
      (op.status === "PAYMENT_REJECTED" || op.status === "PAYMENT_CANCELED"),
  );
}
