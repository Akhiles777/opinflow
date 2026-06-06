"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

export async function createExpertAction(data: {
  name: string;
  email?: string;
  specialty?: string;
}) {
  await requireRole("ADMIN");

  const name = data.name.trim();
  if (!name) return { error: "Введите имя эксперта" };
  if (name.length > 100) return { error: "Имя слишком длинное" };

  const email = data.email?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Некорректный email" };
  }

  try {
    await prisma.expert.create({
      data: {
        name,
        email,
        specialty: data.specialty?.trim() || null,
      },
    });
  } catch (error) {
    console.error("[admin-experts][create]", error);
    const msg = error instanceof Error ? error.message : String(error);
    // Stale Prisma client — dev server needs restart after prisma generate
    if (msg.includes("is not a function") || msg.includes("Cannot read propert")) {
      return { error: "Перезапустите dev-сервер (prisma generate применился без перезапуска)" };
    }
    return { error: "Не удалось добавить эксперта" };
  }

  revalidatePath("/admin/experts");
  return { success: true };
}

export async function updateExpertAction(
  id: string,
  data: { name: string; email?: string; specialty?: string },
) {
  await requireRole("ADMIN");

  const name = data.name.trim();
  if (!name) return { error: "Введите имя эксперта" };

  const email = data.email?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Некорректный email" };
  }

  try {
    await prisma.expert.update({
      where: { id },
      data: {
        name,
        email,
        specialty: data.specialty?.trim() || null,
      },
    });
  } catch (error) {
    console.error("[admin-experts][update]", error);
    return { error: "Не удалось обновить эксперта" };
  }

  revalidatePath("/admin/experts");
  return { success: true };
}

export async function toggleExpertActiveAction(id: string) {
  await requireRole("ADMIN");

  try {
    const expert = await prisma.expert.findUnique({ where: { id }, select: { isActive: true } });
    if (!expert) return { error: "Эксперт не найден" };

    await prisma.expert.update({
      where: { id },
      data: { isActive: !expert.isActive },
    });
  } catch (error) {
    console.error("[admin-experts][toggle]", error);
    return { error: "Не удалось изменить статус эксперта" };
  }

  revalidatePath("/admin/experts");
  return { success: true };
}

export async function deleteExpertAction(id: string) {
  await requireRole("ADMIN");

  try {
    await prisma.expert.delete({ where: { id } });
  } catch (error) {
    console.error("[admin-experts][delete]", error);
    return { error: "Не удалось удалить эксперта" };
  }

  revalidatePath("/admin/experts");
  return { success: true };
}
