import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.NODE_ENV === "production"
  ? "ПотокМнений <noreply@potokmneny.ru>"
  : "ПотокМнений <onboarding@resend.dev>";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function assertEmailClient() {
  if (!resend) {
    throw new Error("RESEND_NOT_CONFIGURED");
  }
  return resend;
}

async function sendEmail(payload: Parameters<NonNullable<typeof resend>["emails"]["send"]>[0]) {
  const client = assertEmailClient();
  const response = await client.emails.send(payload);

  if (response.error) {
    throw new Error(`RESEND_SEND_FAILED: ${response.error.message}`);
  }

  return response.data;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${getBaseUrl()}/verify-email?token=${token}`;

  return sendEmail({
    from: FROM,
    to: email,
    subject: "Подтвердите email — ПотокМнений",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#fff;">
        <div style="margin-bottom:32px;">
          <span style="display:inline-block;width:8px;height:8px;background:#6366F1;border-radius:2px;margin-right:8px;"></span>
          <span style="font-weight:700;font-size:16px;color:#111827;">ПотокМнений</span>
        </div>
        <h2 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">Подтвердите ваш email</h2>
        <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Привет, ${name}! Для завершения регистрации перейдите по ссылке ниже. Ссылка действительна 24 часа.
        </p>
        <a href="${url}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
          Подтвердить email
        </a>
        <p style="color:#9CA3AF;font-size:13px;margin-top:32px;line-height:1.5;">
          Если вы не регистрировались на ПотокМнений — просто проигнорируйте это письмо.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const url = `${getBaseUrl()}/reset-password?token=${token}`;

  return sendEmail({
    from: FROM,
    to: email,
    subject: "Восстановление пароля — ПотокМнений",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#fff;">
        <div style="margin-bottom:32px;">
          <span style="display:inline-block;width:8px;height:8px;background:#6366F1;border-radius:2px;margin-right:8px;"></span>
          <span style="font-weight:700;font-size:16px;color:#111827;">ПотокМнений</span>
        </div>
        <h2 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">Восстановление пароля</h2>
        <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Привет, ${name}! Мы получили запрос на сброс пароля. Ссылка действительна 1 час.
        </p>
        <a href="${url}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
          Сбросить пароль
        </a>
        <p style="color:#9CA3AF;font-size:13px;margin-top:32px;line-height:1.5;">
          Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
        </p>
      </div>
    `,
  });
}
