# ПРОМПТ ДЛЯ CODEX — ЭТАП 5
# Уведомления (Email + Push) + Полная админ-панель + Деплой на VPS

---

## 🎯 ЗАДАЧА ЭТАПА

1. Email уведомления — новые шаблоны писем для всех событий платформы
2. Web Push уведомления — браузерные, даже когда вкладка закрыта
3. Колокольчик уведомлений в TopBar
4. Полная админ-панель — жалобы, эксперты, настройки платформы
5. Деплой на VPS — Docker + Nginx + SSL + перенос БД

---

## 📦 УСТАНОВКА

```bash
npm install web-push
npm install @types/web-push -D

# Сгенерировать VAPID ключи (ОДИН РАЗ, сохранить в .env)
npx web-push generate-vapid-keys
```

Добавить в `.env`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_EMAIL="mailto:admin@potokmneny.ru"
```

---

## 🗄️ ШАГ 1 — РАСШИРИТЬ `prisma/schema.prisma`

Добавить новые модели:

```prisma
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

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  link      String?
  isRead    Boolean          @default(false)
  sentEmail Boolean          @default(false)
  sentPush  Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

enum NotificationType {
  NEW_SURVEY
  EARNING_CREDITED
  WITHDRAWAL_STATUS
  SURVEY_APPROVED
  SURVEY_REJECTED
  SURVEY_COMPLETED
  REFERRAL_BONUS
  SYSTEM
}

