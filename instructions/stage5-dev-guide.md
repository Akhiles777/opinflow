# ИНСТРУКЦИЯ ПО РАЗРАБОТКЕ — ЭТАП 5
# Уведомления + Полная админ-панель + Деплой на VPS

---

# ОБЗОР ЭТАПА

```
Что строим:

1. EMAIL УВЕДОМЛЕНИЯ (Яндекс SMTP — уже есть lib/email.ts)
   Новые события → шаблоны писем → отправка

2. PUSH УВЕДОМЛЕНИЯ (Web Push API)
   Браузерные уведомления → даже когда вкладка закрыта

3. ПОЛНАЯ АДМИН-ПАНЕЛЬ
   Всё что не доделано: жалобы, эксперты, настройки платформы

4. ДЕПЛОЙ НА VPS
   Timeweb или Selectel → Docker → Nginx → SSL
   Перенос БД на российский сервер (152-ФЗ)
```

---

# ЧАСТЬ 1 — ПОДГОТОВКА

---

## 1.1 — Установка зависимостей

```bash
# Web Push уведомления
npm install web-push
npm install @types/web-push -D

# Для генерации VAPID ключей (один раз)
npx web-push generate-vapid-keys
```

Сохрани VAPID ключи в `.env`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."   # публичный — идёт на фронт
VAPID_PRIVATE_KEY="..."              # приватный — только на сервере
VAPID_EMAIL="mailto:admin@potokmneny.ru"
```

---

## 1.2 — Расширить Prisma схему

```prisma
// ══════════════════════════════════════════════════════════
// PUSH ПОДПИСКИ
// ══════════════════════════════════════════════════════════

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("push_subscriptions")
}

// ══════════════════════════════════════════════════════════
// УВЕДОМЛЕНИЯ В БАЗЕ (история)
// ══════════════════════════════════════════════════════════

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  link      String?          // куда вести при клике
  isRead    Boolean          @default(false)
  sentEmail Boolean          @default(false)
  sentPush  Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

enum NotificationType {
  NEW_SURVEY           // новый доступный опрос (респонденту)
  EARNING_CREDITED     // начислено вознаграждение
  WITHDRAWAL_STATUS    // статус вывода изменился
  SURVEY_APPROVED      // опрос одобрен (заказчику)
  SURVEY_REJECTED      // опрос отклонён (заказчику)
  SURVEY_COMPLETED     // опрос набрал нужное число ответов
  REFERRAL_BONUS       // реферальный бонус
  SYSTEM               // системное сообщение
}
```

Добавить в модель `User`:
```prisma
pushSubscriptions PushSubscription[]
notifications     Notification[]
```

```bash
npx prisma generate
npx prisma db push
```

---

# ЧАСТЬ 2 — EMAIL УВЕДОМЛЕНИЯ

---

## 2.1 — Расширить `lib/email.ts`

`lib/email.ts` уже есть с Яндекс SMTP. Добавь новые функции:

```typescript
// Уже есть:
// sendVerificationEmail()
// sendPasswordResetEmail()

// ДОБАВИТЬ:

