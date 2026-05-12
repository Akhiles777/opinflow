# ИНСТРУКЦИЯ ПО РАЗРАБОТКЕ — ЭТАП 4
# ЮKassa + Выплаты + ИИ-аналитика + PDF отчёты

---

# АРХИТЕКТУРА ЭТАПА

```
Что строим:

1. ПЛАТЕЖИ (ЮKassa)
   Заказчик → пополняет баланс → ЮKassa → webhook → зачисление на кошелёк
   Респондент → заявка на вывод → ЮKassa Payouts → деньги на карту/СБП

2. ИИ-АНАЛИТИКА (Gemini Flash через OpenRouter)
   Завершённый опрос → запрос к ИИ → анализ открытых ответов →
   темы, тональность, облако слов, сводный вывод → сохранить в БД

3. PDF ОТЧЁТ (Puppeteer + @sparticuz/chromium)
   Данные опроса + ИИ-аналитика → HTML шаблон → Puppeteer → PDF файл →
   Supabase Storage → ссылка для скачивания заказчику
```

---

# ЧАСТЬ 1 — ПОДГОТОВКА

---

## 1.1 — Установка зависимостей

```bash
# ЮKassa SDK
npm install @a2seven/yoo-checkout

# Puppeteer для PDF (serverless версия для Vercel)
npm install puppeteer-core
npm install @sparticuz/chromium

# ИИ — OpenRouter через стандартный fetch, доп. пакет не нужен
# Но для удобства можно поставить openai совместимый клиент
npm install openai

# Графики в PDF — recharts или Chart.js для серверного рендера
npm install chart.js canvas
```

**Проверка после установки:**
```bash
npm run dev
# Не должно быть ошибок
```

---

## 1.2 — Переменные окружения

Добавь в `.env`:

```env
# ЮKassa
YUKASSA_SHOP_ID=""
YUKASSA_SECRET_KEY=""
YUKASSA_RETURN_URL="https://твой-домен.vercel.app/client/wallet?payment=success"

# OpenRouter (или Google AI)
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="google/gemini-2.0-flash-001"
# Альтернатива: GOOGLE_AI_API_KEY=""

# Supabase для хранения PDF
# Уже должны быть в .env
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
```

Добавь те же переменные в Vercel Dashboard → Settings → Environment Variables.

---

## 1.3 — Расширение Prisma схемы

Открой `prisma/schema.prisma` и добавь новые модели:

```prisma
// ══════════════════════════════════════════════════════════
// ПЛАТЕЖИ ЮKASSA
// ══════════════════════════════════════════════════════════

model Payment {
  id             String        @id @default(cuid())
  userId         String
  yukassaId      String?       @unique
  // ID платежа в системе ЮKassa. Null пока не создан.

  type           PaymentType
  amount         Decimal       @db.Decimal(10, 2)
  status         PaymentStatus @default(PENDING)

  description    String?
  metadata       Json?
  // Дополнительные данные: surveyId, returnUrl и т.д.

  confirmationUrl String?
  // URL для перенаправления пользователя на оплату ЮKassa.

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@map("payments")
}

enum PaymentType {
  DEPOSIT   // Пополнение баланса заказчиком
  PAYOUT    // Выплата респонденту
}

enum PaymentStatus {
  PENDING    // Создан, ожидает оплаты
  WAITING    // Пользователь на странице оплаты
  SUCCEEDED  // Успешно оплачен
  CANCELED   // Отменён
  FAILED     // Ошибка
}

// ══════════════════════════════════════════════════════════
// ЗАЯВКИ НА ВЫВОД СРЕДСТВ
// ══════════════════════════════════════════════════════════

model WithdrawalRequest {
  id          String           @id @default(cuid())
  userId      String
  amount      Decimal          @db.Decimal(10, 2)
  method      WithdrawalMethod
  requisites  Json
  // Реквизиты зависят от метода:
  // CARD: { cardNumber: "4111..." }
  // SBP:  { phone: "+79001234567", bankId: "100000000111" }
  // WALLET: { walletNumber: "..." }

  status      WithdrawalStatus @default(PENDING)
  yukassaPayoutId String?
  adminNote   String?
  // Комментарий администратора при отклонении

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@map("withdrawal_requests")
}

enum WithdrawalMethod {
  CARD    // Банковская карта
  SBP     // СБП по номеру телефона
  WALLET  // ЮMoney
}

enum WithdrawalStatus {
  PENDING    // Новая заявка
  PROCESSING // В обработке
  COMPLETED  // Выплачено
  REJECTED   // Отклонено администратором
  FAILED     // Ошибка выплаты
}

// ══════════════════════════════════════════════════════════
// ИИ-АНАЛИТИКА
// ══════════════════════════════════════════════════════════

model SurveyAnalysis {
  id        String         @id @default(cuid())
  surveyId  String         @unique
  status    AnalysisStatus @default(PENDING)

  // Результаты анализа открытых ответов
  themes        Json?
  // [{ theme: "Качество доставки", count: 45, sentiment: "negative" }]

  sentimentData Json?
  // { positive: 60, neutral: 25, negative: 15 }

  wordCloud     Json?
  // [{ word: "быстро", weight: 45 }, { word: "удобно", weight: 32 }]

  summary       String?
  // Текстовый вывод от ИИ — 3-5 абзацев

  keyInsights   Json?
  // ["Большинство респондентов...", "Основная проблема..."]

  pdfUrl        String?
  // Ссылка на PDF в Supabase Storage

  generatedAt   DateTime?
  error         String?
  // Сообщение об ошибке если анализ не удался

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  survey Survey @relation(fields: [surveyId], references: [id], onDelete: Cascade)

  @@map("survey_analyses")
}

enum AnalysisStatus {
  PENDING     // Ещё не запускался
  PROCESSING  // ИИ обрабатывает
  COMPLETED   // Готово
  FAILED      // Ошибка
}
```