model PlatformSettings {
  id                String   @id @default("singleton")
  commissionPercent Decimal  @default(15) @db.Decimal(5, 2)
  minWithdrawal     Decimal  @default(100) @db.Decimal(10, 2)
  minReward         Decimal  @default(20) @db.Decimal(10, 2)
  maintenanceMode   Boolean  @default(false)
  adminEmail        String   @default("")
  updatedAt         DateTime @updatedAt

  @@map("platform_settings")
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

## 📧 ШАГ 2 — Расширить `lib/email.ts`

Добавить новые функции к уже существующим `sendVerificationEmail` и `sendPasswordResetEmail`.

```typescript
const BASE_URL = process.env.NEXTAUTH_URL!

// Новый опрос для респондента
export async function sendNewSurveyEmail(
  email: string, name: string,
  survey: { title: string; reward: number; estimatedTime: number | null; id: string }
) {
  // Subject: `Новый опрос для вас — ${survey.reward} ₽`
  // HTML: приветствие + карточка опроса (название, сумма крупно в brand цвете, время)
  // Кнопка: "Пройти опрос" → ${BASE_URL}/survey/${survey.id}
}

// Начисление вознаграждения
export async function sendEarningEmail(
  email: string, name: string,
  amount: number, surveyTitle: string
) {
  // Subject: `Начислено ${amount} ₽ — ПотокМнений`
  // HTML: большая зелёная сумма +X ₽ + название опроса
  // Кнопка: "Перейти к кошельку" → ${BASE_URL}/respondent/wallet
}

// Статус вывода средств
export async function sendWithdrawalStatusEmail(
  email: string, name: string,
  amount: number, status: 'COMPLETED' | 'REJECTED', adminNote?: string
) {
  // Subject зависит от статуса
  // COMPLETED: "Вывод X ₽ выполнен"
  // REJECTED:  "Заявка на вывод отклонена"
  // Если REJECTED и есть adminNote → красный блок с причиной
}

// Статус опроса для заказчика
export async function sendSurveyStatusEmail(
  email: string, name: string,
  surveyTitle: string, status: 'APPROVED' | 'REJECTED', moderationNote?: string
) {
  // APPROVED: зелёная иконка + "Опрос опубликован"
  // REJECTED: красная иконка + причина в красном блоке
  // Кнопка: "Мои опросы" → ${BASE_URL}/client/surveys
}

// Все письма используют тот же transporter что и существующие функции
// Стиль: font-family sans-serif, max-width 520px, padding 40px 32px
// Цвет кнопок: background #6366F1, border-radius 10px
```

---

## 🔔 ШАГ 3 — `lib/push.ts`

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

export async function sendPushToUser(userId: string, payload: PushPayload) {
  // Найти все PushSubscription по userId
  // Для каждой подписки: webpush.sendNotification(sub, JSON.stringify(payload))
  // icon: `${process.env.NEXTAUTH_URL}/icon-192.png`
  // При ошибке statusCode 410 или 404 → удалить подписку из БД (протухла)
  // Не бросать ошибку если подписок нет
}
```

---

## 🌐 ШАГ 4 — API роуты Push

### `app/api/push/subscribe/route.ts`

```typescript
// POST — сохранить подписку
// Получить session через auth()
// Если нет сессии → 401
// body: { endpoint, keys: { p256dh, auth } }
// prisma.pushSubscription.upsert({ where: { endpoint }, create: {...}, update: { p256dh, auth } })
// Вернуть { ok: true }

// DELETE — удалить подписку
// body: { endpoint }
// prisma.pushSubscription.deleteMany({ where: { endpoint } })
```

### `app/api/notifications/route.ts`

```typescript
// GET — последние 20 уведомлений текущего пользователя
// Отсортировать: непрочитанные сначала, потом по дате

// PATCH — отметить все как прочитанные
// prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
```

Добавить оба пути в publicPaths в `middleware.ts`:
```typescript
// НЕ добавлять — эти роуты требуют авторизации
// Убедиться что /api/push и /api/notifications НЕ в publicPaths
```

---

## 🔧 ШАГ 5 — `lib/notifications.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { sendPushToUser } from '@/lib/push'
import {
  sendNewSurveyEmail, sendEarningEmail,
  sendWithdrawalStatusEmail, sendSurveyStatusEmail,
} from '@/lib/email'
import type { NotificationType } from '@prisma/client'

type NotifyParams = {
  userId:     string
  type:       NotificationType
  title:      string
  body:       string
  link?:      string
  emailData?: Record<string, any>
}

export async function notify(params: NotifyParams) {
  // 1. Сохранить в БД
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type:   params.type,
      title:  params.title,
      body:   params.body,
      link:   params.link,
    },
  })

  // 2. Push — не await, не блокируем
  sendPushToUser(params.userId, {
    title: params.title,
    body:  params.body,
    url:   params.link,
  }).catch(console.error)

  // 3. Email по типу
  const user = await prisma.user.findUnique({
    where:  { id: params.userId },
    select: { email: true, name: true },
  })
  if (!user?.email) return

  const name = user.name ?? 'Пользователь'

  try {
    switch (params.type) {
      case 'EARNING_CREDITED':
        await sendEarningEmail(user.email, name, params.emailData?.amount, params.emailData?.surveyTitle)
        break
      case 'WITHDRAWAL_STATUS':
        await sendWithdrawalStatusEmail(user.email, name, params.emailData?.amount, params.emailData?.status, params.emailData?.adminNote)
        break
      case 'SURVEY_APPROVED':
        await sendSurveyStatusEmail(user.email, name, params.emailData?.surveyTitle, 'APPROVED')
        break
      case 'SURVEY_REJECTED':
        await sendSurveyStatusEmail(user.email, name, params.emailData?.surveyTitle, 'REJECTED', params.emailData?.moderationNote)
        break
      case 'NEW_SURVEY':
        await sendNewSurveyEmail(user.email, name, params.emailData as any)
        break
    }
    await prisma.notification.updateMany({
      where: { userId: params.userId, type: params.type, sentEmail: false },
      data:  { sentEmail: true },
    })
  } catch (e) {
    console.error('[notify] email error:', e)
    // Не бросаем — уведомление в БД уже сохранено
  }
}

// Уведомить подходящих респондентов о новом опросе
export async function notifyRespondentsNewSurvey(survey: {
  id: string; title: string; reward: any; estimatedTime: number | null
  targetGender: string | null
}) {
  // Найти до 200 активных респондентов
  // Для каждого проверить — не проходил ли уже
  // Вызвать notify() с паузой 100мс между отправками
  // Не бросать ошибку если кто-то не получил
}
```

---

## ⚙️ ШАГ 6 — Интегрировать notify() в существующие actions

### В `actions/surveys.ts`

```typescript
import { notify, notifyRespondentsNewSurvey } from '@/lib/notifications'

