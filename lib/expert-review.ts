export const DEFAULT_EXPERT_REVIEW_PRICE = 15000;

export const EXPERT_OPTIONS = [
  "А. Сидорова",
  "И. Марков",
  "Е. Иванова",
  "М. Алексеева",
] as const;

export function getExpertReviewPrice() {
  const raw = Number(process.env.NEXT_PUBLIC_EXPERT_REVIEW_PRICE || DEFAULT_EXPERT_REVIEW_PRICE);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_EXPERT_REVIEW_PRICE;
  }
  return Math.round(raw);
}

export function isKnownExpertName(name: string) {
  return EXPERT_OPTIONS.includes(name as (typeof EXPERT_OPTIONS)[number]);
}