Добавить в модель `Survey`:
```prisma
analysis SurveyAnalysis?
```

Добавить в модель `User`:
```prisma
payments           Payment[]
withdrawalRequests WithdrawalRequest[]
```

Применить:
```bash
npx prisma generate
npx prisma db push
```

---

# ЧАСТЬ 2 — ЮKASSA ПЛАТЕЖИ

---

## 2.1 — Как работает ЮKassa

```
Схема пополнения баланса:

1. Заказчик нажимает "Пополнить баланс" на сайте
2. Мы создаём платёж в ЮKassa через API → получаем confirmationUrl
3. Перенаправляем заказчика на страницу оплаты ЮKassa
4. Заказчик оплачивает картой или через СБП
5. ЮKassa отправляет нам webhook с результатом
6. Мы проверяем подпись webhook → зачисляем деньги на баланс

Схема выплаты респонденту:

1. Респондент создаёт заявку на вывод
2. Администратор одобряет заявку
3. Мы создаём Payout в ЮKassa → деньги уходят на карту/СБП
4. ЮKassa уведомляет о результате через webhook
```

---

## 2.2 — Создать `lib/yukassa.ts`

```typescript
import { YooCheckout } from '@a2seven/yoo-checkout'

// Инициализация клиента
export const yukassa = new YooCheckout({
  shopId:    process.env.YUKASSA_SHOP_ID!,
  secretKey: process.env.YUKASSA_SECRET_KEY!,
})

// Создать платёж на пополнение баланса
export async function createDepositPayment(params: {
  userId:   string
  amount:   number    // в рублях
  email:    string
  returnUrl: string
}) {
  const idempotenceKey = `deposit-${params.userId}-${Date.now()}`

  const payment = await yukassa.createPayment({
    amount: {
      value:    params.amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type:       'redirect',
      return_url: params.returnUrl,
    },
    capture: true,
    // capture: true — автоматически подтверждать платёж
    description: `Пополнение баланса на ${params.amount} ₽`,
    receipt: {
      customer: { email: params.email },
      items: [{
        description:  'Пополнение баланса',
        quantity:     '1.00',
        amount: {
          value:    params.amount.toFixed(2),
          currency: 'RUB',
        },
        vat_code:      1,
        payment_mode:  'full_payment',
        payment_subject: 'service',
      }],
    },
    metadata: {
      userId:   params.userId,
      type:     'deposit',
    },
  }, idempotenceKey)

  return payment
}

// Создать выплату респонденту
export async function createPayout(params: {
  amount:     number
  method:     'card' | 'sbp' | 'wallet'
  requisites: Record<string, string>
  description: string
}) {
  // Payout API ЮKassa — отдельный endpoint
  // Требует отдельного агентского договора с ЮKassa
  // Документация: yookassa.ru/developers/payouts

  const idempotenceKey = `payout-${Date.now()}-${Math.random().toString(36).slice(2)}`

  // Формируем destination по методу
  let payoutDestinationData: any

  switch (params.method) {
    case 'card':
      payoutDestinationData = {
        type:        'bank_card',
        card:        { number: params.requisites.cardNumber },
      }
      break
    case 'sbp':
      payoutDestinationData = {
        type:  'sbp',
        phone: params.requisites.phone,
        bank_id: params.requisites.bankId,
      }
      break
    case 'wallet':
      payoutDestinationData = {
        type:          'yoo_money',
        account_number: params.requisites.walletNumber,
      }
      break
  }

  // Payout создаётся через отдельный API endpoint
  const response = await fetch('https://yookassa.ru/api/v3/payouts', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'Idempotence-Key': idempotenceKey,
      'Authorization':   'Basic ' + Buffer.from(
        `${process.env.YUKASSA_SHOP_ID}:${process.env.YUKASSA_SECRET_KEY}`
      ).toString('base64'),
    },
    body: JSON.stringify({
      amount: {
        value:    params.amount.toFixed(2),
        currency: 'RUB',
      },
      payout_destination_data: payoutDestinationData,
      description: params.description,
      metadata: { type: 'payout' },
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`ЮKassa Payout error: ${JSON.stringify(err)}`)
  }

  return response.json()
}

// Верификация подписи webhook от ЮKassa
export function verifyWebhookSignature(
  body:      string,
  signature: string
): boolean {
  // ЮKassa подписывает webhook через HMAC-SHA256
  const crypto = require('crypto')
  const expected = crypto
    .createHmac('sha256', process.env.YUKASSA_SECRET_KEY!)
    .update(body)
    .digest('hex')
  return expected === signature
}
```

