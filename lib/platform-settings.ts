import { prisma } from "@/lib/prisma";

const DEFAULT_COMMISSION_RATE = Number(process.env.NEXT_PUBLIC_COMMISSION_RATE || 0.15);
const COMMISSION_KEY = "commission_rate";

export type PlatformSettings = {
  commissionPercent: number;
  minWithdrawal: number;
  minReward: number;
  maintenanceMode: boolean;
  adminEmail: string;
};

const DEFAULTS: PlatformSettings = {
  commissionPercent: DEFAULT_COMMISSION_RATE * 100,
  minWithdrawal: 500,
  minReward: 20,
  maintenanceMode: false,
  adminEmail: process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "",
};

function normalizeRate(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_COMMISSION_RATE;
  return Math.max(0, Math.min(1, value));
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const row = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    if (!row) return DEFAULTS;
    return {
      commissionPercent: Number(row.commissionPercent),
      minWithdrawal: Number(row.minWithdrawal),
      minReward: Number(row.minReward),
      maintenanceMode: row.maintenanceMode,
      // Если в БД пусто — fallback на env var
      adminEmail: row.adminEmail || process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "",
    };
  } catch {
    return DEFAULTS;
  }
}

export async function getCommissionRate(): Promise<number> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: COMMISSION_KEY } });
    if (!row) return DEFAULT_COMMISSION_RATE;
    const val = row.value as Record<string, unknown>;
    return normalizeRate(Number(val?.rate));
  } catch {
    return DEFAULT_COMMISSION_RATE;
  }
}

export async function setCommissionRate(rate: number): Promise<number> {
  const normalized = normalizeRate(rate);
  try {
    await prisma.appSetting.upsert({
      where: { key: COMMISSION_KEY },
      update: { value: { rate: normalized } },
      create: { key: COMMISSION_KEY, value: { rate: normalized } },
    });
  } catch (error) {
    console.error("[platform-settings] setCommissionRate error:", error);
  }
  return normalized;
}
