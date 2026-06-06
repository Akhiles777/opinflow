import { prisma } from "@/lib/prisma";

const DEFAULT_COMMISSION_RATE = Number(process.env.NEXT_PUBLIC_COMMISSION_RATE || 0.15);
const COMMISSION_KEY = "commission_rate";

function normalizeRate(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_COMMISSION_RATE;
  return Math.max(0, Math.min(1, value));
}

export async function getCommissionRate() {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: COMMISSION_KEY } });
    if (!row) return DEFAULT_COMMISSION_RATE;
    const val = row.value as Record<string, unknown>;
    return normalizeRate(Number(val?.rate));
  } catch (error) {
    console.error("[platform-settings] getCommissionRate error:", error);
    return DEFAULT_COMMISSION_RATE;
  }
}

export async function setCommissionRate(rate: number) {
  const normalized = normalizeRate(rate);
  await prisma.appSetting.upsert({
    where: { key: COMMISSION_KEY },
    update: { value: { rate: normalized } },
    create: { key: COMMISSION_KEY, value: { rate: normalized } },
  });
  return normalized;
}
