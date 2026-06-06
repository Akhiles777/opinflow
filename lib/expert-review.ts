import { prisma } from "@/lib/prisma";

export const DEFAULT_EXPERT_REVIEW_PRICE = 25000;

export type ExpertRow = {
  id: string;
  name: string;
  email: string | null;
  specialty: string | null;
  isActive: boolean;
};

export function getExpertReviewPrice() {
  const raw = Number(process.env.NEXT_PUBLIC_EXPERT_REVIEW_PRICE || DEFAULT_EXPERT_REVIEW_PRICE);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_EXPERT_REVIEW_PRICE;
  }
  return Math.round(raw);
}

export async function getActiveExperts(): Promise<ExpertRow[]> {
  try {
    return await prisma.expert.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, specialty: true, isActive: true },
    });
  } catch {
    return [];
  }
}

export async function getAllExperts(): Promise<ExpertRow[]> {
  try {
    return await prisma.expert.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, specialty: true, isActive: true },
    });
  } catch {
    return [];
  }
}

export async function isValidExpertName(name: string): Promise<boolean> {
  try {
    const count = await prisma.expert.count({
      where: { name: name.trim(), isActive: true },
    });
    return count > 0;
  } catch {
    return true; // fail-open: don't block assignment if DB is unavailable
  }
}

// Legacy constant kept for backward compat with any existing seed data
export const EXPERT_OPTIONS = [
  "А. Сидорова",
  "И. Марков",
  "Е. Иванова",
  "М. Алексеева",
] as const;
