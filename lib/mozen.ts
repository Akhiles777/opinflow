import { prisma } from "@/lib/prisma";

// Mozen Scrap (https://hmetal.mozenscrap.ru) — alternative payout provider.
// Docs: https://forcode.gitbook.io/mozen-scrap

function strip(s: string | undefined): string {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

function getBaseUrl(): string {
  return strip(process.env.MOZEN_BASE_URL) || "https://hmetal.mozenscrap.ru";
}

export function isMozenConfigured(): boolean {
  return Boolean(
    strip(process.env.MOZEN_USERNAME) &&
      strip(process.env.MOZEN_PASSWORD) &&
      strip(process.env.MOZEN_ENDPOINT_ID) &&
      strip(process.env.MOZEN_CREATED_BY_ID),
  );
}

// Requisite type IDs from Mozen's bid_requisite_type_list directory (see
// GET /directories/). These are the values documented as universal SBP/Card
// types — verify against your account's /directories/ response if payouts
// are rejected with an unknown requisite type error.
const BID_REQUISITE_TYPE = {
  SBP: "018ad1c1-5bd9-1c29-a8d4-8432e1be9516",
  CARD: "018ad1c1-7427-eea3-6e0f-2b3c39221963",
} as const;

type MozenBid = {
  id: string;
  external_id?: string;
  merchant_order?: string;
  status: string;
  price?: string;
  currency?: string;
  is_approved: boolean;
  is_active?: boolean;
  created_at?: string;
  finished_at?: string | null;
  payment_error?: string | null;
  rejection_reason?: string | null;
  last_error?: string | null;
};

type TokenState = { access: string; refresh: string; accessExpiresAt: number };

// In-memory token cache. Access tokens are valid 60 minutes server-side;
// refresh 5 minutes early to avoid races with in-flight requests.
let tokenState: TokenState | null = null;
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_SKEW_MS = 5 * 60 * 1000;

async function rawFetch<T>(
  path: string,
  opts: { method: "GET" | "POST"; body?: unknown; token?: string },
): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: opts.method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: T | null = null;
  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data, text };
}

async function login(): Promise<TokenState> {
  const username = strip(process.env.MOZEN_USERNAME);
  const password = strip(process.env.MOZEN_PASSWORD);
  if (!username || !password) {
    throw new Error("MOZEN_NOT_CONFIGURED");
  }

  const res = await rawFetch<{ access: string; refresh: string }>("/token/", {
    method: "POST",
    body: { username, password },
  });

  if (!res.ok || !res.data) {
    throw new Error(`MOZEN_LOGIN_FAILED: ${res.status} ${res.text.slice(0, 300)}`);
  }

  const state: TokenState = {
    access: res.data.access,
    refresh: res.data.refresh,
    accessExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  };
  tokenState = state;
  return state;
}

async function refreshAccessToken(state: TokenState): Promise<TokenState> {
  const res = await rawFetch<{ access: string; refresh: string }>("/token/refresh", {
    method: "POST",
    body: { refresh: state.refresh, access: state.access },
  });

  if (!res.ok || !res.data) {
    // Refresh token expired or invalid — fall back to a full login.
    return login();
  }

  const next: TokenState = {
    access: res.data.access,
    refresh: res.data.refresh ?? state.refresh,
    accessExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  };
  tokenState = next;
  return next;
}

async function getAccessToken(): Promise<string> {
  if (!tokenState) {
    return (await login()).access;
  }
  if (Date.now() > tokenState.accessExpiresAt - REFRESH_SKEW_MS) {
    return (await refreshAccessToken(tokenState)).access;
  }
  return tokenState.access;
}

async function authedFetch<T>(
  path: string,
  opts: { method: "GET" | "POST"; body?: unknown },
  retried = false,
): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const token = await getAccessToken();
  const res = await rawFetch<T>(path, { ...opts, token });

  if (res.status === 401 && !retried) {
    tokenState = null;
    return authedFetch<T>(path, opts, true);
  }

  return res;
}