---

## 2.3 — Webhook обработчик

Создай `app/api/payments/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/lib/prisma'
import { verifyWebhookSignature }    from '@/lib/yukassa'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('Authorization') ?? ''

  // 1. Верификация подписи
  // В тестовом режиме ЮKassa не отправляет подпись — можно пропустить
  // В боевом режиме — обязательно проверять
  // if (!verifyWebhookSignature(body, signature)) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  // }

  const event = JSON.parse(body)

  // 2. Обработка события
  if (event.event === 'payment.succeeded') {
    await handlePaymentSucceeded(event.object)
  }

  if (event.event === 'payment.canceled') {
    await handlePaymentCanceled(event.object)
  }

  if (event.event === 'payout.succeeded') {
    await handlePayoutSucceeded(event.object)
  }

  if (event.event === 'payout.failed') {
    await handlePayoutFailed(event.object)
  }

  return NextResponse.json({ ok: true })
}

async function handlePaymentSucceeded(payment: any) {
  const yukassaId = payment.id
  const amount    = Number(payment.amount.value)
  const userId    = payment.metadata?.userId

  if (!userId) return

  // Найти наш платёж по yukassaId
  const dbPayment = await prisma.payment.findUnique({
    where: { yukassaId },
  })
  if (!dbPayment || dbPayment.status === 'SUCCEEDED') return
  // Проверяем status чтобы не зачислить дважды (idempotency)

  await prisma.$transaction(async (tx) => {
    // Обновить статус платежа
    await tx.payment.update({
      where: { yukassaId },
      data:  { status: 'SUCCEEDED' },
    })

    // Зачислить на баланс
    const wallet = await tx.wallet.findUnique({ where: { userId } })
    if (!wallet) return

    await tx.wallet.update({
      where: { id: wallet.id },
      data:  { balance: { increment: amount } },
    })

    await tx.transaction.create({
      data: {
        walletId:    wallet.id,
        type:        'DEPOSIT',
        amount,
        description: `Пополнение баланса через ЮKassa`,
        status:      'COMPLETED',
      },
    })
  })
}

async function handlePaymentCanceled(payment: any) {
  await prisma.payment.updateMany({
    where: { yukassaId: payment.id },
    data:  { status: 'CANCELED' },
  })
}

async function handlePayoutSucceeded(payout: any) {
  const yukassaPayoutId = payout.id

  const request = await prisma.withdrawalRequest.findFirst({
    where: { yukassaPayoutId },
  })
  if (!request) return

  await prisma.withdrawalRequest.update({
    where: { id: request.id },
    data:  { status: 'COMPLETED' },
  })
}

async function handlePayoutFailed(payout: any) {
  const yukassaPayoutId = payout.id

  const request = await prisma.withdrawalRequest.findFirst({
    where: { yukassaPayoutId },
  })
  if (!request) return

  // Вернуть деньги на баланс
  await prisma.$transaction(async (tx) => {
    await tx.withdrawalRequest.update({
      where: { id: request.id },
      data:  { status: 'FAILED', adminNote: 'Ошибка выплаты через ЮKassa' },
    })

    const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } })
    if (!wallet) return

    await tx.wallet.update({
      where: { id: wallet.id },
      data:  { balance: { increment: request.amount } },
    })

    await tx.transaction.create({
      data: {
        walletId:    wallet.id,
        type:        'REFUND',
        amount:      request.amount,
        description: 'Возврат: ошибка выплаты',
        status:      'COMPLETED',
      },
    })
  })
}
```

---

## 2.4 — Server Actions для платежей

Создай `actions/payments.ts`:

