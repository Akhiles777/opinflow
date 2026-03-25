"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientProfileSchema, respondentProfileSchema } from "@/lib/validations";

type ProfileState = {
  success?: boolean;
  error?: string;
  message?: string;
};

function emptyToNull(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function updateRespondentProfileAction(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Сессия истекла. Войдите снова." };
  }

  const parsed = respondentProfileSchema.safeParse({
    gender: emptyToNull(formData.get("gender")),
    birthDate: emptyToNull(formData.get("birthDate")),
    city: emptyToNull(formData.get("city")),
    income: emptyToNull(formData.get("income")),
    education: emptyToNull(formData.get("education")),
    interests: formData.getAll("interests").map((item) => String(item)),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте корректность данных" };
  }

  const { birthDate, ...rest } = parsed.data;

  await prisma.respondentProfile.upsert({
    where: { userId: session.user.id },
    update: {
      ...rest,
      birthDate: birthDate ? new Date(birthDate) : null,
      isVerified: Boolean(rest.gender && birthDate && rest.city && rest.income && rest.education && rest.interests.length > 0),
    },
    create: {
      userId: session.user.id,
      ...rest,
      birthDate: birthDate ? new Date(birthDate) : null,
      isVerified: Boolean(rest.gender && birthDate && rest.city && rest.income && rest.education && rest.interests.length > 0),
    },
  });

  revalidatePath("/respondent/profile");
  return { success: true, message: "Профиль обновлён ✓" };
}

export async function updateClientProfileAction(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Сессия истекла. Войдите снова." };
  }

  const parsed = clientProfileSchema.safeParse({
    companyName: emptyToNull(formData.get("companyName")),
    inn: emptyToNull(formData.get("inn")),
    contactName: emptyToNull(formData.get("contactName")),
    email: emptyToNull(formData.get("email")),
    phone: emptyToNull(formData.get("phone")),
    legalAddress: emptyToNull(formData.get("legalAddress")),
    bankName: emptyToNull(formData.get("bankName")),
    bankAccount: emptyToNull(formData.get("bankAccount")),
    bankBik: emptyToNull(formData.get("bankBik")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте корректность данных" };
  }

  const { email, contactName, ...profileData } = parsed.data;

  await prisma.$transaction([
    prisma.clientProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...profileData,
        contactName,
      },
      create: {
        userId: session.user.id,
        ...profileData,
        contactName,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(email ? { email } : {}),
        name: contactName || undefined,
      },
    }),
  ]);

  revalidatePath("/client/settings");
  return { success: true, message: "Данные компании сохранены ✓" };
}
