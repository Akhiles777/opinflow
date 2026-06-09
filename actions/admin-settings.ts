"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
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

export async function changeAdminEmailAction(newEmail: string, currentPassword: string) {
  const session = await requireRole("ADMIN");

  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Введите корректный email" };
  }
  if (!currentPassword) {
    return { error: "Введите текущий пароль для подтверждения" };
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true, email: true },
  });

  if (!admin?.passwordHash) {
    return { error: "Невозможно изменить email для этого аккаунта" };
  }

  const passwordOk = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!passwordOk) {
    return { error: "Неверный текущий пароль" };
  }

  if (admin.email === trimmed) {
    return { error: "Новый email совпадает с текущим" };
  }

  const existing = await prisma.user.findUnique({ where: { email: trimmed }, select: { id: true } });
  if (existing) {
    return { error: "Этот email уже используется другим аккаунтом" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: trimmed },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function changeAdminPasswordAction(currentPassword: string, newPassword: string) {
  const session = await requireRole("ADMIN");

  if (!currentPassword || !newPassword) {
    return { error: "Заполните все поля" };
  }
  if (newPassword.length < 8) {
    return { error: "Новый пароль должен содержать не менее 8 символов" };
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!admin?.passwordHash) {
    return { error: "Невозможно изменить пароль для этого аккаунта" };
  }

  const passwordOk = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!passwordOk) {
    return { error: "Неверный текущий пароль" };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

export async function adminAdjustBalanceAction(params: {
  userId: string;
  amount: number;
  direction: "credit" | "debit";
  note: string;
}) {
  await requireRole("ADMIN");

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return { error: "Сумма должна быть положительным числом" };
  }
  if (!params.note.trim()) {
    return { error: "Укажите причину корректировки" };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, role: true, wallet: { select: { id: true, balance: true } } },
  });

  if (!user) return { error: "Пользователь не найден" };
  if (user.role === "ADMIN") return { error: "Нельзя изменять баланс администратора" };
  if (!user.wallet) return { error: "Кошелёк пользователя не найден" };

  if (params.direction === "debit" && Number(user.wallet.balance) < params.amount) {
    return { error: "Недостаточно средств на балансе пользователя" };
  }

  const decimalAmount = new Prisma.Decimal(params.amount);

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: user.wallet!.id },
      data: {
        balance:
          params.direction === "credit"
            ? { increment: decimalAmount }
            : { decrement: decimalAmount },
        ...(params.direction === "credit" && user.role === "RESPONDENT"
          ? { totalEarned: { increment: decimalAmount } }
          : {}),
        ...(params.direction === "debit" && user.role === "CLIENT"
          ? { totalSpent: { increment: decimalAmount } }
          : {}),
      },
    });

    await tx.transaction.create({
      data: {
        walletId: user.wallet!.id,
        type: params.direction === "credit" ? "BONUS" : "SPENDING",
        amount: decimalAmount,
        description: `Корректировка баланса администратором: ${params.note.trim()}`,
        status: "COMPLETED",
      },
    });
  });

  revalidatePath(`/admin/users/${params.userId}`);
  revalidatePath("/admin/finance");
  return { success: true };
}
