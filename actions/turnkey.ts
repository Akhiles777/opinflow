"use server";

import { requireRole } from "@/lib/auth-utils";
import { sendAdminNotificationEmail } from "@/lib/email";
import { getPlatformSettings } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export async function requestTurnkeyAction(): Promise<{ success: true } | { error: string }> {
  const session = await requireRole("CLIENT");

  const [settings, client] = await Promise.all([
    getPlatformSettings(),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, clientProfile: { select: { companyName: true, phone: true } } },
    }),
  ]);

  const name = client?.name ?? "—";
  const email = client?.email ?? "—";
  const company = client?.clientProfile?.companyName ?? "—";
  const phone = client?.clientProfile?.phone ?? "не указан";

  try {
    await sendAdminNotificationEmail(
      settings.adminEmail,
      "Новая заявка: Опрос под ключ",
      [
        { label: "Клиент", value: name },
        { label: "Email", value: email },
        { label: "Компания", value: company },
        { label: "Телефон", value: phone },
        { label: "Тип", value: "Опрос под ключ (от 150 000 ₽)" },
        { label: "Дата", value: new Date().toLocaleString("ru-RU") },
      ],
    );
    return { success: true };
  } catch (err) {
    console.error("[requestTurnkeyAction]", err);
    return { error: "Не удалось отправить заявку. Попробуйте ещё раз." };
  }
}