// Новый опрос доступен респонденту
export async function sendNewSurveyEmail(
  email: string,
  name: string,
  survey: { title: string; reward: number; estimatedTime: number | null; id: string }
) {
  const url = `${BASE_URL}/survey/${survey.id}`
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
        <a href="${BASE_URL}/respondent/wallet" style="display:inline-block;background:#6366F1;
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
        <a href="${BASE_URL}/respondent/wallet" style="display:inline-block;background:#6366F1;
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
        <a href="${BASE_URL}/client/surveys" style="display:inline-block;background:#6366F1;
           color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;">
          Мои опросы
        </a>
      </div>
    `,
  })
}
```

---

## 2.2 — Сервис уведомлений `lib/notifications.ts`

Централизованное место для отправки — чтобы не дублировать логику по всему коду:

```typescript
import { prisma }                from '@/lib/prisma'
import {
  sendNewSurveyEmail, sendEarningEmail,
  sendWithdrawalStatusEmail, sendSurveyStatusEmail,
} from '@/lib/email'
import { sendPushToUser }        from '@/lib/push'
import type { NotificationType } from '@prisma/client'

type NotifyParams = {
  userId:  string
  type:    NotificationType
  title:   string
  body:    string
  link?:   string
  // Данные для email
  emailData?: Record<string, any>
}

export async function notify(params: NotifyParams) {
  // 1. Сохранить в БД
  await prisma.notification.create({
    data: {
      userId:  params.userId,
      type:    params.type,
      title:   params.title,
      body:    params.body,
      link:    params.link,
    },
  })

  // 2. Отправить Push (не блокируем основной поток)
  sendPushToUser(params.userId, {
    title: params.title,
    body:  params.body,
    url:   params.link,
  }).catch(console.error)

  // 3. Отправить Email по типу
  const user = await prisma.user.findUnique({
    where:  { id: params.userId },
    select: { email: true, name: true },
  })
  if (!user?.email) return

  const name = user.name ?? 'Пользователь'

  try {
    switch (params.type) {
      case 'EARNING_CREDITED':
        await sendEarningEmail(
          user.email, name,
          params.emailData?.amount,
          params.emailData?.surveyTitle,
        )
        break
      case 'WITHDRAWAL_STATUS':
        await sendWithdrawalStatusEmail(
          user.email, name,
          params.emailData?.amount,
          params.emailData?.status,
          params.emailData?.adminNote,
        )
        break
      case 'SURVEY_APPROVED':
        await sendSurveyStatusEmail(user.email, name, params.emailData?.surveyTitle, 'APPROVED')
        break
      case 'SURVEY_REJECTED':
        await sendSurveyStatusEmail(
          user.email, name,
          params.emailData?.surveyTitle,
          'REJECTED',
          params.emailData?.moderationNote,
        )
        break
    }

    await prisma.notification.updateMany({
      where: { userId: params.userId, type: params.type, sentEmail: false },
      data:  { sentEmail: true },
    })
  } catch (e) {
    console.error('[notify] email error:', e)
  }
}

// Отправить всем подходящим респондентам о новом опросе
export async function notifyRespondentsNewSurvey(survey: {
  id: string; title: string; reward: any; estimatedTime: number | null
  targetGender: string | null; targetAgeMin: number | null; targetAgeMax: number | null
  targetCities: string[]
}) {
  // Найти подходящих респондентов
  const respondents = await prisma.user.findMany({
    where: {
      role:   'RESPONDENT',
      status: 'ACTIVE',
      respondentProfile: {
        // Базовый таргетинг
        OR: [
          { gender: null },
          { gender: survey.targetGender ?? undefined },
        ],
      },
    },
    select: { id: true, email: true, name: true },
    take: 500, // не спамить всем сразу
  })

  for (const user of respondents) {
    // Не отправлять тем кто уже проходил
    const alreadyDone = await prisma.surveySession.findUnique({
      where: { surveyId_userId: { surveyId: survey.id, userId: user.id } },
    })
    if (alreadyDone) continue

    await notify({
      userId: user.id,
      type:   'NEW_SURVEY',
      title:  'Новый опрос для вас',
      body:   `${survey.title} — ${Number(survey.reward)} ₽`,
      link:   `/survey/${survey.id}`,
      emailData: {
        title:         survey.title,
        reward:        Number(survey.reward),
        estimatedTime: survey.estimatedTime,
        id:            survey.id,
      },
    })

    // Пауза чтобы не перегружать SMTP
    await new Promise(r => setTimeout(r, 100))
  }
}
```

---

# ЧАСТЬ 3 — PUSH УВЕДОМЛЕНИЯ

---

## 3.1 — Создать `lib/push.ts`

```typescript
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

type PushPayload = {
  title: string
  body:  string
  url?:  string
  icon?: string
}

// Отправить push всем подпискам пользователя
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const icon = `${process.env.NEXTAUTH_URL}/icon-192.png`

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys:     { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ ...payload, icon }),
      )
    } catch (e: any) {
      // Подписка протухла — удалить
      if (e.statusCode === 410 || e.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
    }
  }
}
```

---

## 3.2 — API роуты для Push

### `app/api/push/subscribe/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  const { p256dh, auth: authKey } = keys

  // Сохранить или обновить подписку
  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    create: {
      userId:    session.user.id,
      endpoint,
      p256dh,
      auth:      authKey,
      userAgent: req.headers.get('user-agent') ?? undefined,
    },
    update: { p256dh, auth: authKey },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json()
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  return NextResponse.json({ ok: true })
}
```

---

## 3.3 — Клиентский хук `hooks/usePushNotifications.ts`

```typescript
'use client'
import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setPermission(Notification.permission)
    checkSubscription()
  }, [])

  async function checkSubscription() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setIsSubscribed(!!sub)
  }

  async function subscribe() {
    const permission = await Notification.requestPermission()
    setPermission(permission)
    if (permission !== 'granted') return false

    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    await fetch('/api/push/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(sub.toJSON()),
    })

    setIsSubscribed(true)
    return true
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return

    await fetch('/api/push/subscribe', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
    setIsSubscribed(false)
  }

  return { permission, isSubscribed, subscribe, unsubscribe }
}
```

---

## 3.4 — Service Worker `public/sw.js`

```javascript
// Service Worker для Push уведомлений
// Файл должен лежать в /public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'ПотокМнений', {
      body:  data.body,
      icon:  data.icon ?? '/icon-192.png',
      badge: '/icon-72.png',
      data:  { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})