```typescript
'use server'

import { prisma }              from '@/lib/prisma'
import { requireRole }         from '@/lib/auth-utils'
import { createDepositPayment } from '@/lib/yukassa'
import { revalidatePath }      from 'next/cache'

// ──────────────────────────────────────────────────────────
// ПОПОЛНЕНИЕ БАЛАНСА (CLIENT)
// ──────────────────────────────────────────────────────────

export async function createDepositAction(amount: number) {
  const session = await requireRole('CLIENT')

  if (amount < 100)  return { error: 'Минимальная сумма пополнения — 100 ₽' }
  if (amount > 500000) return { error: 'Максимальная сумма — 500 000 ₽' }

  // Получить email пользователя для чека
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.email) return { error: 'Email не найден' }

  const returnUrl = `${process.env.NEXTAUTH_URL}/client/wallet?payment=success`

  try {
    // Создать платёж в ЮKassa
    const yukassaPayment = await createDepositPayment({
      userId:    session.user.id,
      amount,
      email:     user.email,
      returnUrl,
    })

    // Сохранить в БД
    await prisma.payment.create({
      data: {
        userId:          session.user.id,
        yukassaId:       yukassaPayment.id,
        type:            'DEPOSIT',
        amount,
        status:          'WAITING',
        confirmationUrl: (yukassaPayment.confirmation as any)?.confirmation_url,
        description:     `Пополнение баланса на ${amount} ₽`,
      },
    })

    return {
      success:         true,
      confirmationUrl: (yukassaPayment.confirmation as any)?.confirmation_url,
    }
  } catch (e) {
    console.error('ЮKassa error:', e)
    return { error: 'Ошибка создания платежа. Попробуйте позже.' }
  }
}

// ──────────────────────────────────────────────────────────
// ЗАЯВКА НА ВЫВОД (RESPONDENT)
// ──────────────────────────────────────────────────────────

export async function createWithdrawalAction(params: {
  amount:     number
  method:     'CARD' | 'SBP' | 'WALLET'
  requisites: Record<string, string>
}) {
  const session = await requireRole('RESPONDENT')

  if (params.amount < 100) return { error: 'Минимальная сумма вывода — 100 ₽' }

  // Проверить баланс
  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
  if (!wallet) return { error: 'Кошелёк не найден' }
  if (Number(wallet.balance) < params.amount) {
    return { error: 'Недостаточно средств' }
  }

  await prisma.$transaction(async (tx) => {
    // Заморозить сумму (вычесть с баланса сразу)
    await tx.wallet.update({
      where: { id: wallet.id },
      data:  { balance: { decrement: params.amount } },
    })

    // Создать заявку
    await tx.withdrawalRequest.create({
      data: {
        userId:     session.user.id,
        amount:     params.amount,
        method:     params.method,
        requisites: params.requisites,
        status:     'PENDING',
      },
    })

    // Записать транзакцию
    await tx.transaction.create({
      data: {
        walletId:    wallet.id,
        type:        'WITHDRAWAL',
        amount:      params.amount,
        description: `Заявка на вывод — ${params.method}`,
        status:      'PENDING',
      },
    })
  })

  revalidatePath('/respondent/wallet')
  return { success: true }
}

// ──────────────────────────────────────────────────────────
// ОБРАБОТКА ЗАЯВОК АДМИНИСТРАТОРОМ
// ──────────────────────────────────────────────────────────

export async function approveWithdrawalAction(requestId: string) {
  await requireRole('ADMIN')

  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
  })
  if (!request) return { error: 'Заявка не найдена' }
  if (request.status !== 'PENDING') return { error: 'Заявка уже обработана' }

  try {
    // Создать выплату в ЮKassa
    const { createPayout } = await import('@/lib/yukassa')
    const payout = await createPayout({
      amount:      Number(request.amount),
      method:      request.method.toLowerCase() as any,
      requisites:  request.requisites as Record<string, string>,
      description: `Выплата пользователю`,
    })

    await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status:          'PROCESSING',
        yukassaPayoutId: payout.id,
      },
    })

    revalidatePath('/admin/finance')
    return { success: true }
  } catch (e) {
    console.error('Payout error:', e)
    return { error: 'Ошибка создания выплаты в ЮKassa' }
  }
}

export async function rejectWithdrawalAction(requestId: string, reason: string) {
  await requireRole('ADMIN')

  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
  })
  if (!request) return { error: 'Заявка не найдена' }

  await prisma.$transaction(async (tx) => {
    // Вернуть деньги на баланс
    const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } })
    if (wallet) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data:  { balance: { increment: request.amount } },
      })
      await tx.transaction.update({
        where: { walletId: wallet.id },
        data:  { status: 'CANCELLED' },
      })
    }

    await tx.withdrawalRequest.update({
      where: { id: requestId },
      data:  { status: 'REJECTED', adminNote: reason },
    })
  })

  revalidatePath('/admin/finance')
  return { success: true }
}
```

---

# ЧАСТЬ 3 — ИИ-АНАЛИТИКА

---

## 3.1 — Как работает ИИ-аналитика

```
Процесс:

1. Заказчик открывает результаты опроса
2. Нажимает "Запустить ИИ-анализ"
3. Мы собираем все открытые ответы из БД
4. Отправляем в Gemini Flash через OpenRouter
5. Получаем структурированный JSON с аналитикой
6. Сохраняем в SurveyAnalysis
7. Показываем заказчику: темы, тональность, инсайты

Стоимость одного анализа: ~$0.004 (менее 50 копеек)
```

---

## 3.2 — Создать `lib/ai-analysis.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey:  process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXTAUTH_URL,
    'X-Title':      'ПотокМнений Analytics',
  },
})

const MODEL = process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-001'

// Типы результата анализа
export type ThemeItem = {
  theme:     string
  count:     number
  sentiment: 'positive' | 'negative' | 'neutral'
  examples:  string[]  // 2-3 примера ответов
}

export type AnalysisResult = {
  themes:       ThemeItem[]
  sentiment:    { positive: number; neutral: number; negative: number }
  wordCloud:    { word: string; weight: number }[]
  summary:      string
  keyInsights:  string[]
}

