import { prisma } from "@/lib/prisma";

const DEFAULT_COMMISSION_RATE = Number(process.env.NEXT_PUBLIC_COMMISSION_RATE || 0.15);
const COMMISSION_KEY = "commission_rate";

function normalizeRate(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_COMMISSION_RATE;
  return Math.max(0, Math.min(1, value));
}

async function ensureSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getCommissionRate() {
  try {
    await ensureSettingsTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ value: unknown }>>(
      `SELECT value FROM app_settings WHERE key = $1 LIMIT 1`,
      COMMISSION_KEY,
    );
    const rate = rows[0]?.value && typeof rows[0].value === "object"
      ? Number((rows[0].value as Record<string, unknown>).rate)
      : NaN;
    return normalizeRate(rate);
  } catch {
    return DEFAULT_COMMISSION_RATE;
  }
}

export async function setCommissionRate(rate: number) {
  const normalized = normalizeRate(rate);
  await ensureSettingsTable();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    COMMISSION_KEY,
    JSON.stringify({ rate: normalized }),
  );
  return normalized;
}
