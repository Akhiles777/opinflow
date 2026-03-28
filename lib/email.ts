import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!,
  port: Number(process.env.EMAIL_PORT!),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

const FROM = `ПотокМнений <${process.env.EMAIL_USER}>`;

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function assertEmailConfig() {
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }
}

async function sendMail(payload: { to: string; subject: string; html: string }) {
  assertEmailConfig();

  return transporter.sendMail({
    from: FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${getBaseUrl()}/verify-email?token=${token}`;

  await sendMail({
    to: email,
    subject: "Подтвердите email — ПотокМнений",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">Подтвердите ваш email</h2>
        <p style="color:#6B7280;">Привет, ${name}! Перейдите по ссылке для завершения регистрации. Ссылка действительна 24 часа.</p>
        <a href="${url}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Подтвердить email
        </a>
        <p style="color:#9CA3AF;font-size:13px;margin-top:32px;">
          Если вы не регистрировались — просто проигнорируйте это письмо.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${getBaseUrl()}/reset-password?token=${token}`;

  await sendMail({
    to: email,
    subject: "Восстановление пароля — ПотокМнений",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">Восстановление пароля</h2>
        <p style="color:#6B7280;">Привет, ${name}! Ссылка действительна 1 час.</p>
        <a href="${url}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Сбросить пароль
        </a>
        <p style="color:#9CA3AF;font-size:13px;margin-top:32px;">
          Если вы не запрашивали сброс — проигнорируйте письмо.
        </p>
      </div>
    `,
  });
}