// В approveSurveyAction() — после prisma.survey.update:
await notify({
  userId: survey.creatorId,
  type:   'SURVEY_APPROVED',
  title:  'Опрос одобрен',
  body:   `Ваш опрос "${survey.title}" опубликован и доступен респондентам`,
  link:   `/client/surveys/${surveyId}`,
  emailData: { surveyTitle: survey.title },
})
// Уведомить респондентов о новом опросе (в фоне)
notifyRespondentsNewSurvey(survey).catch(console.error)

// В rejectSurveyAction() — после обновления статуса:
await notify({
  userId: survey.creatorId,
  type:   'SURVEY_REJECTED',
  title:  'Опрос отклонён',
  body:   `Опрос "${survey.title}" не прошёл модерацию`,
  link:   `/client/surveys/${surveyId}`,
  emailData: { surveyTitle: survey.title, moderationNote: reason },
})

// В completeSurveyAction() — после начисления (только если fraud.isValid):
await notify({
  userId: session.user.id,
  type:   'EARNING_CREDITED',
  title:  'Начислено вознаграждение',
  body:   `+${Number(survey.reward)} ₽ за опрос "${survey.title}"`,
  link:   '/respondent/wallet',
  emailData: { amount: Number(survey.reward), surveyTitle: survey.title },
})
```

### В `actions/payments.ts`

```typescript
import { notify } from '@/lib/notifications'

// В rejectWithdrawalAction() — после отклонения:
await notify({
  userId: requestRecord.userId,
  type:   'WITHDRAWAL_STATUS',
  title:  'Заявка на вывод отклонена',
  body:   `Заявка на ${Number(requestRecord.amount)} ₽ отклонена`,
  link:   '/respondent/wallet',
  emailData: { amount: Number(requestRecord.amount), status: 'REJECTED', adminNote: reason },
})

// В webhook handler — после payout.succeeded:
await notify({
  userId:    request.userId,
  type:      'WITHDRAWAL_STATUS',
  title:     'Средства переведены',
  body:      `${Number(request.amount)} ₽ успешно выплачено`,
  link:      '/respondent/wallet',
  emailData: { amount: Number(request.amount), status: 'COMPLETED' },
})
```

---

## 📱 ШАГ 7 — Service Worker `public/sw.js`

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'ПотокМнений', {
      body:  data.body,
      icon:  data.icon ?? '/icon-192.png',
      badge: '/icon-72.png',
      data:  { url: data.url ?? '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
```

Зарегистрировать в `app/layout.tsx` (client-side useEffect):
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error)
  }
}, [])
```

---

## 🪝 ШАГ 8 — `hooks/usePushNotifications.ts`

```typescript
'use client'
import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setPermission(Notification.permission)

    // Проверить текущую подписку
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setIsSubscribed(!!sub))
    )
  }, [])

  async function subscribe() {
    setIsLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(sub.toJSON()),
      })

      setIsSubscribed(true)
      return true
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    setIsLoading(true)
    try {
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
    } finally {
      setIsLoading(false)
    }
  }

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe }
}

