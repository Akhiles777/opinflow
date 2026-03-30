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

type TableColumnRow = {
  column_name: string;
};

function hasMissingColumnError(error: unknown, columnName: string) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("column") &&
    message.includes(columnName.toLowerCase())
  );
}

async function getTableColumns(tableName: string) {
  const rows = await prisma.$queryRawUnsafe<TableColumnRow[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    tableName,
  );

  return new Set(rows.map((row) => row.column_name));
}

async function saveRespondentProfileWithSqlFallback(params: {
  userId: string;
  gender: string | null | undefined;
  birthDate: Date | null;
  city: string | null | undefined;
  income: string | null | undefined;
  education: string | null | undefined;
  interests: string[];
  isVerified: boolean;
}) {
  const columns = await getTableColumns("respondent_profiles");
  const valuesByColumn: Record<string, unknown> = {
    userId: params.userId,
    gender: params.gender ?? null,
    birthDate: params.birthDate,
    city: params.city ?? null,
    income: params.income ?? null,
    education: params.education ?? null,
    interests: params.interests,
    isVerified: params.isVerified,
  };

  const orderedColumns = ["userId", "gender", "birthDate", "city", "income", "education", "interests", "isVerified"]
    .filter((column) => columns.has(column));

  if (!orderedColumns.includes("userId")) {
    throw new Error("respondent_profiles.userId column is missing");
  }

  const insertColumns = orderedColumns.map((column) => `"${column}"`).join(", ");
  const placeholders = orderedColumns.map((_, index) => `$${index + 1}`).join(", ");
  const updateColumns = orderedColumns
    .filter((column) => column !== "userId")
    .map((column) => `"${column}" = EXCLUDED."${column}"`);

  if (columns.has("updatedAt")) {
    updateColumns.push(`"updatedAt" = NOW()`);
  }

  const sql = `INSERT INTO "respondent_profiles" (${insertColumns}) VALUES (${placeholders}) ON CONFLICT ("userId") DO UPDATE SET ${updateColumns.join(", ")}`;
  const values = orderedColumns.map((column) => valuesByColumn[column]);

  await prisma.$executeRawUnsafe(sql, ...values);
}

async function saveClientProfileWithSqlFallback(params: {
  userId: string;
  companyName: string | null | undefined;
  inn: string | null | undefined;
  contactName: string | null | undefined;
  phone: string | null | undefined;
  legalAddress: string | null | undefined;
  bankName: string | null | undefined;
  bankAccount: string | null | undefined;
  bankBik: string | null | undefined;
}) {
  const columns = await getTableColumns("client_profiles");
  const valuesByColumn: Record<string, unknown> = {
    userId: params.userId,
    companyName: params.companyName ?? null,
    inn: params.inn ?? null,
    contactName: params.contactName ?? null,
    phone: params.phone ?? null,
    legalAddress: params.legalAddress ?? null,
    bankName: params.bankName ?? null,
    bankAccount: params.bankAccount ?? null,
    bankBik: params.bankBik ?? null,
  };

  const orderedColumns = [
    "userId",
    "companyName",
    "inn",
    "contactName",
    "phone",
    "legalAddress",
    "bankName",
    "bankAccount",
    "bankBik",
  ].filter((column) => columns.has(column));

  if (!orderedColumns.includes("userId")) {
    throw new Error("client_profiles.userId column is missing");
  }

  const insertColumns = orderedColumns.map((column) => `"${column}"`).join(", ");
  const placeholders = orderedColumns.map((_, index) => `$${index + 1}`).join(", ");
  const updateColumns = orderedColumns
    .filter((column) => column !== "userId")
    .map((column) => `"${column}" = EXCLUDED."${column}"`);

  if (columns.has("updatedAt")) {
    updateColumns.push(`"updatedAt" = NOW()`);
  }

  const sql = `INSERT INTO "client_profiles" (${insertColumns}) VALUES (${placeholders}) ON CONFLICT ("userId") DO UPDATE SET ${updateColumns.join(", ")}`;
  const values = orderedColumns.map((column) => valuesByColumn[column]);

  await prisma.$executeRawUnsafe(sql, ...values);
}

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
    image: emptyToNull(formData.get("image")),
    interests: formData.getAll("interests").map((item) => String(item)),
  });



  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте корректность данных" };
  }

  const { birthDate, ...rest } = parsed.data;
  const isVerified = Boolean(
    rest.gender && birthDate && rest.city && rest.income && rest.education && rest.interests.length > 0,
  );
  const birthDateValue = birthDate ? new Date(birthDate) : null;

  try {
    await prisma.respondentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...rest,
        birthDate: birthDateValue,
        isVerified,
      },
      create: {
        userId: session.user.id,
        ...rest,
        birthDate: birthDateValue,
        isVerified,
      },
    });
  } catch (error) {
    console.error("[profile][respondent-save-error]", {
      userId: session.user.id,
      error,
    });

    if (hasMissingColumnError(error, "isVerified")) {
      try {
        await saveRespondentProfileWithSqlFallback({
          userId: session.user.id,
          gender: rest.gender,
          birthDate: birthDateValue,
          city: rest.city,
          income: rest.income,
          education: rest.education,
          interests: rest.interests,
          isVerified,
        });
      } catch (fallbackError) {
        console.error("[profile][respondent-save-fallback-error]", {
          userId: session.user.id,
          fallbackError,
        });
        return { error: "Не удалось сохранить анкету. Попробуйте ещё раз." };
      }
    } else if (hasMissingColumnError(error, "updatedAt") || hasMissingColumnError(error, "createdAt")) {
      try {
        await saveRespondentProfileWithSqlFallback({
          userId: session.user.id,
          gender: rest.gender,
          birthDate: birthDateValue,
          city: rest.city,
          income: rest.income,
          education: rest.education,
          interests: rest.interests,
          isVerified,
        });
      } catch (fallbackError) {
        console.error("[profile][respondent-save-fallback-error]", {
          userId: session.user.id,
          fallbackError,
        });
        return { error: "Не удалось сохранить анкету. Попробуйте ещё раз." };
      }
    } else {
      return { error: "Не удалось сохранить анкету. Попробуйте ещё раз." };
    }
  }

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

  try {
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
          email: email || undefined,
          name: contactName || undefined,
        },
      }),
    ]);
  } catch (error) {
    console.error("[profile][client-save-error]", {
      userId: session.user.id,
      error,
    });

    try {
      await saveClientProfileWithSqlFallback({
        userId: session.user.id,
        companyName: profileData.companyName,
        inn: profileData.inn,
        contactName,
        phone: profileData.phone,
        legalAddress: profileData.legalAddress,
        bankName: profileData.bankName,
        bankAccount: profileData.bankAccount,
        bankBik: profileData.bankBik,
      });

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          email: email || undefined,
          name: contactName || undefined,
        },
      });
    } catch (fallbackError) {
      console.error("[profile][client-save-fallback-error]", {
        userId: session.user.id,
        fallbackError,
      });
      return { error: "Не удалось сохранить данные компании. Проверьте поля и попробуйте снова." };
    }
  }

  revalidatePath("/client/settings");
  return { success: true, message: "Данные компании сохранены ✓" };
}
