"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";
import { setCommissionRate } from "@/lib/platform-settings";

export async function updateCommissionRateAction(ratePercent: number) {
  await requireRole("ADMIN");

  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    return { error: "Комиссия должна быть в диапазоне от 0 до 100%" };
  }

  const normalizedRate = await setCommissionRate(ratePercent / 100);
  revalidatePath("/admin/finance");
  revalidatePath("/client/surveys/create");
  return { success: true, rate: normalizedRate };
}