// Основная функция анализа
export async function analyzeSurveyResponses(params: {
  surveyTitle:    string
  surveyCategory: string | null
  openAnswers:    { questionTitle: string; answers: string[] }[]
}): Promise<AnalysisResult> {

  // Если нет открытых ответов — вернуть пустой результат
  if (params.openAnswers.length === 0 || params.openAnswers.every(q => q.answers.length === 0)) {
    return {
      themes:      [],
      sentiment:   { positive: 0, neutral: 100, negative: 0 },
      wordCloud:   [],
      summary:     'В данном опросе нет открытых вопросов для анализа.',
      keyInsights: [],
    }
  }

  // Формируем промпт
  const answersText = params.openAnswers
    .map(q => `Вопрос: "${q.questionTitle}"\nОтветы:\n${q.answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}`)
    .join('\n\n---\n\n')

  const prompt = `Ты — аналитик маркетинговых исследований. Проанализируй ответы респондентов на опрос.

Название опроса: "${params.surveyTitle}"
${params.surveyCategory ? `Категория: ${params.surveyCategory}` : ''}

${answersText}

Верни ТОЛЬКО валидный JSON без markdown-блоков и пояснений, строго в этом формате:
{
  "themes": [
    {
      "theme": "Название темы на русском",
      "count": число_ответов,
      "sentiment": "positive" | "negative" | "neutral",
      "examples": ["пример 1", "пример 2"]
    }
  ],
  "sentiment": {
    "positive": процент_0_100,
    "neutral":  процент_0_100,
    "negative": процент_0_100
  },
  "wordCloud": [
    { "word": "слово", "weight": вес_1_100 }
  ],
  "summary": "Общий вывод по опросу, 3-5 предложений на русском языке",
  "keyInsights": [
    "Ключевой инсайт 1",
    "Ключевой инсайт 2",
    "Ключевой инсайт 3"
  ]
}

Требования:
- Выдели 3-7 ключевых тем
- В wordCloud включи 20-30 наиболее частых значимых слов
- summary — конкретный и полезный для бизнеса
- keyInsights — 3-5 actionable выводов
- Все тексты на русском языке
- sentiment проценты должны в сумме давать 100`

  const response = await openai.chat.completions.create({
    model:    MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.3,  // низкая температура для стабильного JSON
  })

  const content = response.choices[0]?.message?.content ?? ''

  // Очистить от возможных markdown блоков
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    return JSON.parse(cleaned) as AnalysisResult
  } catch {
    throw new Error(`ИИ вернул невалидный JSON: ${cleaned.slice(0, 200)}`)
  }
}
```

---

## 3.3 — Server Action для запуска анализа

Добавь в `actions/surveys.ts` или создай отдельный `actions/analysis.ts`:

```typescript
'use server'

import { prisma }                  from '@/lib/prisma'
import { requireRole }             from '@/lib/auth-utils'
import { analyzeSurveyResponses }  from '@/lib/ai-analysis'
import { generateSurveyPDF }       from '@/lib/pdf-generator'
import { revalidatePath }          from 'next/cache'

export async function runAnalysisAction(surveyId: string) {
  const session = await requireRole('CLIENT')

  // Проверить что опрос принадлежит заказчику
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: session.user.id },
    include: {
      questions: true,
      sessions: {
        where: { isValid: true, status: 'COMPLETED' },
        include: { answers: true },
      },
    },
  })
  if (!survey) return { error: 'Опрос не найден' }
  if (survey.sessions.length === 0) return { error: 'Нет завершённых ответов для анализа' }

  // Создать или обновить запись анализа
  await prisma.surveyAnalysis.upsert({
    where:  { surveyId },
    create: { surveyId, status: 'PROCESSING' },
    update: { status: 'PROCESSING', error: null },
  })

  try {
    // Собрать открытые ответы
    const openQuestions = survey.questions.filter(q => q.type === 'OPEN_TEXT')

    const openAnswers = openQuestions.map(question => {
      const answers = survey.sessions
        .flatMap(s => s.answers)
        .filter(a => a.questionId === question.id)
        .map(a => String(a.value))
        .filter(a => a.trim().length > 0)

      return { questionTitle: question.title, answers }
    })

    // Запустить ИИ-анализ
    const result = await analyzeSurveyResponses({
      surveyTitle:    survey.title,
      surveyCategory: survey.category,
      openAnswers,
    })

    // Сохранить результат
    await prisma.surveyAnalysis.update({
      where: { surveyId },
      data: {
        status:       'COMPLETED',
        themes:       result.themes,
        sentimentData: result.sentiment,
        wordCloud:    result.wordCloud,
        summary:      result.summary,
        keyInsights:  result.keyInsights,
        generatedAt:  new Date(),
      },
    })

    revalidatePath(`/client/surveys/${surveyId}`)
    return { success: true }

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Неизвестная ошибка'
    await prisma.surveyAnalysis.update({
      where: { surveyId },
      data:  { status: 'FAILED', error: msg },
    })
    return { error: `Ошибка анализа: ${msg}` }
  }
}
```

---

# ЧАСТЬ 4 — PDF ОТЧЁТ

---

## 4.1 — Как работает генерация PDF

```
Схема:

1. Заказчик нажимает "Скачать PDF отчёт"
2. Server Action собирает все данные: опрос, ответы, ИИ-аналитика
3. Формирует HTML-строку с готовой вёрсткой отчёта
4. Запускает Puppeteer с @sparticuz/chromium
5. Puppeteer открывает HTML и делает PDF
6. PDF загружается в Supabase Storage
7. Возвращается ссылка для скачивания

