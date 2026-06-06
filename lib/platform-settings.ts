import { prisma } from "@/lib/prisma";

const DEFAULT_COMMISSION_RATE = Number(process.env.NEXT_PUBLIC_COMMISSION_RATE || 0.15);
const COMMISSION_KEY = "commission_rate";

function normalizeRate(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_COMMISSION_RATE;
  return Math.max(0, Math.min(1, value));
}

// Safely get the AppSetting model — may be undefined if table not yet created in DB
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settingModel(): typeof prisma.appSetting | null {
  const m = (prisma as unknown as Record<string, unknown>)["appSetting"];
  return m ? (m as typeof prisma.appSetting) : null;
}

export async function getCommissionRate(): Promise<number> {
  try {
    const model = settingModel();
    if (!model) return DEFAULT_COMMISSION_RATE;
    const row = await model.findUnique({ where: { key: COMMISSION_KEY } });
    if (!row) return DEFAULT_COMMISSION_RATE;
    const val = row.value as Record<string, unknown>;
    return normalizeRate(Number(val?.rate));
  } catch {
    return DEFAULT_COMMISSION_RATE;
  }
}

export async function setCommissionRate(rate: number): Promise<number> {
  const normalized = normalizeRate(rate);
  const model = settingModel();
  if (!model) throw new Error("AppSetting table not available");
  await model.upsert({
    where: { key: COMMISSION_KEY },
    update: { value: { rate: normalized } },
    create: { key: COMMISSION_KEY, value: { rate: normalized } },
  });
  return normalized;
}