```

// Мы остановились здесь!!!

Зарегистрировать SW в `app/layout.tsx`:
```typescript
// В useEffect на клиенте:
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

---



## 3.5 — Иконки для PWA

Создай иконки и положи в `/public/`:
- `icon-72.png` — 72×72px
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Используй логотип ПотокМнений.

---



## 3.6 — Компонент кнопки подписки

```typescript
// components/dashboard/PushNotificationButton.tsx
'use client'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { BellIcon, BellSlashIcon } from 'lucide-react'

export default function PushNotificationButton() {
  const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications()

  // Если браузер не поддерживает — не показываем кнопку
  if (typeof window !== 'undefined' && !('Notification' in window)) return null

  if (isSubscribed) {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   text-sm text-dash-muted hover:text-dash-body
                   hover:bg-dash-bg transition-colors"
        title="Отключить push уведомления"
      >
        <BellSlashIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Уведомления вкл.</span>
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      className="flex items-center gap-2 px-3 py-2 rounded-lg
                 text-sm text-brand hover:bg-brand/10
                 border border-brand/20 transition-colors"
      title="Включить push уведомления"
    >
      <BellIcon className="w-4 h-4" />
      <span className="hidden sm:inline">Включить уведомления</span>
    </button>
  )
}
```

Добавить в `TopBar.tsx` рядом с ThemeToggle.

---

## 3.7 — Интегрировать уведомления в существующие actions

После того как `lib/notifications.ts` готов — добавить вызовы `notify()` в существующие Server Actions:

**В `actions/surveys.ts`** — после одобрения/отклонения:
```typescript
// В approveSurveyAction():
await notify({
  userId: survey.creatorId,
  type:   'SURVEY_APPROVED',
  title:  'Опрос одобрен',
  body:   `Ваш опрос "${survey.title}" опубликован`,
  link:   `/client/surveys/${surveyId}`,
  emailData: { surveyTitle: survey.title },
})

// В rejectSurveyAction():
await notify({
  userId: survey.creatorId,
  type:   'SURVEY_REJECTED',
  title:  'Опрос отклонён',
  body:   `Опрос "${survey.title}" отклонён: ${reason}`,
  link:   `/client/surveys/${surveyId}`,
  emailData: { surveyTitle: survey.title, moderationNote: reason },
})
```

