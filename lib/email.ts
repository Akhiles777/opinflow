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

// Новый опрос доступен респонденту
export async function sendNewSurveyEmail(
  email: string,
  name: string,
  survey: { title: string; reward: number; estimatedTime: number | null; id: string }
) {
  const url = `${getBaseUrl()}/survey/${survey.id}`
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Новый опрос для вас — ${survey.reward} ₽`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">Для вас появился новый опрос</h2>
        <p style="color:#6B7280;">Привет, ${name}!</p>
        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="font-weight:600;color:#111827;margin:0 0 8px;">${survey.title}</p>
          <p style="color:#6366F1;font-size:20px;font-weight:700;margin:0;">+${survey.reward} ₽</p>
          ${survey.estimatedTime ? `<p style="color:#9CA3AF;font-size:13px;margin:4px 0 0;">~${survey.estimatedTime} минут</p>` : ''}
        </div>
        <a href="${url}" style="display:inline-block;background:#6366F1;color:#fff;
           text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Пройти опрос
        </a>
        <p style="color:#9CA3AF;font-size:12px;margin-top:32px;">
          Вы получили это письмо как участник платформы ПотокМнений.
        </p>
      </div>
    `,
  })
}

// Начисление вознаграждения
export async function sendEarningEmail(
  email: string,
  name: string,
  amount: number,
  surveyTitle: string
) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Начислено ${amount} ₽ — ПотокМнений`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">Вознаграждение начислено!</h2>
        <p style="color:#6B7280;">Привет, ${name}! Вы завершили опрос и получили вознаграждение.</p>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;
                    padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#15803D;font-size:36px;font-weight:700;margin:0;">+${amount} ₽</p>
          <p style="color:#6B7280;font-size:13px;margin:8px 0 0;">Опрос: ${surveyTitle}</p>
        </div>
        <a href="${getBaseUrl()}/respondent/wallet" style="display:inline-block;background:#6366F1;
           color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Перейти к кошельку
        </a>
      </div>
    `,
  })
}

// Статус вывода средств
export async function sendWithdrawalStatusEmail(
  email: string,
  name: string,
  amount: number,
  status: 'COMPLETED' | 'REJECTED',
  adminNote?: string
) {
  const isSuccess = status === 'COMPLETED'
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: isSuccess ? `Вывод ${amount} ₽ выполнен` : `Заявка на вывод отклонена — ПотокМнений`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">${isSuccess ? 'Средства переведены' : 'Заявка отклонена'}</h2>
        <p style="color:#6B7280;">Привет, ${name}!</p>
        <p style="color:#374151;">
          ${isSuccess
            ? `Ваша заявка на вывод ${amount} ₽ успешно обработана. Средства поступят в течение 1-3 рабочих дней.`
            : `Ваша заявка на вывод ${amount} ₽ была отклонена.`
          }
        </p>
        ${!isSuccess && adminNote ? `
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#DC2626;margin:0;font-size:14px;">Причина: ${adminNote}</p>
          </div>
        ` : ''}
        <a href="${getBaseUrl()}/respondent/wallet" style="display:inline-block;background:#6366F1;
           color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Перейти к кошельку
        </a>
      </div>
    `,
  })
}

// Статус опроса (заказчику)
export async function sendSurveyStatusEmail(
  email: string,
  name: string,
  surveyTitle: string,
  status: 'APPROVED' | 'REJECTED',
  moderationNote?: string
) {
  const isApproved = status === 'APPROVED'
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: isApproved ? `Опрос одобрен — ${surveyTitle}` : `Опрос отклонён — ${surveyTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h2 style="color:#111827;">
          ${isApproved ? '✅ Опрос опубликован' : '❌ Опрос отклонён'}
        </h2>
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
        ` : ''}
        <a href="${getBaseUrl()}/client/surveys" style="display:inline-block;background:#6366F1;
           color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Мои опросы
        </a>
      </div>
    `,
  })
}