// Утилита конвертации VAPID ключа
function urlBase64ToUint8Array(base64String: string) {
  const padding  = '='.repeat((4 - base64String.length % 4) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
```

---

## 🔔 ШАГ 9 — Компоненты уведомлений

### `components/dashboard/PushNotificationButton.tsx`

```typescript
'use client'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell, BellOff }        from 'lucide-react'

export default function PushNotificationButton() {
  const { isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()

  // Если браузер не поддерживает → null
  if (typeof window !== 'undefined' && !('Notification' in window)) return null

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  transition-all duration-200 disabled:opacity-50
                  ${isSubscribed
                    ? 'text-brand bg-brand/10 border border-brand/20'
                    : 'text-dash-muted hover:text-dash-body hover:bg-dash-bg border border-dash-border'
                  }`}
      title={isSubscribed ? 'Отключить уведомления' : 'Включить уведомления'}
    >
      {isSubscribed
        ? <Bell className="w-4 h-4" />
        : <BellOff className="w-4 h-4" />}
      <span className="hidden lg:inline">
        {isSubscribed ? 'Уведомления вкл.' : 'Уведомления'}
      </span>
    </button>
  )
}
```

### `components/dashboard/NotificationBell.tsx`

```typescript
'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell }   from 'lucide-react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string; title: string; body: string
  link: string | null; isRead: boolean; createdAt: string
}

export default function NotificationBell() {
  const [open, setOpen]                   = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const router                            = useRouter()
  const ref                               = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    const res  = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data.notifications ?? [])
    setUnreadCount(data.unreadCount ?? 0)
  }

  useEffect(() => {
    fetchNotifications()
    // Polling каждые 30 секунд
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Закрывать при клике вне
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  function handleNotificationClick(n: Notification) {
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <div ref={ref} className="relative">
      {/* Кнопка колокольчика */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg
                   border border-dash-border hover:bg-dash-bg transition-colors"
      >
        <Bell className="w-4 h-4 text-dash-muted" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white
                           text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Дропдаун */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dash-card
                        border border-dash-border rounded-2xl shadow-card-lg z-50 overflow-hidden">
          {/* Заголовок */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-dash-border">
            <span className="text-sm font-semibold text-dash-heading">Уведомления</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand hover:text-brand-dark transition-colors"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Список */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-dash-muted">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer
                              border-b border-dash-border last:border-0
                              hover:bg-dash-bg transition-colors
                              ${!n.isRead ? 'bg-brand/3' : ''}`}
                >
                  {/* Dot непрочитанного */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                                   ${!n.isRead ? 'bg-brand' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dash-heading truncate">{n.title}</p>
                    <p className="text-xs text-dash-muted mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-dash-muted mt-1">
                      {new Date(n.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

Добавить оба компонента в `components/dashboard/TopBar.tsx` рядом с ThemeToggle.

---

## 🛡️ ШАГ 10 — Полная админ-панель

### `actions/admin.ts` — новый файл

```typescript
'use server'
import { prisma }         from '@/lib/prisma'
import { requireRole }    from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

// Блокировка/разблокировка пользователя
export async function toggleUserBlockAction(userId: string) {
  await requireRole('ADMIN')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Пользователь не найден' }

  const newStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'
  await prisma.user.update({ where: { id: userId }, data: { status: newStatus } })
  revalidatePath('/admin/users')
  return { success: true, newStatus }
}

// Обработка жалобы
export async function resolveComplaintAction(id: string, status: 'RESOLVED' | 'DISMISSED') {
  await requireRole('ADMIN')
  await prisma.complaint.update({ where: { id }, data: { status } })
  revalidatePath('/admin/users')
  return { success: true }
}

// Сохранить настройки платформы
export async function savePlatformSettingsAction(data: {
  commissionPercent: number
  minWithdrawal:     number
  minReward:         number
  maintenanceMode:   boolean
  adminEmail:        string
}) {
  await requireRole('ADMIN')

  await prisma.platformSettings.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

// Получить настройки (используется в конструкторе для комиссии)
export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  })
}
```

### `app/(dashboard)/admin/users/page.tsx`

```typescript
// Server Component
// requireRole('ADMIN')
//
// Табы: Все | Респонденты | Заказчики | Заблокированные | Жалобы
//
// Поиск по email/имени через searchParams.q
// Фильтр по роли через searchParams.role
//
// Таблица пользователей:
// Аватар+имя | Email | Роль (Badge) | Статус (Badge) | Дата | Действия
//
// Действия:
//   "Заблокировать/Разблокировать" → toggleUserBlockAction()
//   "Просмотреть" → /admin/users/[id]
//
// Таб "Жалобы":
//   Таблица: От кого | На что | Причина | Дата | Статус | Действия
//   Действия: "Решено" / "Отклонить" → resolveComplaintAction()
```

### `app/(dashboard)/admin/settings/page.tsx`

```typescript
// Server Component
// requireRole('ADMIN')
// Загрузить settings = getPlatformSettings()
// Передать в AdminSettingsClient

// AdminSettingsClient ('use client'):
// Форма с полями:
//   Комиссия платформы: number input (%) — влияет на расчёт в конструкторе
//   Мин. сумма вывода: number input (₽)
//   Мин. вознаграждение: number input (₽)
//   Режим обслуживания: toggle — показывает баннер на сайте
//   Email администратора: text input
//
// Кнопка "Сохранить" → savePlatformSettingsAction()
// Toast при успехе
```

### `app/(dashboard)/admin/page.tsx` — обзор (обновить)

```typescript
// Server Component
// StatCards: На модерации | Новых за неделю | Оборот за месяц | Жалоб
//
// График регистраций:
//   recharts LineChart
//   Данные: регистрации за последние 30 дней по дням
//   prisma.user.groupBy({ by: ['createdAt'] }) или raw query
//
// Лента последних событий:
//   Последние 10 записей из Notification (все пользователи)
//   Каждая строка: иконка типа | текст | время
//
// Быстрые ссылки:
//   "На модерацию (N)" / "Заявки на вывод (N)" / "Жалобы (N)"
//   N — реальные счётчики из БД
```

---

## 🐳 ШАГ 11 — Docker конфигурация

### `Dockerfile`

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

### `next.config.js` — добавить:

```javascript
output: 'standalone',
```

### `docker-compose.yml` (на VPS)

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
      - "127.0.0.1:5432:5432"  # только localhost

volumes:
  postgres_data:
```

### Nginx конфиг (на VPS `/etc/nginx/sites-available/opinflow`)

```nginx
server {
    listen 80;
    server_name DOMAIN www.DOMAIN;

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
        client_max_body_size 50M;
    }
}
```

### `deploy.sh` (на VPS)

```bash
#!/bin/bash
set -e

cd /opt/opinflow
git pull origin main

# Читаем NEXT_PUBLIC переменные из .env.production
export $(grep -E '^NEXT_PUBLIC_' .env.production | xargs)

docker build \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY="$NEXT_PUBLIC_VAPID_PUBLIC_KEY" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -t opinflow:latest .

docker run --rm --env-file .env.production opinflow:latest \
  sh -c "npx prisma db push"

docker-compose down
docker-compose up -d

echo "✅ Деплой завершён"
```

```bash
chmod +x deploy.sh
```

---

## ❌ ЗАПРЕЩЕНО

- Не await Push отправку в основном потоке — только `.catch(console.error)` в фоне
- Не удалять push подписку при любой ошибке — только при 410/404
- Не хранить VAPID_PRIVATE_KEY в NEXT_PUBLIC_ переменных
- Порт PostgreSQL 5432 не открывать наружу — только 127.0.0.1
- Не забыть `output: 'standalone'` в next.config.js — без него Docker не соберётся

---

## ✅ ПОРЯДОК ВЫПОЛНЕНИЯ — СТРОГО ОДИН ФАЙЛ ЗА РАЗ

**Блок 0 — База:**
1. Расширить `prisma/schema.prisma` → `npx prisma db push`
2. Сгенерировать VAPID ключи → добавить в `.env`

**Блок 1 — Email:**
3. Расширить `lib/email.ts` новыми шаблонами

**Блок 2 — Push:**
4. `lib/push.ts`
5. `public/sw.js`
6. `hooks/usePushNotifications.ts`
7. `app/api/push/subscribe/route.ts`

**Блок 3 — Уведомления:**
8. `app/api/notifications/route.ts`
9. `lib/notifications.ts`
10. Обновить `actions/surveys.ts` — добавить notify()
11. Обновить `actions/payments.ts` — добавить notify()
12. Обновить `app/api/payments/webhook/route.ts` — добавить notify()

**Блок 4 — UI уведомлений:**
13. `components/dashboard/PushNotificationButton.tsx`
14. `components/dashboard/NotificationBell.tsx`
15. Обновить `components/dashboard/TopBar.tsx`
16. Обновить `app/layout.tsx` — регистрация Service Worker

**Блок 5 — Админ-панель:**
17. `actions/admin.ts`
18. Обновить `app/(dashboard)/admin/page.tsx`
19. Обновить `app/(dashboard)/admin/users/page.tsx`
20. `app/(dashboard)/admin/settings/page.tsx`

**Блок 6 — Docker:**
21. `Dockerfile`
22. Обновить `next.config.js` — добавить `output: 'standalone'`
23. `docker-compose.yml`
24. `deploy.sh`

**После каждого файла — стоп. Жди подтверждения.**
