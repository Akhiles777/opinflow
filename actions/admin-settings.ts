"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";
import { setCommissionRate } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

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

export async function toggleUserBlockAction(userId: string) {
  await requireRole("ADMIN");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, role: true },
  });

  if (!user) return { error: "Пользователь не найден" };
  if (user.role === "ADMIN") return { error: "Нельзя заблокировать администратора" };

  const newStatus = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
  await prisma.user.update({ where: { id: userId }, data: { status: newStatus } });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, newStatus };
}

export async function resolveComplaintAction(id: string, status: "RESOLVED" | "DISMISSED") {
  await requireRole("ADMIN");

  const complaint = await prisma.complaint.findUnique({ where: { id }, select: { id: true } });
  if (!complaint) return { error: "Жалоба не найдена" };

  await prisma.complaint.update({ where: { id }, data: { status } });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function savePlatformSettingsAction(data: {
  commissionPercent: number;
  minWithdrawal: number;
  minReward: number;
  maintenanceMode: boolean;
  adminEmail: string;
}) {
  await requireRole("ADMIN");

  if (!Number.isFinite(data.commissionPercent) || data.commissionPercent < 0 || data.commissionPercent > 100) {
    return { error: "Комиссия должна быть от 0 до 100%" };
  }
  if (!Number.isFinite(data.minWithdrawal) || data.minWithdrawal < 0) {
    return { error: "Минимальная сумма вывода не может быть отрицательной" };
  }
  if (!Number.isFinite(data.minReward) || data.minReward < 0) {
    return { error: "Минимальное вознаграждение не может быть отрицательным" };
  }

  try {
    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        commissionPercent: data.commissionPercent,
        minWithdrawal: data.minWithdrawal,
        minReward: data.minReward,
        maintenanceMode: data.maintenanceMode,
        adminEmail: data.adminEmail.trim(),
      },
      update: {
        commissionPercent: data.commissionPercent,
        minWithdrawal: data.minWithdrawal,
        minReward: data.minReward,
        maintenanceMode: data.maintenanceMode,
        adminEmail: data.adminEmail.trim(),
      },
    });
  } catch (error) {
    console.error("[admin-settings] platformSettings upsert error:", error);
  }

  await setCommissionRate(data.commissionPercent / 100);

  revalidatePath("/admin/settings");
  revalidatePath("/admin/finance");
  revalidatePath("/client/surveys/create");
  return { success: true };
}

export async function getPlatformSettingsAction() {
  await requireRole("ADMIN");

  try {
    return await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
  } catch {
    return {
      id: "singleton",
      commissionPercent: Number(process.env.NEXT_PUBLIC_COMMISSION_RATE ?? 0.15) * 100,
      minWithdrawal: 100,
      minReward: 20,
      maintenanceMode: false,
      adminEmail: process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "",
      updatedAt: new Date(),
    };
  }
}
