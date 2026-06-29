import nodemailer from "nodemailer";

const FROM = "ПотокМнений <info@potokmneny.ru>";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

// Strip surrounding quotes and whitespace that Docker env_file may preserve
function env(key: string): string {
  return (process.env[key] ?? "").replace(/^["']|["']$/g, "").trim();
}

function assertEmailConfig() {
  if (!env("MAIL_HOST") || !env("MAIL_PORT") || !env("MAIL_USER") || !env("MAIL_PASS")) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }
}

function getTransporter() {
  const port = Number(env("MAIL_PORT")) || 465;
  return nodemailer.createTransport({
    host: env("MAIL_HOST"),
    port,
    secure: port === 465,
    auth: {
      user: env("MAIL_USER"),
      pass: env("MAIL_PASS"),
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });
}

async function sendMail(payload: { to: string; subject: string; html: string }) {
  assertEmailConfig();

  try {
    return await getTransporter().sendMail({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (err) {
    console.error("[email] sendMail failed:", {
      host: env("MAIL_HOST"),
      port: env("MAIL_PORT"),
      user: env("MAIL_USER"),
      to: payload.to,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
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

// Новый опрос доступен респонденту
export async function sendNewSurveyEmail(
  email: string,
  name: string,
  survey: { title: string; reward: number; estimatedTime: number | null; id: string }
) {
  const url = `${getBaseUrl()}/survey/${survey.id}`;
  await sendMail({
    to: email,
    subject: `Новый опрос для вас — ${survey.reward} ₽`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">Для вас появился новый опрос</h2>
        <p style="color:#6B7280;">Привет, ${name}!</p>
        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="font-weight:600;color:#111827;margin:0 0 8px;">${survey.title}</p>
          <p style="color:#6366F1;font-size:20px;font-weight:700;margin:0;">+${survey.reward} ₽</p>
          ${survey.estimatedTime ? `<p style="color:#9CA3AF;font-size:13px;margin:4px 0 0;">~${survey.estimatedTime} минут</p>` : ""}
        </div>
        <a href="${url}" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Пройти опрос
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">
          Вы получили это письмо как участник платформы ПотокМнений.
        </p>
      </div>
    `,
  });
}

// Начисление вознаграждения
export async function sendEarningEmail(
  email: string,
  name: string,
  amount: number,
  surveyTitle: string
) {
  await sendMail({
    to: email,
    subject: `Начислено ${amount} ₽ — ПотокМнений`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">Вознаграждение начислено!</h2>
        <p style="color:#6B7280;">Привет, ${name}! Вы завершили опрос и получили вознаграждение.</p>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#15803D;font-size:36px;font-weight:700;margin:0;">+${amount} ₽</p>
          <p style="color:#6B7280;font-size:13px;margin:8px 0 0;">Опрос: ${surveyTitle}</p>
        </div>
        <a href="${getBaseUrl()}/respondent/wallet" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Перейти к кошельку
        </a>
      </div>
    `,
  });
}

// Статус вывода средств
export async function sendWithdrawalStatusEmail(
  email: string,
  name: string,
  amount: number,
  status: "COMPLETED" | "REJECTED" | "FAILED",
  adminNote?: string
) {
  const isSuccess = status === "COMPLETED";
  const isRejected = status === "REJECTED";
  await sendMail({
    to: email,
    subject: isSuccess
      ? `Вывод ${amount} ₽ выполнен`
      : isRejected
        ? `Заявка на вывод отклонена — ПотокМнений`
        : `Выплата не выполнена — ПотокМнений`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">${isSuccess ? "Средства переведены" : isRejected ? "Заявка отклонена" : "Выплата не выполнена"}</h2>
        <p style="color:#6B7280;">Привет, ${name}!</p>
        <p style="color:#374151;">
          ${isSuccess
            ? `Ваша заявка на вывод ${amount} ₽ успешно обработана. Средства поступят в течение 1-3 рабочих дней.`
            : isRejected
              ? `Ваша заявка на вывод ${amount} ₽ была отклонена.`
              : `Не удалось выполнить выплату ${amount} ₽. Средства возвращены на ваш баланс.`
          }
        </p>
        ${!isSuccess && adminNote ? `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#DC2626;margin:0;font-size:14px;">Причина: ${adminNote}</p>
          </div>
        ` : ""}
        <a href="${getBaseUrl()}/respondent/wallet" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Перейти к кошельку
        </a>
      </div>
    `,
  });
}

// Системное уведомление администратору
export async function sendAdminNotificationEmail(
  adminEmail: string,
  subject: string,
  details: { label: string; value: string }[],
  linkUrl?: string,
  linkLabel?: string
) {
  if (!adminEmail.trim()) return;

  const rows = details
    .map(
      (d) =>
        `<tr><td style="padding:6px 12px;color:#6B7280;font-size:13px;white-space:nowrap;">${d.label}</td><td style="padding:6px 12px;color:#111827;font-size:13px;font-weight:500;">${d.value}</td></tr>`,
    )
    .join("");

  await sendMail({
    to: adminEmail,
    subject: `[Админ] ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <div style="background:#F3F0FF;border-radius:12px;padding:6px 14px;display:inline-block;margin-bottom:20px;">
          <span style="color:#6D3AE2;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">ПотокМнений · Системное уведомление</span>
        </div>
        <h2 style="color:#111827;margin:0 0 16px;">${subject}</h2>
        <table style="width:100%;border-collapse:collapse;background:#F9FAFB;border-radius:10px;overflow:hidden;">
          <tbody>${rows}</tbody>
        </table>
        ${
          linkUrl
            ? `<a href="${linkUrl}" style="display:inline-block;margin-top:24px;background:#6D3AE2;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">${linkLabel ?? "Перейти"}</a>`
            : ""
        }
        <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">
          Это автоматическое письмо от платформы ПотокМнений. Не отвечайте на него.
        </p>
      </div>
    `,
  });
}

// Приветствие нового респондента, добавленного через анкету для своей базы
export async function sendRespondentWelcomeViaSelfServiceEmail(
  email: string,
  name: string,
  resetToken: string,
  surveyTitle: string
) {
  const base = getBaseUrl();
  const link = `${base}/auth/reset-password?token=${resetToken}`;
  await sendMail({
    to: email,
    subject: "Вы участвовали в опросе — добро пожаловать на ПотокМнений",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <div style="background:#F3F0FF;border-radius:12px;padding:6px 14px;display:inline-block;margin-bottom:20px;">
          <span style="color:#6D3AE2;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">ПотокМнений</span>
        </div>
        <h2 style="color:#111827;margin:0 0 12px;">Привет, ${name}!</h2>
        <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
          Вы только что прошли опрос <strong>«${surveyTitle}»</strong> и автоматически стали участником платформы <strong>ПотокМнений</strong>.
        </p>
        <p style="color:#374151;line-height:1.6;margin:0 0 16px;">
          На платформе вы можете участвовать в оплачиваемых опросах и зарабатывать за своё мнение.
          Чтобы войти в личный кабинет, установите пароль по кнопке ниже — ссылка действует 7 дней.
        </p>
        <a href="${link}" style="display:inline-block;background:#6D3AE2;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
          Установить пароль и войти
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">
          Если вы не хотите участвовать в опросах — просто проигнорируйте это письмо. Ваш email не будет использоваться для рассылок без вашего согласия.
        </p>
      </div>
    `,
  });
}

// Статус опроса (заказчику)
export async function sendSurveyStatusEmail(
  email: string,
  name: string,
  surveyTitle: string,
  status: "APPROVED" | "REJECTED",
  moderationNote?: string
) {
  const isApproved = status === "APPROVED";
  await sendMail({
    to: email,
    subject: isApproved ? `Опрос одобрен — ${surveyTitle}` : `Опрос отклонён — ${surveyTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">${isApproved ? "Опрос опубликован" : "Опрос отклонён"}</h2>
        <p style="color:#6B7280;">Привет, ${name}!</p>
        <p style="color:#374151;">
          ${isApproved
            ? `Ваш опрос "${surveyTitle}" прошёл модерацию и теперь доступен респондентам.`
            : `Ваш опрос "${surveyTitle}" был отклонён модератором.`
          }
        </p>
        ${!isApproved && moderationNote ? `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#DC2626;margin:0;font-size:14px;">Причина: ${moderationNote}</p>
          </div>
        ` : ""}
        <a href="${getBaseUrl()}/client/surveys" style="display:inline-block;background:#6366F1;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Мои опросы
        </a>
      </div>
    `,
  });
}