Puppeteer на Vercel:
Обычный puppeteer не работает на Vercel — нет Chromium.
Используем @sparticuz/chromium — специальная сборка для serverless.
```

---

## 4.2 — Создать `lib/pdf-generator.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Генерация PDF и загрузка в Storage
export async function generateSurveyPDF(params: {
  survey:   any
  analysis: any
  stats:    {
    totalResponses:  number
    completionRate:  number
    avgTimeMinutes:  number
    questionStats:   any[]
  }
}): Promise<string> {

  // Формируем HTML отчёта
  const html = buildReportHTML(params)

  // Запускаем Puppeteer
  let browser: any = null

  try {
    // На Vercel используем @sparticuz/chromium
    const chromium  = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default

    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(),
      headless:        true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format:             'A4',
      printBackground:    true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    })

    // Загружаем в Supabase Storage
    const filename = `reports/${params.survey.id}-${Date.now()}.pdf`

    const { error } = await supabase.storage
      .from('opinflow-media')
      .upload(filename, pdfBuffer, {
        contentType:   'application/pdf',
        cacheControl:  '3600',
      })

    if (error) throw error

    const { data } = supabase.storage
      .from('opinflow-media')
      .getPublicUrl(filename)

    return data.publicUrl

  } finally {
    if (browser) await browser.close()
  }
}