**В `actions/surveys.ts`** — после начисления:
```typescript
// В completeSurveyAction() если fraud.isValid:
await notify({
  userId: session.user.id,
  type:   'EARNING_CREDITED',
  title:  'Начислено вознаграждение',
  body:   `+${Number(survey.reward)} ₽ за опрос "${survey.title}"`,
  link:   '/respondent/wallet',
  emailData: { amount: Number(survey.reward), surveyTitle: survey.title },
})
```

**В `actions/payments.ts`** — после изменения статуса вывода:
```typescript
// В rejectWithdrawalAction():
await notify({
  userId: requestRecord.userId,
  type:   'WITHDRAWAL_STATUS',
  title:  'Заявка на вывод отклонена',
  body:   `Заявка на ${Number(requestRecord.amount)} ₽ отклонена`,
  link:   '/respondent/wallet',
  emailData: {
    amount: Number(requestRecord.amount),
    status: 'REJECTED',
    adminNote: reason,
  },
})
```

---

## 3.8 — Колокольчик в TopBar

Создай `components/dashboard/NotificationBell.tsx`:

```typescript
'use client'
// Загружает последние 5 непрочитанных уведомлений
// При клике показывает дропдаун со списком
// Каждое уведомление — кликабельная строка ведущая на link
// Кнопка "Отметить все прочитанными"
// Красный badge с числом непрочитанных на иконке колокольчика
// Polling каждые 30 секунд или SSE (выбери polling — проще)
```

API для уведомлений `app/api/notifications/route.ts`:
```typescript
// GET: последние 20 уведомлений пользователя
// PATCH: отметить все как прочитанные
```

---




Надо провести полную проверку и тестирование, посмотреть приходят ли уведомления на почту!
А так-же подключить уведомления у заказчиков!!!







# ЧАСТЬ 4 — ПОЛНАЯ АДМИН-ПАНЕЛЬ

---

## 4.1 — Что доделать в админке

На Этапах 3-4 сделали: модерация, финансы, пользователи (частично).

Осталось:

### `app/(dashboard)/admin/users/page.tsx` — доделать

```typescript
// Табы: Все | Респонденты | Заказчики | Заблокированные
// Поиск по email/имени
// Фильтр по статусу

// Таблица: Пользователь | Роль | Дата регистрации | Статус | Действия

// Действия:
// "Просмотреть" → страница пользователя /admin/users/[id]
//   Показывает: профиль, кошелёк, список опросов/сессий
// "Заблокировать / Разблокировать" → toggleUserBlockAction()
// "Сбросить пароль" → отправить письмо со сбросом

// Жалобы — отдельная вкладка в этой же странице или /admin/complaints
// Таблица: От кого | На что | Причина | Дата | Статус | Действия (принять/отклонить)
```

### `app/(dashboard)/admin/experts/page.tsx` — доделать

```typescript
// Список заказов "Экспертное заключение"
// Заказчик оформил заявку → администратор назначает эксперта → эксперт загружает PDF

// Таблица: Заказчик | Опрос | Дата заказа | Назначен | Статус | Действия
// Действия:
//   "Назначить эксперта" → Modal: select из списка экспертов (роль EXPERT или просто email)
//   "Загрузить заключение" → upload PDF → Supabase Storage → отправить заказчику
```

### `app/(dashboard)/admin/settings/page.tsx` — НОВОЕ

```typescript
// Настройки платформы:
// Комиссия платформы (текущая: 15%) → input + кнопка сохранить
//   Сохранять в отдельной таблице PlatformSettings или .env
// Минимальная сумма вывода (текущая: 100 ₽)
// Минимальное вознаграждение за опрос (текущая: 20 ₽)
// Технические работы → toggle (показывает баннер на сайте)
// Email для уведомлений администратора
```

Prisma модель для настроек:
```prisma
model PlatformSettings {
  id                String  @id @default("singleton")
  commissionPercent Decimal @default(15) @db.Decimal(5, 2)
  minWithdrawal     Decimal @default(100) @db.Decimal(10, 2)
  minReward         Decimal @default(20) @db.Decimal(10, 2)
  maintenanceMode   Boolean @default(false)
  adminEmail        String  @default("")
  updatedAt         DateTime @updatedAt

  @@map("platform_settings")
}
```

