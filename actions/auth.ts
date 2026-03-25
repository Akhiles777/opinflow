"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { ensureUserSetup } from "@/lib/user-setup";
import { forgotPasswordSchema, registerSchema, resetPasswordSchema } from "@/lib/validations";

type ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
  email?: string;
};

function getActionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("p6002") || message.includes("api key is invalid")) {
      return "Не удалось подключиться к базе данных. Проверьте DATABASE_URL и настройки подключения.";
    }

    if (
      message.includes("can't reach database") ||
      message.includes("database") ||
      message.includes("connect")
    ) {
      return "Сервис временно недоступен из-за ошибки подключения к базе данных. Попробуйте позже.";
    }

    if (message.includes("resend_not_configured")) {
      return "Почтовый сервис не настроен. Добавьте RESEND_API_KEY и попробуйте снова.";
    }

    if (
      message.includes("you can only send testing emails to your own email address") ||
      message.includes("validation_error")
    ) {
      return "Resend сейчас в тестовом режиме. Письма можно отправлять только на подтверждённый адрес владельца аккаунта Resend или после верификации собственного домена.";
    }

    if (message.includes("resend_send_failed")) {
      return "Resend отклонил отправку письма. Проверь настройки домена и адреса отправителя.";
    }
  }

  return fallback;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function registerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    acceptTerms: formData.get("acceptTerms"),
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Проверьте корректность данных" };
  }

  const { name, email, password, role } = result.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return { error: "Этот email уже зарегистрирован" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role,
        status: "PENDING_VERIFICATION",
      },
    });

    const token = await prisma.emailToken.create({
      data: {
        userId: user.id,
        type: "EMAIL_VERIFICATION",
        expiresAt: addHours(new Date(), 24),
      },
    });

    await sendVerificationEmail(normalizedEmail, name, token.token);
  } catch (error) {
    return {
      error: getActionErrorMessage(
        error,
        "Не удалось завершить регистрацию. Проверьте настройки базы данных и почты.",
      ),
    };
  }

  return {
    success: true,
    email: normalizedEmail,
    message: `Письмо отправлено на ${normalizedEmail}. Проверьте почту и подтвердите аккаунт.`,
  };
}

export async function resendVerificationAction(email: string): Promise<ActionState> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { error: "Введите email, чтобы отправить письмо повторно" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.status !== "PENDING_VERIFICATION") {
      return { success: true, message: "Если аккаунт ожидает подтверждения, мы отправили новое письмо." };
    }

    await prisma.emailToken.updateMany({
      where: { userId: user.id, type: "EMAIL_VERIFICATION", usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = await prisma.emailToken.create({
      data: {
        userId: user.id,
        type: "EMAIL_VERIFICATION",
        expiresAt: addHours(new Date(), 24),
      },
    });

    await sendVerificationEmail(normalizedEmail, user.name ?? "Пользователь", token.token);
  } catch (error) {
    return { error: getActionErrorMessage(error, "Не удалось отправить письмо повторно. Попробуйте позже.") };
  }

  return { success: true, message: "Новое письмо для подтверждения email отправлено." };
}

export async function forgotPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Введите корректный email" };
  }

  try {
    const normalizedEmail = result.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.status === "BLOCKED") {
      return {
        success: true,
        message: "Если такой email зарегистрирован, мы отправили инструкцию по сбросу пароля.",
      };
    }

    await prisma.emailToken.updateMany({
      where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = await prisma.emailToken.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        expiresAt: addHours(new Date(), 1),
      },
    });

    await sendPasswordResetEmail(normalizedEmail, user.name ?? "Пользователь", token.token);
  } catch (error) {
    return { error: getActionErrorMessage(error, "Не удалось отправить письмо. Проверьте настройки почты и попробуйте снова.") };
  }

  return {
    success: true,
    message: "Если такой email зарегистрирован, мы отправили инструкцию по сбросу пароля.",
  };
}

export async function validatePasswordResetTokenAction(token: string) {
  if (!token) {
    return { valid: false, error: "Ссылка недействительна" };
  }

  try {
    const emailToken = await prisma.emailToken.findUnique({ where: { token } });
    if (!emailToken || emailToken.type !== "PASSWORD_RESET") {
      return { valid: false, error: "Ссылка недействительна" };
    }

    if (emailToken.usedAt) {
      return { valid: false, error: "Ссылка уже была использована" };
    }

    if (emailToken.expiresAt < new Date()) {
      return { valid: false, error: "Ссылка истекла. Запросите новую." };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: getActionErrorMessage(error, "Не удалось проверить ссылку восстановления.") };
  }
}

export async function resetPasswordFormAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте пароль" };
  }

  try {
    const emailToken = await prisma.emailToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!emailToken || emailToken.type !== "PASSWORD_RESET") {
      return { error: "Ссылка недействительна" };
    }

    if (emailToken.usedAt) {
      return { error: "Ссылка уже была использована" };
    }

    if (emailToken.expiresAt < new Date()) {
      return { error: "Ссылка истекла. Запросите новую." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: emailToken.userId },
        data: { passwordHash },
      }),
      prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({
        where: { userId: emailToken.userId },
      }),
    ]);
  } catch (error) {
    return { error: getActionErrorMessage(error, "Не удалось изменить пароль. Попробуйте позже.") };
  }

  revalidatePath("/login");

  return {
    success: true,
    message: "Пароль изменён. Войдите с новым паролем.",
  };
}

export async function verifyEmailTokenAction(token: string) {
  try {
    const emailToken = await prisma.emailToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!emailToken || emailToken.type !== "EMAIL_VERIFICATION") {
      return { success: false, error: "Ссылка недействительна" };
    }

    if (emailToken.usedAt) {
      return { success: false, error: "Ссылка уже была использована" };
    }

    if (emailToken.expiresAt < new Date()) {
      return {
        success: false,
        error: "Ссылка истекла",
        email: emailToken.user.email,
      };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: emailToken.userId },
        data: {
          status: "ACTIVE",
          emailVerified: new Date(),
        },
      }),
      prisma.emailToken.update({
        where: { id: emailToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await ensureUserSetup(emailToken.userId, emailToken.user.role);

    return { success: true };
  } catch (error) {
    return { success: false, error: getActionErrorMessage(error, "Не удалось подтвердить email. Попробуйте позже.") };
  }
}