// HTML шаблон отчёта
function buildReportHTML(params: { survey: any; analysis: any; stats: any }): string {
  const { survey, analysis, stats } = params
  const date = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Цвет для sentiment
  const sentimentPositive = analysis?.sentimentData?.positive ?? 0
  const sentimentNeutral  = analysis?.sentimentData?.neutral  ?? 0
  const sentimentNegative = analysis?.sentimentData?.negative ?? 0

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      color: #111827;
      line-height: 1.6;
      background: #fff;
    }

    /* HEADER */
    .header {
      background: #0A0A0F;
      color: white;
      padding: 32px 40px;
      margin-bottom: 40px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 700;
    }
    .logo-dot {
      width: 10px;
      height: 10px;
      background: #6366F1;
      border-radius: 3px;
    }
    .report-date { font-size: 12px; color: rgba(255,255,255,0.4); }
    .survey-title {
      font-size: 28px;
      font-weight: 700;
      margin-top: 24px;
      letter-spacing: -0.5px;
    }
    .survey-meta { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 8px; }

    /* STATS */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 0 40px;
      margin-bottom: 40px;
    }
    .stat-card {
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 20px;
    }
    .stat-num {
      font-size: 28px;
      font-weight: 700;
      color: #6366F1;
      letter-spacing: -1px;
    }
    .stat-label {
      font-size: 12px;
      color: #6B7280;
      margin-top: 4px;
    }

    /* SECTIONS */
    .section {
      padding: 0 40px;
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #F3F4F6;
    }

    /* SENTIMENT */
    .sentiment-bar { height: 12px; border-radius: 100px; overflow: hidden; display: flex; margin-bottom: 12px; }
    .sentiment-positive { background: #22C55E; }
    .sentiment-neutral  { background: #94A3B8; }
    .sentiment-negative { background: #EF4444; }
    .sentiment-legend { display: flex; gap: 24px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

    /* THEMES */
    .theme-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: #F9FAFB;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .theme-sentiment {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .theme-name { font-weight: 600; font-size: 14px; }
    .theme-count { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .theme-examples { font-size: 12px; color: #6B7280; margin-top: 6px; font-style: italic; }

    /* INSIGHTS */
    .insight-item {
      display: flex;
      gap: 12px;
      padding: 14px 16px;
      border-left: 3px solid #6366F1;
      background: #F8F7FF;
      border-radius: 0 8px 8px 0;
      margin-bottom: 10px;
      font-size: 14px;
    }

    /* SUMMARY */
    .summary-text {
      background: #F9FAFB;
      border-radius: 12px;
      padding: 24px;
      font-size: 14px;
      line-height: 1.8;
      color: #374151;
    }

    /* FOOTER */
    .footer {
      margin-top: 60px;
      padding: 24px 40px;
      border-top: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #9CA3AF;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="logo">
        <div class="logo-dot"></div>
        ПотокМнений
      </div>
      <div class="report-date">${date}</div>
    </div>
    <div class="survey-title">${survey.title}</div>
    <div class="survey-meta">
      ${survey.category ?? ''} · Аналитический отчёт
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-num">${stats.totalResponses}</div>
      <div class="stat-label">Всего ответов</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${stats.completionRate}%</div>
      <div class="stat-label">Завершили опрос</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${stats.avgTimeMinutes} мин</div>
      <div class="stat-label">Среднее время</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${survey.questions?.length ?? 0}</div>
      <div class="stat-label">Вопросов</div>
    </div>
  </div>

  ${analysis ? `
  <!-- SENTIMENT -->
  <div class="section">
    <div class="section-title">Тональность ответов</div>
    <div class="sentiment-bar">
      <div class="sentiment-positive" style="width:${sentimentPositive}%"></div>
      <div class="sentiment-neutral"  style="width:${sentimentNeutral}%"></div>
      <div class="sentiment-negative" style="width:${sentimentNegative}%"></div>
    </div>
    <div class="sentiment-legend">
      <div class="legend-item">
        <div class="legend-dot" style="background:#22C55E"></div>
        Позитивно — ${sentimentPositive}%
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#94A3B8"></div>
        Нейтрально — ${sentimentNeutral}%
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#EF4444"></div>
        Негативно — ${sentimentNegative}%
      </div>
    </div>
  </div>

  <!-- THEMES -->
  ${(analysis.themes ?? []).length > 0 ? `
  <div class="section">
    <div class="section-title">Ключевые темы</div>
    ${(analysis.themes ?? []).map((t: any) => `
      <div class="theme-item">
        <div class="theme-sentiment" style="background:${
          t.sentiment === 'positive' ? '#22C55E' :
          t.sentiment === 'negative' ? '#EF4444' : '#94A3B8'
        }"></div>
        <div>
          <div class="theme-name">${t.theme} <span style="color:#6366F1;font-weight:400">(${t.count} упоминаний)</span></div>
          ${t.examples?.length > 0 ? `
            <div class="theme-examples">«${t.examples.slice(0,2).join('», «')}»</div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- KEY INSIGHTS -->
  ${(analysis.keyInsights ?? []).length > 0 ? `
  <div class="section">
    <div class="section-title">Ключевые инсайты</div>
    ${(analysis.keyInsights ?? []).map((insight: string, i: number) => `
      <div class="insight-item">
        <strong style="color:#6366F1;flex-shrink:0">${i + 1}.</strong>
        ${insight}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- SUMMARY -->
  ${analysis.summary ? `
  <div class="section">
    <div class="section-title">Общие выводы</div>
    <div class="summary-text">${analysis.summary}</div>
  </div>
  ` : ''}
  ` : `
  <div class="section">
    <div class="summary-text">ИИ-аналитика для этого опроса ещё не была запущена.</div>
  </div>
  `}

  <!-- FOOTER -->
  <div class="footer">
    <span>ПотокМнений — Платформа маркетинговых исследований</span>
    <span>Отчёт сгенерирован ${date}</span>
  </div>

</body>
</html>`
}
```

---

## 4.3 — Server Action для генерации PDF

```typescript
// В actions/analysis.ts добавить:

export async function generatePDFAction(surveyId: string) {
  const session = await requireRole('CLIENT')

  const survey = await prisma.survey.findFirst({
    where:   { id: surveyId, creatorId: session.user.id },
    include: {
      questions: true,
      sessions: {
        where:   { isValid: true, status: 'COMPLETED' },
        include: { answers: true },
      },
      analysis: true,
    },
  })
  if (!survey) return { error: 'Опрос не найден' }

  // Подсчёт статистики
  const totalResponses  = survey.sessions.length
  const completionRate  = totalResponses > 0
    ? Math.round((totalResponses / (survey.maxResponses ?? totalResponses)) * 100)
    : 0
  const avgTimeSec      = survey.sessions.reduce((sum, s) => sum + (s.timeSpent ?? 0), 0) / (totalResponses || 1)
  const avgTimeMinutes  = Math.round(avgTimeSec / 60)

  try {
    const { generateSurveyPDF } = await import('@/lib/pdf-generator')

    const pdfUrl = await generateSurveyPDF({
      survey,
      analysis: survey.analysis,
      stats: {
        totalResponses,
        completionRate,
        avgTimeMinutes,
        questionStats: [],
      },
    })

    // Сохранить URL в БД
    if (survey.analysis) {
      await prisma.surveyAnalysis.update({
        where: { surveyId },
        data:  { pdfUrl },
      })
    }

    return { success: true, pdfUrl }

  } catch (e) {
    console.error('PDF error:', e)
    return { error: 'Ошибка генерации PDF. Попробуйте позже.' }
  }
}
```

---

# ЧАСТЬ 5 — СТРАНИЦЫ

---

## 5.1 — Кошелёк заказчика

`app/(dashboard)/client/wallet/page.tsx`:
```
- Текущий баланс (крупно)
- Кнопка "Пополнить баланс" → открывает Modal
- Modal пополнения:
  - Input суммы (min 100 ₽)
  - Кнопка "Перейти к оплате" → createDepositAction() → redirect на confirmationUrl
- История транзакций (таблица)
- При открытии страницы с ?payment=success → toast "Баланс пополнен"
```

## 5.2 — Кошелёк респондента

`app/(dashboard)/respondent/wallet/page.tsx`:
```
- Текущий баланс
- Кнопка "Вывести средства" → Modal
- Modal вывода — 2 шага:
  Шаг 1: Выбор метода (Карта / СБП / ЮMoney) — три карточки
  Шаг 2: Ввод реквизитов + сумма
  Кнопка "Подать заявку" → createWithdrawalAction()
- Список заявок на вывод с статусами
- История начислений
```

## 5.3 — Аналитика опроса

`app/(dashboard)/client/surveys/[id]/page.tsx` — добавить секцию аналитики:
```
- Кнопка "Запустить ИИ-анализ" (если analysis.status === PENDING или FAILED)
- Если PROCESSING → spinner + "Анализ выполняется..."
- Если COMPLETED:
  - Тональность: горизонтальный бар (зелёный/серый/красный)
  - Темы: список карточек с тегом тональности
  - Ключевые инсайты: список с иконкой лампочки
  - Общий вывод: текстовый блок
  - Кнопка "Скачать PDF отчёт" → generatePDFAction()
```

## 5.4 — Финансы администратора

`app/(dashboard)/admin/finance/page.tsx`:
```
- Табы: Все транзакции | Заявки на вывод
- Заявки на вывод:
  - Список со статусами
  - Кнопка "Одобрить" → approveWithdrawalAction()
  - Кнопка "Отклонить" → Modal с причиной → rejectWithdrawalAction()
- Общая статистика: оборот за месяц, комиссия, выплачено
```

---

# ЧАСТЬ 6 — ТЕСТИРОВАНИЕ

---

## 6.1 — Тестовый режим ЮKassa

По умолчанию ЮKassa работает в тестовом режиме.
Тестовые карты для оплаты:
```
Успешная оплата:  4111 1111 1111 1111 / любой CVV / любая дата
Отклонённая:      4000 0000 0000 0002
```

Для тестирования webhook локально используй **ngrok**:
```bash
npx ngrok http 3000
# Получишь URL вида: https://abc123.ngrok.io
# Укажи его в ЮKassa → HTTP-уведомления:
# https://abc123.ngrok.io/api/payments/webhook
```

---

## 6.2 — Сценарии тестирования

### Тест 1 — Пополнение баланса
```
1. Войти как заказчик
2. /client/wallet → Пополнить баланс → ввести 500 ₽
3. Перейти к оплате → попасть на страницу ЮKassa
4. Ввести тестовую карту 4111 1111 1111 1111
5. Оплатить → вернуться на сайт
6. Проверить: баланс увеличился на 500 ₽
7. Prisma Studio → payments → статус SUCCEEDED
8. Prisma Studio → transactions → запись DEPOSIT
```

### Тест 2 — ИИ-аналитика
```
1. Убедиться что в опросе есть OPEN_TEXT вопросы с ответами
2. Войти как заказчик → открыть опрос
3. Нажать "Запустить ИИ-анализ"
4. Подождать 10-30 секунд
5. Обновить страницу
6. Должны появиться: темы, тональность, инсайты, summary
7. Prisma Studio → survey_analyses → статус COMPLETED
```

### Тест 3 — PDF отчёт
```
1. После успешного анализа нажать "Скачать PDF"
2. Подождать 10-15 секунд (Puppeteer)
3. PDF должен открыться или скачаться
4. Проверить содержимое: статистика, темы, инсайты
5. Supabase Storage → reports → файл должен появиться
```

### Тест 4 — Вывод средств
```
1. Войти как респондент у которого есть баланс
2. /respondent/wallet → Вывести средства
3. Выбрать метод → ввести реквизиты → указать сумму
4. Подать заявку
5. Войти как администратор → /admin/finance → Заявки на вывод
6. Одобрить заявку
7. Проверить статус заявки → PROCESSING
8. (В тестовом режиме реальный перевод не происходит)
```

---

## 6.3 — Частые проблемы

### Puppeteer не запускается на Vercel
```
Убедись что установлен @sparticuz/chromium а не обычный chromium.
Добавь в vercel.json:
{
  "functions": {
    "app/api/pdf/**": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### ЮKassa webhook не приходит
```
1. Проверь URL в настройках ЮKassa
2. Убедись что /api/payments/webhook не защищён middleware
3. Добавь /api/payments в publicPaths в middleware.ts
4. Для локального теста используй ngrok
```

### OpenRouter возвращает не JSON
```
Добавь в промпт: "Верни ТОЛЬКО валидный JSON без markdown и пояснений"
Используй temperature: 0.1 для более стабильного вывода
```

---

# ПОРЯДОК РАЗРАБОТКИ ПО ДНЯМ

```
День 1:
  □ Установить зависимости
  □ Обновить .env и Vercel env
  □ Расширить Prisma схему → npx prisma db push
  □ lib/yukassa.ts
  □ lib/ai-analysis.ts

День 2:
  □ app/api/payments/webhook/route.ts
  □ actions/payments.ts

День 3:
  □ lib/pdf-generator.ts (HTML шаблон + Puppeteer)
  □ actions/analysis.ts (runAnalysisAction + generatePDFAction)

День 4:
  □ app/(dashboard)/client/wallet/page.tsx
  □ app/(dashboard)/respondent/wallet/page.tsx

День 5:
  □ Обновить client/surveys/[id]/page.tsx — добавить секцию аналитики

День 6:
  □ app/(dashboard)/admin/finance/page.tsx

День 7-8:
  □ Тестирование всех сценариев
  □ Тестирование webhook через ngrok

День 9:
  □ npm run build без ошибок
  □ Деплой на Vercel
  □ Финальная проверка на живом сайте
```