### `app/(dashboard)/admin/page.tsx` — обзор (доделать)

```typescript
// StatCards: на модерации | новых за неделю | оборот за месяц | жалоб
// График регистраций по дням (recharts LineChart)
// Последние события: лента активности
// Быстрые ссылки: На модерацию | Заявки на вывод | Жалобы
```

---

# ЧАСТЬ 5 — ДЕПЛОЙ НА VPS

---

## 5.1 — Выбор провайдера

**Timeweb Cloud** — проще, дешевле, хорошая поддержка
- cloud.timeweb.com
- Тариф: 2 CPU / 4GB RAM / 50GB SSD — от 800 ₽/мес

**Selectel** — надёжнее, чуть дороже
- selectel.ru
- Тариф: аналогичный — от 1000 ₽/мес

Оба соответствуют 152-ФЗ — серверы в России.

---

## 5.2 — Что нужно от клиента перед деплоем

1. **Домен** — например `potokmneny.ru`
   - Купить на reg.ru или nic.ru (~200 ₽/год)
   - Или если есть — прислать логин к регистратору
2. **VPS** — купить или дать доступ к уже имеющемуся
   - Прислать: IP, root пароль или SSH ключ
3. **Боевые ключи ЮKassa** — переключить с test_ на боевые

---

## 5.3 — Настройка VPS (Ubuntu 22.04)

Подключись по SSH и выполни:

```bash
# Обновить систему
apt update && apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Установить Docker Compose
apt install docker-compose-plugin -y

# Установить Nginx
apt install nginx -y
systemctl enable nginx

# Установить Certbot для SSL
apt install certbot python3-certbot-nginx -y

# Создать папку проекта
mkdir -p /opt/opinflow
cd /opt/opinflow
```

---

## 5.4 — Dockerfile

Создай `Dockerfile` в корне проекта:

```dockerfile
FROM node:20-alpine AS base

# Зависимости
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Сборка
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Переменные окружения нужны при сборке
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npx prisma generate
RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Добавь в `next.config.js`:
```javascript
output: 'standalone',
```

---

## 5.5 — docker-compose.yml

Создай на VPS `/opt/opinflow/docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: opinflow:latest
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB:       opinflow
      POSTGRES_USER:     opinflow
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 5.6 — Nginx конфиг

```nginx
# /etc/nginx/sites-available/opinflow

server {
    listen 80;
    server_name potokmneny.ru www.potokmneny.ru;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/opinflow /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 5.7 — SSL сертификат

```bash
certbot --nginx -d potokmneny.ru -d www.potokmneny.ru
# Следовать инструкциям
# Выбрать "Redirect HTTP to HTTPS"
```

Certbot автоматически обновляет сертификат каждые 90 дней.

---

## 5.8 — CI/CD скрипт деплоя

Создай `deploy.sh` на VPS:

```bash
#!/bin/bash
set -e

echo "🚀 Начинаем деплой..."

cd /opt/opinflow

# Получить свежий код
git pull origin main

# Собрать образ
docker build \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=$(grep NEXT_PUBLIC_VAPID_PUBLIC_KEY .env.production | cut -d= -f2) \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.production | cut -d= -f2) \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.production | cut -d= -f2) \
  -t opinflow:latest .

# Применить миграции БД
docker run --rm --env-file .env.production opinflow:latest \
  npx prisma db push

# Перезапустить
docker-compose down
docker-compose up -d

echo "✅ Деплой завершён!"
```

```bash
chmod +x deploy.sh
```

---

## 5.9 — Перенос базы данных

Текущая БД на Prisma Postgres (США) → нужно перенести на VPS PostgreSQL (Россия).

```bash
# На локальной машине — дамп из Prisma Postgres
pg_dump "postgresql://..." > opinflow_backup.sql