function normalizeRuPhone(raw: string): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) digits = `7${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return digits;
}

// Mozen requires receiver_first_name/receiver_last_name for SBP transfers,
// which our WithdrawalRequest.requisites doesn't store — derive from the
// user's profile name (assumed "Имя Фамилия" order, the common convention
// in this app's registration forms).
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Получатель", lastName: "Получатель" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts[1] };
}

export type MozenInternalStatus = "succeeded" | "failed" | "processing";

export function mapMozenStatus(status: string): MozenInternalStatus {
  if (status === "done") return "succeeded";
  if (status === "error" || status === "rejected") return "failed";
  return "processing";
}

export async function createMozenPayout(params: {
  amount: number;
  method: "CARD" | "SBP" | "WALLET";
  requisites: Record<string, string>;
  withdrawalRequestId: string;
}): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  if (params.method === "WALLET") {
    return {
      success: false,
      error: "Mozen Scrap не поддерживает выплаты на кошелёк ЮMoney. Доступны только CARD и SBP.",
    };
  }

  const endpointId = strip(process.env.MOZEN_ENDPOINT_ID);
  const createdById = strip(process.env.MOZEN_CREATED_BY_ID);
  if (!endpointId || !createdById) {
    return {
      success: false,
      error: "MOZEN_NOT_CONFIGURED: укажите MOZEN_ENDPOINT_ID и MOZEN_CREATED_BY_ID в .env",
    };
  }

  let requisite: Record<string, unknown>;

  if (params.method === "CARD") {
    const cardNumber = (params.requisites.cardNumber ?? "").replace(/\D/g, "");
    if (cardNumber.length < 16 || cardNumber.length > 19) {
      return { success: false, error: "Некорректный номер карты для выплаты через Mozen" };
    }
    requisite = { bid_requisite_type_id: BID_REQUISITE_TYPE.CARD, requisite: cardNumber };
  } else {
    const phone = normalizeRuPhone(params.requisites.phone ?? "");
    if (phone.length !== 11 || !phone.startsWith("7")) {
      return { success: false, error: "Некорректный номер телефона для выплаты через СБП (Mozen)" };
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: params.withdrawalRequestId },
      select: { user: { select: { name: true } } },
    });
    const { firstName, lastName } = splitName(withdrawal?.user.name ?? "");

    requisite = {
      bid_requisite_type_id: BID_REQUISITE_TYPE.SBP,
      requisite: phone,
      receiver_first_name: firstName,
      receiver_last_name: lastName,
    };
  }

  try {
    const createRes = await authedFetch<MozenBid>("/bid/external/", {
      method: "POST",
      body: {
        endpoint_id: endpointId,
        external_id: params.withdrawalRequestId,
        merchant_order: params.withdrawalRequestId,
        price: params.amount.toFixed(2),
        created_by_id: Number(createdById),
        requisite,
        auto_approve: true,
      },
    });

    if (!createRes.ok || !createRes.data) {
      return { success: false, error: `MOZEN_CREATE_FAILED: ${createRes.status} ${createRes.text.slice(0, 300)}` };
    }

    const bidId = createRes.data.id;

    if (!createRes.data.is_approved) {
      const approveRes = await authedFetch<MozenBid>(`/bid/${bidId}/approve/`, { method: "POST", body: {} });
      if (!approveRes.ok) {
        return { success: false, payoutId: bidId, error: `MOZEN_APPROVE_FAILED: ${approveRes.status} ${approveRes.text.slice(0, 300)}` };
      }
    }

    return { success: true, payoutId: bidId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getMozenPayoutStatus(bidId: string): Promise<{ status: string; isApproved: boolean }> {
  const res = await authedFetch<MozenBid>(`/bid/${bidId}/`, { method: "GET" });
  if (!res.ok || !res.data) {
    throw new Error(`MOZEN_STATUS_FAILED: ${res.status} ${res.text.slice(0, 300)}`);
  }
  return { status: res.data.status, isApproved: res.data.is_approved };
}