# Копировать на VPS
scp opinflow_backup.sql root@SERVER_IP:/opt/opinflow/

# На VPS — восстановить в локальный PostgreSQL
docker exec -i opinflow_postgres_1 psql -U opinflow -d opinflow < opinflow_backup.sql
```

Обновить `DATABASE_URL` в `.env.production`:
```env
DATABASE_URL="postgresql://opinflow:password@localhost:5432/opinflow"
DIRECT_URL="postgresql://opinflow:password@localhost:5432/opinflow"
```

---

## 5.10 — DNS настройки

После получения IP сервера — в личном кабинете регистратора домена добавить:

```
A     @              SERVER_IP     TTL 300
A     www            SERVER_IP     TTL 300
CNAME mail           ya.ru                  (если почта на Яндексе)
```

Изменения DNS применяются за 1-24 часа.

---

# ЧАСТЬ 6 — ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ

---

## 6.1 — Чеклист перед сдачей

```
УВЕДОМЛЕНИЯ:
  □ Подписаться на Push → разрешить в браузере
  □ Пройти опрос → получить Push + Email о начислении
  □ Одобрить опрос как админ → заказчик получил Push + Email
  □ Отклонить заявку на вывод → респондент получил Push + Email
  □ Колокольчик в TopBar показывает непрочитанные

ПОЛНАЯ АДМИН-ПАНЕЛЬ:
  □ Просмотр и блокировка пользователей
  □ Жалобы — принять / отклонить
  □ Эксперты — назначить, загрузить заключение
  □ Настройки — изменить комиссию → проверить расчёт в конструкторе

ДЕПЛОЙ:
  □ Сайт открывается по домену с HTTPS
  □ Авторизация работает
  □ Платежи работают (боевые ключи ЮKassa)
  □ Email отправляется с правильного домена
  □ PDF генерируется
  □ Supabase Storage работает
  □ VK и Яндекс OAuth — обновить Redirect URI на боевой домен
  □ ЮKassa webhook URL обновить на боевой домен

ПРОИЗВОДИТЕЛЬНОСТЬ:
  □ npm run build без ошибок и warning-ов
  □ Главная страница загружается за < 3 сек
  □ Lighthouse score > 80
```

---

# ПОРЯДОК РАЗРАБОТКИ ПО ДНЯМ

```
День 1:
  □ Установить web-push, сгенерировать VAPID ключи
  □ Расширить Prisma схему (PushSubscription, Notification, PlatformSettings)
  □ npx prisma db push

День 2:
  □ lib/push.ts
  □ app/api/push/subscribe/route.ts
  □ public/sw.js
  □ hooks/usePushNotifications.ts

День 3:
  □ Расширить lib/email.ts новыми шаблонами
  □ lib/notifications.ts
  □ app/api/notifications/route.ts

День 4:
  □ Интегрировать notify() в actions/surveys.ts
  □ Интегрировать notify() в actions/payments.ts
  □ components/dashboard/PushNotificationButton.tsx
  □ components/dashboard/NotificationBell.tsx

День 5:
  □ app/(dashboard)/admin/users/page.tsx — доделать
  □ app/(dashboard)/admin/complaints/page.tsx
  □ app/(dashboard)/admin/experts/page.tsx

День 6:
  □ app/(dashboard)/admin/settings/page.tsx
  □ app/(dashboard)/admin/page.tsx — обзор с графиком

День 7:
  □ Dockerfile + next.config.js (output: standalone)
  □ Купить/настроить VPS
  □ Установить Docker, Nginx

День 8:
  □ Перенести БД на VPS
  □ Настроить Nginx + SSL
  □ Первый деплой через docker-compose

День 9:
  □ Настроить DNS
  □ Обновить все OAuth Redirect URI на боевой домен
  □ Обновить webhook URL в ЮKassa
  □ Переключить ЮKassa на боевые ключи

День 10:
  □ Финальное тестирование по чеклисту
  □ Исправить найденные баги
```
