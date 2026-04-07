# ИНСТРУКЦИЯ ПО РАЗРАБОТКЕ — ЭТАП 3
# Вариант 2: Лента в кабинете + Прохождение на весь экран

---

# АРХИТЕКТУРА РОУТИНГА

Прежде чем начать — важно понять как устроены роуты.

```
app/
  (dashboard)/              ← layout с сайдбаром и topbar
    respondent/
      page.tsx              ← обзор (дашборд)
      surveys/
        page.tsx            ← лента опросов (с сайдбаром)
      wallet/page.tsx
      profile/page.tsx
      referral/page.tsx

  (survey)/                 ← НОВЫЙ layout — без сайдбара, на весь экран
    survey/
      [id]/
        page.tsx            ← прохождение опроса
        complete/page.tsx   ← экран завершения
```

**Ключевое решение:** прохождение опроса живёт в отдельной группе роутов `(survey)` с собственным layout — чистая страница без сайдбара, без topbar, только контент.

---

# ЧАСТЬ 1 — ПОДГОТОВКА ПРОЕКТА

---

## 1.1 — Проверка текущего состояния

```bash
cd opinflow
npm install
npm run dev
```

Открой `http://localhost:3000`. Убедись:
- Главная страница работает
- Авторизация работает
- Кабинеты всех трёх ролей открываются

Если что-то сломано — чини сначала это.

---

## 1.2 — Установка зависимостей

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install date-fns
npm install uuid
npm install @types/uuid -D
```

**Что это:**
- `@dnd-kit/*` — drag-and-drop для конструктора вопросов
- `date-fns` — работа с датами начала/окончания опроса
- `uuid` — временные ID вопросов в конструкторе до сохранения в БД

---

## 1.3 — Настройка Supabase Storage

Медиафайлы к вопросам хранятся в Supabase Storage.

**Создать bucket:**
1. supabase.com → твой проект → Storage → New bucket
2. Name: `opinflow-media`
3. Public bucket: ✅
4. Create bucket

**Политики доступа:**
Storage → Policies → `opinflow-media` → New policy → For full customization

```sql
-- Чтение для всех
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'opinflow-media');

-- Загрузка для авторизованных
CREATE POLICY "Auth upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'opinflow-media');
```

**Создай `lib/storage.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'opinflow-media'

export async function uploadQuestionMedia(file: File): Promise<string> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    throw new Error('Разрешены только изображения: JPEG, PNG, WebP, GIF')
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Максимальный размер файла — 10MB')
  }

  const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { contentType: file.type, cacheControl: '3600' })

  if (error) throw new Error(`Ошибка загрузки: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

export async function deleteMedia(publicUrl: string): Promise<void> {
  const parts = publicUrl.split(`/${BUCKET}/`)
  if (parts.length < 2) return
  await supabase.storage.from(BUCKET).remove([parts[1]])
}
```

---

## 1.4 — Расширение Prisma схемы

Открой `prisma/schema.prisma`.

### А — Обновить модель Survey

Найди существующую модель `Survey` и добавь поля:

```prisma
model Survey {
  id          String       @id @default(cuid())
  creatorId   String
  title       String
  description String?
  category    String?
  status      SurveyStatus @default(DRAFT)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  // ─── НОВЫЕ ПОЛЯ ──────────────────────────────────────
  maxResponses    Int?
  reward          Decimal?    @db.Decimal(10, 2)
  estimatedTime   Int?
  budget          Decimal?    @db.Decimal(10, 2)
  targetGender    String?     // "any" | "male" | "female"
  targetAgeMin    Int?
  targetAgeMax    Int?
  targetCities    String[]
  targetIncomes   String[]
  targetInterests String[]
  startsAt        DateTime?
  endsAt          DateTime?
  moderationNote  String?
  // ─────────────────────────────────────────────────────

  creator    User             @relation("SurveyCreator", fields: [creatorId], references: [id])
  responses  SurveyResponse[]
  questions  SurveyQuestion[]
  sessions   SurveySession[]
  complaints Complaint[]

  @@map("surveys")
}
```

### Б — Добавить новые модели в конец файла

```prisma
// ══════════════════════════════════════════════════════════
// ВОПРОСЫ
// ══════════════════════════════════════════════════════════

model SurveyQuestion {
  id          String       @id @default(cuid())
  surveyId    String
  order       Int
  type        QuestionType
  title       String
  description String?
  required    Boolean      @default(true)
  mediaUrl    String?

  options     Json?
  // SINGLE_CHOICE / MULTIPLE_CHOICE / RANKING: ["Вариант 1", "Вариант 2"]
  // MATRIX: { rows: ["Строка 1"], cols: ["Столбец 1"] }
  // SCALE / OPEN_TEXT: null

  settings    Json?
  // SCALE: { min: 1, max: 10, minLabel: "Плохо", maxLabel: "Отлично" }
  // OPEN_TEXT: { maxLength: 500, placeholder: "Введите ответ..." }

  logic       Json?
  // [{ ifQuestionId, operator: "equals"|"not_equals"|"contains", value, action: "show"|"hide" }]

  createdAt   DateTime     @default(now())

  survey  Survey         @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  answers SurveyAnswer[]

  @@map("survey_questions")
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  SCALE
  MATRIX
  RANKING
  OPEN_TEXT
}

// ══════════════════════════════════════════════════════════
// СЕССИИ ПРОХОЖДЕНИЯ
// ══════════════════════════════════════════════════════════

model SurveySession {
  id          String        @id @default(cuid())
  surveyId    String
  userId      String
  status      SessionStatus @default(IN_PROGRESS)
  startedAt   DateTime      @default(now())
  completedAt DateTime?
  timeSpent   Int?
  ipAddress   String?
  userAgent   String?
  deviceId    String?
  isValid     Boolean       @default(true)
  fraudFlags  String[]

  survey  Survey         @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers SurveyAnswer[]

  @@unique([surveyId, userId])
  @@map("survey_sessions")
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
  REJECTED
}

// ══════════════════════════════════════════════════════════
// ОТВЕТЫ
// ══════════════════════════════════════════════════════════

model SurveyAnswer {
  id         String   @id @default(cuid())
  sessionId  String
  questionId String
  value      Json
  createdAt  DateTime @default(now())

  session  SurveySession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question SurveyQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, questionId])
  @@map("survey_answers")
}

// ══════════════════════════════════════════════════════════
// ЖАЛОБЫ
// ══════════════════════════════════════════════════════════

model Complaint {
  id         String          @id @default(cuid())
  fromUserId String
  surveyId   String?
  sessionId  String?
  reason     String
  details    String?
  status     ComplaintStatus @default(PENDING)
  createdAt  DateTime        @default(now())

  fromUser User    @relation(fields: [fromUserId], references: [id])
  survey   Survey? @relation(fields: [surveyId], references: [id])

  @@map("complaints")
}

enum ComplaintStatus {
  PENDING
  REVIEWED
  RESOLVED
  DISMISSED
}
```

### В — Применить схему

```bash
npx prisma generate
npx prisma db push
```

Проверь через Prisma Studio:
```bash
npx prisma studio
# http://localhost:5555
# Должны появиться: survey_questions, survey_sessions, survey_answers, complaints
```

---

# ЧАСТЬ 2 — ТИПЫ И ВСПОМОГАТЕЛЬНЫЕ ФАЙЛЫ

---

## 2.1 — Типы TypeScript

Создай `types/survey.ts`:

```typescript
export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'SCALE'
  | 'MATRIX'
  | 'RANKING'
  | 'OPEN_TEXT'

export type LogicRule = {
  ifQuestionId: string
  operator:     'equals' | 'not_equals' | 'contains'
  value:        string
  action:       'show' | 'hide'
}

export type Question = {
  id:          string
  type:        QuestionType
  title:       string
  description: string
  required:    boolean
  mediaUrl:    string | null
  options:     string[]
  matrixRows:  string[]
  matrixCols:  string[]
  settings:    Record<string, any>
  logic:       LogicRule[]
}

export type SurveyDraft = {
  title:           string
  description:     string
  category:        string
  questions:       Question[]
  targetGender:    'any' | 'male' | 'female'
  targetAgeMin:    number
  targetAgeMax:    number
  targetCities:    string[]
  targetIncomes:   string[]
  targetInterests: string[]
  maxResponses:    number
  reward:          number
  startsAt:        string
  endsAt:          string
}

export const EMPTY_DRAFT: SurveyDraft = {
  title:           '',
  description:     '',
  category:        '',
  questions:       [],
  targetGender:    'any',
  targetAgeMin:    18,
  targetAgeMax:    65,
  targetCities:    [],
  targetIncomes:   [],
  targetInterests: [],
  maxResponses:    50,
  reward:          50,
  startsAt:        new Date().toISOString().split('T')[0],
  endsAt:          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE:   'Одиночный выбор',
  MULTIPLE_CHOICE: 'Множественный выбор',
  SCALE:           'Шкала оценки',
  MATRIX:          'Матрица',
  RANKING:         'Ранжирование',
  OPEN_TEXT:       'Открытый ответ',
}

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  SINGLE_CHOICE:   '◉',
  MULTIPLE_CHOICE: '☑',
  SCALE:           '⟷',
  MATRIX:          '⊞',
  RANKING:         '↕',
  OPEN_TEXT:       '✎',
}

export function createEmptyQuestion(type: QuestionType): Question {
  const base: Question = {
    id:          crypto.randomUUID(),
    type,
    title:       '',
    description: '',
    required:    true,
    mediaUrl:    null,
    options:     [],
    matrixRows:  [],
    matrixCols:  [],
    settings:    {},
    logic:       [],
  }

  switch (type) {
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return { ...base, options: ['Вариант 1', 'Вариант 2', 'Вариант 3'] }
    case 'RANKING':
      return { ...base, options: ['Элемент 1', 'Элемент 2', 'Элемент 3'] }
    case 'SCALE':
      return { ...base, settings: { min: 1, max: 10, minLabel: 'Совсем нет', maxLabel: 'Определённо да' } }
    case 'MATRIX':
      return {
        ...base,
        matrixRows: ['Критерий 1', 'Критерий 2'],
        matrixCols: ['Плохо', 'Нейтрально', 'Хорошо'],
      }
    case 'OPEN_TEXT':
      return { ...base, settings: { maxLength: 500, placeholder: 'Введите ваш ответ...' } }
    default:
      return base
  }
}
```

---

## 2.2 — Антифрод

Создай `lib/antifrod.ts`:

```typescript
import { prisma } from '@/lib/prisma'

export type FraudCheckInput = {
  userId:    string
  surveyId:  string
  timeSpent: number
  answers:   Record<string, any>
  ipAddress: string
  userAgent: string
  deviceId:  string
}

export type FraudCheckResult = {
  isValid: boolean
  flags:   string[]
}

export async function checkFraud(input: FraudCheckInput): Promise<FraudCheckResult> {
  const flags: string[] = []

  const [survey, user, sameIp, sameDevice] = await Promise.all([
    prisma.survey.findUnique({
      where: { id: input.surveyId },
      include: { questions: true },
    }),
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.surveySession.findFirst({
      where: {
        surveyId:  input.surveyId,
        ipAddress: input.ipAddress,
        userId:    { not: input.userId },
        isValid:   true,
        status:    'COMPLETED',
      },
    }),
    input.deviceId ? prisma.surveySession.findFirst({
      where: {
        surveyId: input.surveyId,
        deviceId: input.deviceId,
        userId:   { not: input.userId },
        isValid:  true,
        status:   'COMPLETED',
      },
    }) : Promise.resolve(null),
  ])

  // Слишком быстро — меньше 8 секунд на вопрос
  const minTime = (survey?.questions.length ?? 5) * 8
  if (input.timeSpent < minTime) flags.push('TOO_FAST')

  // Дублирующий IP
  if (sameIp) flags.push('DUPLICATE_IP')

  // Дублирующее устройство
  if (sameDevice) flags.push('DUPLICATE_DEVICE')

  // Все ответы одинаковые
  const values = Object.values(input.answers)
  if (values.length > 3) {
    const first  = JSON.stringify(values[0])
    const allSame = values.every(v => JSON.stringify(v) === first)
    if (allSame) flags.push('IDENTICAL_ANSWERS')
  }

  // Новый аккаунт (менее 24 часов)
  if (user) {
    const ageMs = Date.now() - user.createdAt.getTime()
    if (ageMs < 24 * 60 * 60 * 1000) flags.push('NEW_ACCOUNT')
  }

  return { isValid: flags.length === 0, flags }
}
```

---

## 2.3 — Лента опросов

Создай `lib/survey-feed.ts`:

```typescript
import { prisma } from '@/lib/prisma'

function getAge(birthDate?: Date | null): number {
  if (!birthDate) return 0
  return Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

export async function getSurveyFeed(userId: string) {
  const profile = await prisma.respondentProfile.findUnique({ where: { userId } })

  const sessions = await prisma.surveySession.findMany({
    where:  { userId },
    select: { surveyId: true },
  })
  const excludeIds = sessions.map(s => s.surveyId)

  const userAge = getAge(profile?.birthDate)
  const now     = new Date()

  return prisma.survey.findMany({
    where: {
      status: 'ACTIVE',
      id:     { notIn: excludeIds.length > 0 ? excludeIds : ['_none_'] },
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ targetGender: 'any' }, { targetGender: null }, { targetGender: profile?.gender ?? null }] },
        { OR: [{ targetAgeMin: null }, { targetAgeMin: { lte: userAge } }] },
        { OR: [{ targetAgeMax: null }, { targetAgeMax: { gte: userAge } }] },
        { OR: [{ targetCities: { isEmpty: true } }, profile?.city ? { targetCities: { has: profile.city } } : {}] },
      ],
    },
    include: {
      _count: {
        select: { sessions: { where: { isValid: true, status: 'COMPLETED' } } },
      },
      questions: { select: { id: true } },
    },
    orderBy: [{ reward: 'desc' }, { createdAt: 'desc' }],
    take: 20,
  })
}

export async function getInProgressSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where:   { userId, status: 'IN_PROGRESS' },
    include: { survey: { include: { questions: { select: { id: true } } } } },
    orderBy: { startedAt: 'desc' },
  })
}

export async function getCompletedSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where:   { userId, status: { in: ['COMPLETED', 'REJECTED'] } },
    include: { survey: true },
    orderBy: { completedAt: 'desc' },
    take:    50,
  })
}
```

---

# ЧАСТЬ 3 — SERVER ACTIONS

Создай `actions/surveys.ts`:

```typescript
'use server'

import { prisma }                    from '@/lib/prisma'
import { requireRole }               from '@/lib/auth-utils'
import { checkFraud }                from '@/lib/antifrod'
import { headers }                   from 'next/headers'
import { revalidatePath }            from 'next/cache'
import type { SurveyDraft }          from '@/types/survey'

// ══════════════════════════════════════════════════════════
// СОЗДАНИЕ ОПРОСА (CLIENT)
// ══════════════════════════════════════════════════════════

export async function createSurveyAction(draft: SurveyDraft) {
  const session = await requireRole('CLIENT')

  if (!draft.title.trim())        return { error: 'Введите название опроса' }
  if (draft.questions.length < 1) return { error: 'Добавьте хотя бы один вопрос' }
  if (draft.maxResponses < 10)    return { error: 'Минимум 10 респондентов' }
  if (draft.reward < 20)          return { error: 'Минимальное вознаграждение — 20 ₽' }

  const rewardTotal = draft.maxResponses * draft.reward
  const commission  = rewardTotal * 0.15
  const budget      = rewardTotal + commission

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
  if (!wallet) return { error: 'Кошелёк не найден' }
  if (Number(wallet.balance) < budget) {
    return { error: `Недостаточно средств. Нужно ${budget.toFixed(0)} ₽, доступно ${Number(wallet.balance).toFixed(0)} ₽` }
  }

  const survey = await prisma.$transaction(async (tx) => {
    const newSurvey = await tx.survey.create({
      data: {
        creatorId:       session.user.id,
        title:           draft.title.trim(),
        description:     draft.description.trim() || null,
        category:        draft.category || null,
        status:          'PENDING_MODERATION',
        maxResponses:    draft.maxResponses,
        reward:          draft.reward,
        budget,
        targetGender:    draft.targetGender,
        targetAgeMin:    draft.targetAgeMin,
        targetAgeMax:    draft.targetAgeMax,
        targetCities:    draft.targetCities,
        targetIncomes:   draft.targetIncomes,
        targetInterests: draft.targetInterests,
        startsAt:        draft.startsAt ? new Date(draft.startsAt) : null,
        endsAt:          draft.endsAt   ? new Date(draft.endsAt)   : null,
      },
    })

    await tx.surveyQuestion.createMany({
      data: draft.questions.map((q, i) => ({
        surveyId:    newSurvey.id,
        order:       i,
        type:        q.type,
        title:       q.title,
        description: q.description || null,
        required:    q.required,
        mediaUrl:    q.mediaUrl,
        options:     q.type === 'MATRIX'
          ? { rows: q.matrixRows, cols: q.matrixCols }
          : q.options.length > 0 ? q.options : null,
        settings: Object.keys(q.settings).length > 0 ? q.settings : null,
        logic:    q.logic.length > 0 ? q.logic : null,
      })),
    })

    await tx.wallet.update({
      where: { id: wallet.id },
      data:  { balance: { decrement: budget }, totalSpent: { increment: budget } },
    })

    await tx.transaction.create({
      data: {
        walletId:    wallet.id,
        type:        'SPENDING',
        amount:      budget,
        description: `Запуск опроса: "${draft.title}"`,
        status:      'COMPLETED',
      },
    })

    return newSurvey
  })

  revalidatePath('/client/surveys')
  return { success: true, surveyId: survey.id }
}

// ══════════════════════════════════════════════════════════
// ПРОХОЖДЕНИЕ (RESPONDENT)
// ══════════════════════════════════════════════════════════

export async function startSurveyAction(surveyId: string) {
  const session = await requireRole('RESPONDENT')

  const survey = await prisma.survey.findUnique({ where: { id: surveyId } })
  if (!survey)               return { error: 'Опрос не найден' }
  if (survey.status !== 'ACTIVE') return { error: 'Опрос недоступен' }

  const existing = await prisma.surveySession.findUnique({
    where: { surveyId_userId: { surveyId, userId: session.user.id } },
  })

  if (existing) {
    if (existing.status === 'IN_PROGRESS') return { success: true, sessionId: existing.id, isResume: true }
    return { error: 'Вы уже проходили этот опрос' }
  }

  const surveySession = await prisma.surveySession.create({
    data: { surveyId, userId: session.user.id, status: 'IN_PROGRESS' },
  })

  return { success: true, sessionId: surveySession.id, isResume: false }
}

export async function completeSurveyAction(params: {
  surveyId:  string
  sessionId: string
  answers:   Record<string, any>
  timeSpent: number
  deviceId:  string
}) {
  const session = await requireRole('RESPONDENT')
  const hdrs    = await headers()
  const ip      = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const ua      = hdrs.get('user-agent') ?? 'unknown'

  const survey = await prisma.survey.findUnique({
    where:   { id: params.surveyId },
    include: { questions: true },
  })
  if (!survey) return { error: 'Опрос не найден' }

  const fraud = await checkFraud({
    userId:    session.user.id,
    surveyId:  params.surveyId,
    timeSpent: params.timeSpent,
    answers:   params.answers,
    ipAddress: ip,
    userAgent: ua,
    deviceId:  params.deviceId,
  })

  await prisma.$transaction(async (tx) => {
    const updatedSession = await tx.surveySession.update({
      where: { id: params.sessionId },
      data: {
        status:      fraud.isValid ? 'COMPLETED' : 'REJECTED',
        completedAt: new Date(),
        timeSpent:   params.timeSpent,
        ipAddress:   ip,
        userAgent:   ua,
        deviceId:    params.deviceId,
        isValid:     fraud.isValid,
        fraudFlags:  fraud.flags,
      },
    })

    const validIds = new Set(survey.questions.map(q => q.id))
    const toSave   = Object.entries(params.answers)
      .filter(([id]) => validIds.has(id))
      .map(([questionId, value]) => ({ sessionId: updatedSession.id, questionId, value }))

    if (toSave.length > 0) {
      await tx.surveyAnswer.createMany({ data: toSave })
    }

    if (fraud.isValid && survey.reward) {
      const wallet = await tx.wallet.findUnique({ where: { userId: session.user.id } })
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data:  { balance: { increment: survey.reward }, totalEarned: { increment: survey.reward } },
        })
        await tx.transaction.create({
          data: {
            walletId:    wallet.id,
            type:        'EARNING',
            amount:      survey.reward,
            description: `Опрос: "${survey.title}"`,
            status:      'COMPLETED',
          },
        })
      }
    }
  })

  // Закрыть опрос если набрали нужное количество
  if (fraud.isValid && survey.maxResponses) {
    const count = await prisma.surveySession.count({
      where: { surveyId: params.surveyId, isValid: true, status: 'COMPLETED' },
    })
    if (count >= survey.maxResponses) {
      await prisma.survey.update({
        where: { id: params.surveyId },
        data:  { status: 'COMPLETED' },
      })
    }
  }

  revalidatePath('/respondent/surveys')
  revalidatePath('/respondent/wallet')

  return { success: true, rewarded: fraud.isValid, amount: fraud.isValid ? Number(survey.reward) : 0 }
}

// ══════════════════════════════════════════════════════════
// МОДЕРАЦИЯ (ADMIN)
// ══════════════════════════════════════════════════════════

export async function approveSurveyAction(surveyId: string) {
  await requireRole('ADMIN')
  await prisma.survey.update({ where: { id: surveyId }, data: { status: 'ACTIVE' } })
  revalidatePath('/admin/moderation')
  return { success: true }
}

export async function rejectSurveyAction(surveyId: string, reason: string) {
  await requireRole('ADMIN')
  if (!reason.trim()) return { error: 'Укажите причину отклонения' }

  const survey = await prisma.survey.findUnique({ where: { id: surveyId } })
  if (!survey) return { error: 'Опрос не найден' }

  await prisma.$transaction(async (tx) => {
    await tx.survey.update({
      where: { id: surveyId },
      data:  { status: 'REJECTED', moderationNote: reason.trim() },
    })

    if (survey.budget && survey.creatorId) {
      const wallet = await tx.wallet.findUnique({ where: { userId: survey.creatorId } })
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data:  { balance: { increment: survey.budget }, totalSpent: { decrement: survey.budget } },
        })
        await tx.transaction.create({
          data: {
            walletId:    wallet.id,
            type:        'REFUND',
            amount:      survey.budget,
            description: `Возврат: опрос "${survey.title}" отклонён`,
            status:      'COMPLETED',
          },
        })
      }
    }
  })

  revalidatePath('/admin/moderation')
  return { success: true }
}

export async function toggleSurveyPauseAction(surveyId: string) {
  const session = await requireRole('CLIENT')
  const survey  = await prisma.survey.findFirst({ where: { id: surveyId, creatorId: session.user.id } })
  if (!survey) return { error: 'Опрос не найден' }

  const next = survey.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
  await prisma.survey.update({ where: { id: surveyId }, data: { status: next } })
  revalidatePath('/client/surveys')
  return { success: true, newStatus: next }
}
```

---

# ЧАСТЬ 4 — LAYOUT ДЛЯ ПРОХОЖДЕНИЯ ОПРОСА

Это ключевое отличие Варианта 2 — отдельный layout без сайдбара.

---

## 4.1 — Создать группу роутов (survey)

Создай папку `app/(survey)/` и файл `app/(survey)/layout.tsx`:

```typescript
// app/(survey)/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Опрос — ПотокМнений',
}

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    // Полностью чистая страница — никакого сайдбара, никакого topbar
    // Только минимальный header с логотипом и контент
    <div className="min-h-screen bg-surface-950 text-white">
      {/* Минимальный header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14
                         bg-surface-950/90 backdrop-blur-xl
                         border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Логотип */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 rounded-md bg-brand
                            group-hover:bg-brand-light transition-colors" />
            <span className="font-display text-white font-bold text-sm">
              ПотокМнений
            </span>
          </a>

          {/* Ничего лишнего — только логотип */}
          {/* Прогресс-бар будет внутри самого плеера, не здесь */}
        </div>
      </header>

      {/* Контент — начинается под header */}
      <main className="pt-14">
        {children}
      </main>
    </div>
  )
}
```

---

## 4.2 — Страница прохождения опроса

Создай `app/(survey)/survey/[id]/page.tsx`:

```typescript
// app/(survey)/survey/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { auth }               from '@/auth'
import { prisma }             from '@/lib/prisma'
import SurveyPlayer           from '@/components/survey-player/SurveyPlayer'

type Props = { params: { id: string } }

export default async function SurveyPage({ params }: Props) {
  const session = await auth()

  // Не авторизован → на логин с возвратом сюда
  if (!session?.user) {
    redirect(`/login?callbackUrl=/survey/${params.id}`)
  }

  // Только респондент может проходить опросы
  if (session.user.role !== 'RESPONDENT') {
    redirect('/')
  }

  // Загружаем опрос с вопросами
  const survey = await prisma.survey.findUnique({
    where:   { id: params.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!survey) notFound()

  // Опрос не активен
  if (survey.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="font-display text-2xl text-white font-bold mb-3">
            Опрос недоступен
          </h1>
          <p className="text-white/40 text-sm mb-8">
            Этот опрос завершён или временно приостановлен.
          </p>
          <a href="/respondent/surveys"
             className="inline-flex px-6 py-3 bg-brand text-white rounded-xl
                        font-semibold text-sm hover:bg-brand-dark transition-colors">
            Вернуться к ленте
          </a>
        </div>
      </div>
    )
  }

  // Проверяем — не проходил ли уже
  const existingSession = await prisma.surveySession.findUnique({
    where: { surveyId_userId: { surveyId: params.id, userId: session.user.id } },
  })

  if (existingSession && existingSession.status !== 'IN_PROGRESS') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="font-display text-2xl text-white font-bold mb-3">
            Вы уже проходили этот опрос
          </h1>
          <p className="text-white/40 text-sm mb-8">
            Каждый опрос можно пройти только один раз.
          </p>
          <a href="/respondent/surveys"
             className="inline-flex px-6 py-3 bg-brand text-white rounded-xl
                        font-semibold text-sm hover:bg-brand-dark transition-colors">
            Найти новые опросы
          </a>
        </div>
      </div>
    )
  }

  return (
    <SurveyPlayer
      survey={{
        id:        survey.id,
        title:     survey.title,
        reward:    survey.reward ? Number(survey.reward) : null,
        questions: survey.questions,
      }}
      existingSessionId={existingSession?.id ?? null}
    />
  )
}
```

---

## 4.3 — Страница завершения

Создай `app/(survey)/survey/[id]/complete/page.tsx`:

```typescript
// Эта страница открывается после успешного завершения
// Параметры передаются через searchParams

import { auth }   from '@/auth'
import { redirect } from 'next/navigation'

type Props = {
  params:       { id: string }
  searchParams: { rewarded?: string; amount?: string }
}

export default async function SurveyCompletePage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const rewarded = searchParams.rewarded === 'true'
  const amount   = Number(searchParams.amount ?? 0)

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">

        {/* Иконка */}
        <div className={`
          w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8
          ${rewarded ? 'bg-green-500/20' : 'bg-white/10'}
        `}>
          <span className="text-5xl">{rewarded ? '🎉' : '✓'}</span>
        </div>

        {/* Заголовок */}
        <h1 className="font-display text-3xl font-bold text-white mb-4">
          {rewarded ? 'Спасибо за ответы!' : 'Опрос завершён'}
        </h1>

        {/* Начисление */}
        {rewarded && amount > 0 && (
          <div className="bg-green-500/10 border border-green-500/20
                          rounded-2xl px-8 py-6 mb-8 inline-block">
            <p className="text-sm text-green-400/70 mb-1">Начислено на баланс</p>
            <p className="font-display text-4xl font-bold text-green-400">
              +{amount} ₽
            </p>
          </div>
        )}

        {/* Без начисления */}
        {!rewarded && (
          <p className="text-white/40 text-base mb-8 leading-relaxed">
            Ваши ответы приняты и помогут улучшить продукты и сервисы.
          </p>
        )}

        {/* Кнопки */}
        <div className="flex flex-col gap-3">
          <a href="/respondent/surveys"
             className="w-full py-4 bg-brand text-white rounded-xl font-semibold
                        hover:bg-brand-dark transition-colors">
            Найти новые опросы
          </a>
          {rewarded && (
            <a href="/respondent/wallet"
               className="w-full py-4 border border-white/10 text-white/70
                          rounded-xl font-medium hover:border-white/20 hover:text-white
                          transition-colors">
              Перейти к кошельку
            </a>
          )}
        </div>

      </div>
    </div>
  )
}
```

---

# ЧАСТЬ 5 — ПЛЕЕР ОПРОСА

---

## 5.1 — Главный компонент SurveyPlayer

Создай `components/survey-player/SurveyPlayer.tsx`:

```typescript
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter }                   from 'next/navigation'
import { startSurveyAction, completeSurveyAction } from '@/actions/surveys'
import QuestionRenderer from './QuestionRenderer'

// Логика показа вопросов на основе правил
function getVisibleQuestions(questions: any[], answers: Record<string, any>) {
  return questions.filter(q => {
    if (!q.logic?.length) return true
    return q.logic.every((rule: any) => {
      const answer    = answers[rule.ifQuestionId]
      const answerStr = Array.isArray(answer) ? answer.join(',') : String(answer ?? '')
      let match = false
      switch (rule.operator) {
        case 'equals':     match = answerStr === rule.value;         break
        case 'not_equals': match = answerStr !== rule.value;         break
        case 'contains':   match = answerStr.includes(rule.value);   break
      }
      return rule.action === 'show' ? match : !match
    })
  })
}

// Device fingerprint — простой, без библиотек
function getDeviceId(): string {
  try {
    const KEY = 'opinflow_did'
    let id = localStorage.getItem(KEY)
    if (!id) {
      const raw = [
        navigator.userAgent,
        screen.width, screen.height, screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.language,
      ].join('|')
      id = btoa(encodeURIComponent(raw)).slice(0, 40)
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

type SurveyQuestion = {
  id:          string
  type:        string
  title:       string
  description: string | null
  required:    boolean
  mediaUrl:    string | null
  options:     any
  settings:    any
  logic:       any
}

type Props = {
  survey: {
    id:        string
    title:     string
    reward:    number | null
    questions: SurveyQuestion[]
  }
  existingSessionId: string | null
}

type Stage = 'INIT' | 'PLAYING' | 'SUBMITTING' | 'ERROR'

export default function SurveyPlayer({ survey, existingSessionId }: Props) {
  const router = useRouter()

  const [stage, setStage]               = useState<Stage>('INIT')
  const [sessionId, setSessionId]       = useState<string | null>(existingSessionId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]           = useState<Record<string, any>>({})
  const [error, setError]               = useState<string | null>(null)
  const startedAtRef                    = useRef(Date.now())

  // Инициализация сессии
  useEffect(() => {
    async function init() {
      if (existingSessionId) {
        // Продолжаем существующую сессию
        setSessionId(existingSessionId)
        setStage('PLAYING')
        return
      }
      const res = await startSurveyAction(survey.id)
      if (res.error) { setError(res.error); setStage('ERROR'); return }
      setSessionId(res.sessionId!)
      setStage('PLAYING')
    }
    init()
  }, [survey.id, existingSessionId])

  const visibleQuestions = getVisibleQuestions(survey.questions, answers)
  const totalVisible     = visibleQuestions.length
  const currentQuestion  = visibleQuestions[currentIndex]
  const isFirst          = currentIndex === 0
  const isLast           = currentIndex === totalVisible - 1
  const progressPct      = totalVisible > 0 ? ((currentIndex) / totalVisible) * 100 : 0

  function handleAnswer(value: any) {
    if (!currentQuestion) return
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
    setError(null)
  }

  function handleNext() {
    if (!currentQuestion) return

    // Проверить обязательность
    if (currentQuestion.required) {
      const val = answers[currentQuestion.id]
      const isEmpty =
        val === undefined || val === null || val === '' ||
        (Array.isArray(val) && val.length === 0)

      if (isEmpty) {
        setError('Пожалуйста, ответьте на этот вопрос')
        return
      }
    }

    setError(null)

    if (isLast) {
      handleSubmit()
    } else {
      setCurrentIndex(i => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    if (isFirst) return
    setError(null)
    setCurrentIndex(i => i - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    if (!sessionId) return
    setStage('SUBMITTING')

    const timeSpent = Math.floor((Date.now() - startedAtRef.current) / 1000)
    const deviceId  = getDeviceId()

    const res = await completeSurveyAction({
      surveyId:  survey.id,
      sessionId,
      answers,
      timeSpent,
      deviceId,
    })

    if (res.error) {
      setError(res.error)
      setStage('PLAYING')
      return
    }

    // Перенаправить на страницу завершения с результатом
    router.push(
      `/survey/${survey.id}/complete?rewarded=${res.rewarded}&amount=${res.amount}`
    )
  }

  // ─── Состояние: инициализация ──────────────────────────

  if (stage === 'INIT') {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent
                          rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Загрузка опроса...</p>
        </div>
      </div>
    )
  }

  // ─── Состояние: ошибка ─────────────────────────────────

  if (stage === 'ERROR') {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-6">⚠️</div>
          <h2 className="font-display text-xl text-white font-bold mb-3">
            Что-то пошло не так
          </h2>
          <p className="text-white/40 text-sm mb-8">{error}</p>
          <a href="/respondent/surveys"
             className="inline-flex px-6 py-3 bg-brand text-white rounded-xl
                        font-semibold text-sm hover:bg-brand-dark transition-colors">
            Вернуться к ленте
          </a>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null

  // ─── Состояние: прохождение ────────────────────────────

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">

      {/* Прогресс-бар — под header, на всю ширину */}
      <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-white/5">
        <div
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">

          {/* Счётчик вопросов */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">
              {survey.title}
            </span>
            <span className="text-xs text-white/25">
              {currentIndex + 1} / {totalVisible}
            </span>
          </div>

          {/* Медиа */}
          {currentQuestion.mediaUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-white/8">
              <img
                src={currentQuestion.mediaUrl}
                alt=""
                className="w-full object-cover max-h-72"
              />
            </div>
          )}

          {/* Вопрос */}
          <div className="mb-10">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white
                            leading-snug tracking-tight mb-3">
              {currentQuestion.title}
              {currentQuestion.required && (
                <span className="text-brand ml-2 text-2xl">*</span>
              )}
            </h2>
            {currentQuestion.description && (
              <p className="text-white/40 text-base leading-relaxed">
                {currentQuestion.description}
              </p>
            )}
          </div>

          {/* Ответ */}
          <div className="mb-8">
            <QuestionRenderer
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={handleAnswer}
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl
                            px-4 py-3 mb-6 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Навигация */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirst}
              className="flex items-center gap-2 px-5 py-3 rounded-xl
                         text-white/40 hover:text-white transition-colors
                         disabled:opacity-0 disabled:pointer-events-none"
            >
              ← Назад
            </button>

            <button
              onClick={handleNext}
              disabled={stage === 'SUBMITTING'}
              className="flex items-center gap-2 px-8 py-3.5 bg-brand text-white
                         rounded-xl font-semibold hover:bg-brand-dark
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all active:scale-[0.98]"
            >
              {stage === 'SUBMITTING'
                ? 'Отправка...'
                : isLast ? 'Завершить опрос' : 'Далее →'}
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
```

---

## 5.2 — QuestionRenderer

Создай `components/survey-player/QuestionRenderer.tsx`:

```typescript
'use client'

// Компоненты типов вопросов
function SingleChoice({ options, value, onChange }: any) {
  return (
    <div className="space-y-3">
      {options?.map((opt: string) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border
                      text-left transition-all duration-150 group
                      ${value === opt
                        ? 'border-brand bg-brand/10 text-white'
                        : 'border-white/10 bg-white/3 text-white/70 hover:border-white/20 hover:bg-white/5'
                      }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                           transition-colors
                           ${value === opt ? 'border-brand' : 'border-white/20'}`}>
            {value === opt && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
          </div>
          <span className="text-sm font-medium">{opt}</span>
        </button>
      ))}
    </div>
  )
}

function MultipleChoice({ options, value = [], onChange }: any) {
  function toggle(opt: string) {
    const current: string[] = Array.isArray(value) ? value : []
    const next = current.includes(opt)
      ? current.filter(v => v !== opt)
      : [...current, opt]
    onChange(next)
  }

  const selected: string[] = Array.isArray(value) ? value : []

  return (
    <div className="space-y-3">
      {options?.map((opt: string) => (
        <button
          key={opt}
          onClick={() => toggle(opt)}
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border
                      text-left transition-all duration-150
                      ${selected.includes(opt)
                        ? 'border-brand bg-brand/10 text-white'
                        : 'border-white/10 bg-white/3 text-white/70 hover:border-white/20 hover:bg-white/5'
                      }`}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center
                           transition-colors
                           ${selected.includes(opt) ? 'border-brand bg-brand' : 'border-white/20'}`}>
            {selected.includes(opt) && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
              </svg>
            )}
          </div>
          <span className="text-sm font-medium">{opt}</span>
        </button>
      ))}
    </div>
  )
}

function Scale({ settings, value, onChange }: any) {
  const min      = settings?.min ?? 1
  const max      = settings?.max ?? 10
  const minLabel = settings?.minLabel ?? ''
  const maxLabel = settings?.maxLabel ?? ''
  const steps    = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div>
      {/* Числа */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {steps.map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-12 h-12 rounded-xl font-bold text-sm transition-all duration-150
                        ${value === n
                          ? 'bg-brand text-white scale-110'
                          : 'bg-white/5 border border-white/10 text-white/50 hover:border-white/25'
                        }`}
          >
            {n}
          </button>
        ))}
      </div>
      {/* Подписи */}
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-white/30 px-1">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

function Matrix({ options, value = {}, onChange }: any) {
  const rows: string[] = options?.rows ?? []
  const cols: string[] = options?.cols ?? []
  const current: Record<string, string> = typeof value === 'object' && !Array.isArray(value) ? value : {}

  function selectCell(row: string, col: string) {
    onChange({ ...current, [row]: col })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr>
            <th className="w-40 pb-4" />
            {cols.map(col => (
              <th key={col} className="pb-4 px-3 text-xs font-semibold text-white/40 text-center">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map(row => (
            <tr key={row} className="hover:bg-white/3 transition-colors">
              <td className="py-4 pr-4 text-sm text-white/70 font-medium">{row}</td>
              {cols.map(col => (
                <td key={col} className="py-4 px-3 text-center">
                  <button
                    onClick={() => selectCell(row, col)}
                    className={`w-5 h-5 rounded-full border-2 mx-auto flex items-center
                                justify-center transition-colors
                                ${current[row] === col
                                  ? 'border-brand'
                                  : 'border-white/20 hover:border-white/40'
                                }`}
                  >
                    {current[row] === col && (
                      <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                    )}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Ranking({ options, value, onChange }: any) {
  // Инициализируем порядок из value или из оригинального списка
  const items: string[] = Array.isArray(value) && value.length > 0 ? value : (options ?? [])

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...items]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return
    const next = [...items]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={item}
          className="flex items-center gap-3 px-5 py-4 bg-white/3 border border-white/10
                     rounded-xl group hover:border-white/20 transition-colors"
        >
          {/* Позиция */}
          <span className="w-7 h-7 rounded-lg bg-brand/20 text-brand text-xs font-bold
                           flex items-center justify-center flex-shrink-0">
            {i + 1}
          </span>

          {/* Текст */}
          <span className="flex-1 text-sm text-white/80 font-medium">{item}</span>

          {/* Кнопки перемещения */}
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => moveUp(i)}
              disabled={i === 0}
              className="w-6 h-5 flex items-center justify-center text-white/40
                         hover:text-white disabled:opacity-20 transition-colors text-xs"
            >
              ▲
            </button>
            <button
              onClick={() => moveDown(i)}
              disabled={i === items.length - 1}
              className="w-6 h-5 flex items-center justify-center text-white/40
                         hover:text-white disabled:opacity-20 transition-colors text-xs"
            >
              ▼
            </button>
          </div>
        </div>
      ))}
      <p className="text-xs text-white/25 mt-3 text-center">
        Расставьте элементы в порядке предпочтения
      </p>
    </div>
  )
}

function OpenText({ settings, value = '', onChange }: any) {
  const maxLength = settings?.maxLength ?? 500
  const placeholder = settings?.placeholder ?? 'Введите ваш ответ...'

  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={5}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4
                   text-white text-sm leading-relaxed resize-none
                   placeholder:text-white/25
                   focus:border-brand/50 focus:outline-none focus:bg-white/8
                   transition-colors"
      />
      <div className="flex justify-end mt-2">
        <span className="text-xs text-white/25">
          {String(value).length} / {maxLength}
        </span>
      </div>
    </div>
  )
}

// ─── Главный рендер ───────────────────────────────────────

export default function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: any
  value:    any
  onChange: (value: any) => void
}) {
  switch (question.type) {
    case 'SINGLE_CHOICE':
      return <SingleChoice options={question.options} value={value} onChange={onChange} />

    case 'MULTIPLE_CHOICE':
      return <MultipleChoice options={question.options} value={value} onChange={onChange} />

    case 'SCALE':
      return <Scale settings={question.settings} value={value} onChange={onChange} />

    case 'MATRIX':
      return <Matrix options={question.options} value={value} onChange={onChange} />

    case 'RANKING':
      return <Ranking options={question.options} value={value} onChange={onChange} />

    case 'OPEN_TEXT':
      return <OpenText settings={question.settings} value={value} onChange={onChange} />

    default:
      return <p className="text-white/40 text-sm">Неизвестный тип вопроса</p>
  }
}
```

---

# ЧАСТЬ 6 — ЛЕНТА ОПРОСОВ В КАБИНЕТЕ

---

## 6.1 — Страница ленты

Создай `app/(dashboard)/respondent/surveys/page.tsx`:

```typescript
import { requireRole }       from '@/lib/auth-utils'
import { getSurveyFeed, getInProgressSurveys, getCompletedSurveys } from '@/lib/survey-feed'
import SurveyFeedClient      from '@/components/respondent/SurveyFeedClient'

export default async function RespondentSurveysPage() {
  const session = await requireRole('RESPONDENT')

  const [available, inProgress, completed] = await Promise.all([
    getSurveyFeed(session.user.id),
    getInProgressSurveys(session.user.id),
    getCompletedSurveys(session.user.id),
  ])

  return (
    <SurveyFeedClient
      available={available}
      inProgress={inProgress}
      completed={completed}
    />
  )
}
```

---

## 6.2 — Клиентский компонент ленты

Создай `components/respondent/SurveyFeedClient.tsx`:

```typescript
'use client'
import { useState } from 'react'
import Link         from 'next/link'

type Tab = 'available' | 'inprogress' | 'completed'

// Карточка опроса в ленте — ведёт на /survey/[id]
function SurveyCard({ survey, type }: { survey: any; type: 'available' | 'inprogress' }) {
  const completedCount = survey._count?.sessions ?? 0
  const totalCount     = survey.maxResponses ?? 0
  const questionsCount = survey.questions?.length ?? 0
  const progress       = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const sessionProgress = type === 'inprogress' && survey.survey
    ? null  // прогресс прохождения (TODO в следующей итерации)
    : null

  const surveyData = type === 'inprogress' ? survey.survey : survey
  const href       = `/survey/${surveyData.id}`

  return (
    <Link href={href} className="block">
      <div className="bg-dash-card border border-dash-border rounded-2xl p-6
                      hover:border-brand/30 hover:shadow-card transition-all duration-200
                      group cursor-pointer">

        {/* Шапка */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {surveyData.category && (
              <span className="text-xs font-semibold text-brand uppercase tracking-wider">
                {surveyData.category}
              </span>
            )}
            <h3 className="text-base font-semibold text-dash-heading mt-1 leading-snug
                           group-hover:text-brand transition-colors line-clamp-2">
              {surveyData.title}
            </h3>
          </div>

          {/* Вознаграждение */}
          {surveyData.reward && (
            <div className="flex-shrink-0 text-right">
              <span className="text-xl font-bold text-brand">
                +{Number(surveyData.reward).toFixed(0)} ₽
              </span>
            </div>
          )}
        </div>

        {/* Мета */}
        <div className="flex items-center gap-4 text-xs text-dash-muted mb-4">
          {questionsCount > 0 && <span>{questionsCount} вопросов</span>}
          {surveyData.estimatedTime && <span>~{surveyData.estimatedTime} мин</span>}
          {type === 'inprogress' && (
            <span className="text-brand font-semibold">В процессе</span>
          )}
        </div>

        {/* Прогресс сбора (для available) */}
        {type === 'available' && totalCount > 0 && (
          <div>
            <div className="w-full h-1 bg-dash-border rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-brand/50 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-dash-muted">
              {completedCount} из {totalCount} ответов собрано
            </span>
          </div>
        )}

        {/* Кнопка */}
        <div className="mt-5 flex justify-end">
          <span className="text-sm font-semibold text-brand
                           group-hover:gap-2 transition-all inline-flex items-center gap-1">
            {type === 'inprogress' ? 'Продолжить' : 'Начать'} →
          </span>
        </div>
      </div>
    </Link>
  )
}

// Карточка завершённого опроса
function CompletedCard({ session }: { session: any }) {
  const rewarded = session.isValid && session.status === 'COMPLETED'
  const date     = new Date(session.completedAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long',
  })

  return (
    <div className="flex items-center justify-between py-4
                    border-b border-dash-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dash-heading truncate">
          {session.survey?.title ?? 'Опрос'}
        </p>
        <p className="text-xs text-dash-muted mt-0.5">{date}</p>
      </div>
      <div className="flex-shrink-0 ml-4 text-right">
        {rewarded ? (
          <span className="text-sm font-bold text-green-500">
            +{Number(session.survey?.reward ?? 0).toFixed(0)} ₽
          </span>
        ) : (
          <span className="text-xs text-dash-muted">Без начисления</span>
        )}
      </div>
    </div>
  )
}

// ─── Главный компонент ────────────────────────────────────

export default function SurveyFeedClient({ available, inProgress, completed }: {
  available:  any[]
  inProgress: any[]
  completed:  any[]
}) {
  const [tab, setTab] = useState<Tab>('available')

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'available',  label: 'Доступные',    count: available.length  },
    { key: 'inprogress', label: 'В работе',     count: inProgress.length },
    { key: 'completed',  label: 'Завершённые',  count: completed.length  },
  ]

  return (
    <div>
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-dash-heading">
          Лента опросов
        </h1>
        <p className="text-sm text-dash-muted mt-1">
          Проходите опросы и зарабатывайте
        </p>
      </div>

      {/* Табы */}
      <div className="flex gap-1 p-1 bg-dash-bg rounded-xl border border-dash-border mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-150
                        ${tab === t.key
                          ? 'bg-dash-card text-dash-heading shadow-sm border border-dash-border'
                          : 'text-dash-muted hover:text-dash-body'
                        }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                                ${tab === t.key ? 'bg-brand/15 text-brand' : 'bg-dash-border text-dash-muted'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Контент таба */}
      {tab === 'available' && (
        available.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {available.map(s => (
              <SurveyCard key={s.id} survey={s} type="available" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-lg font-bold text-dash-heading mb-2">
              Нет доступных опросов
            </h3>
            <p className="text-sm text-dash-muted max-w-xs mx-auto">
              Заполните профиль полнее — система подберёт больше подходящих опросов
            </p>
            <Link
              href="/respondent/profile"
              className="inline-flex mt-6 px-5 py-2.5 bg-brand text-white text-sm
                         font-semibold rounded-xl hover:bg-brand-dark transition-colors"
            >
              Заполнить профиль
            </Link>
          </div>
        )
      )}

      {tab === 'inprogress' && (
        inProgress.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inProgress.map(s => (
              <SurveyCard key={s.id} survey={s} type="inprogress" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-dash-muted text-sm">Нет незавершённых опросов</p>
          </div>
        )
      )}

      {tab === 'completed' && (
        completed.length > 0 ? (
          <div className="bg-dash-card border border-dash-border rounded-2xl divide-y divide-dash-border overflow-hidden">
            {completed.map(s => (
              <div key={s.id} className="px-6">
                <CompletedCard session={s} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-dash-muted text-sm">Вы ещё не прошли ни одного опроса</p>
          </div>
        )
      )}
    </div>
  )
}
```

---

# ЧАСТЬ 7 — ТЕСТИРОВАНИЕ

---

## 7.1 — Полный сценарий тестирования

### Тест 1 — Создание опроса (CLIENT)

```
Войти: client@test.local / Test12345!
Открыть: /client/surveys/create

Шаг 1 — Основное:
  □ Попробовать перейти без названия → ошибка валидации
  □ Заполнить: название, описание, категория
  □ Нажать Далее →

Шаг 2 — Вопросы:
  □ Добавить SINGLE_CHOICE с 3 вариантами
  □ Добавить MULTIPLE_CHOICE с 3 вариантами
  □ Добавить SCALE (1-10)
  □ Добавить MATRIX (2 строки × 3 столбца)
  □ Добавить RANKING с 4 элементами
  □ Добавить OPEN_TEXT
  □ Перетащить вопросы — порядок меняется
  □ Удалить один вопрос — удаляется
  □ Нажать Далее →

Шаг 3 — Аудитория:
  □ Пол: Все
  □ Возраст: 18-45
  □ Нажать Далее →

Шаг 4 — Бюджет:
  □ 20 респондентов × 50 ₽ = 1000 ₽ + 150 ₽ = 1150 ₽ итого
  □ Расчёт правильный
  □ Нажать Опубликовать

После:
  □ Prisma Studio → surveys → статус PENDING_MODERATION
  □ Prisma Studio → survey_questions → 5 записей
  □ Prisma Studio → wallets → balance уменьшился на 1150 ₽
  □ Prisma Studio → transactions → запись SPENDING
```

### Тест 2 — Модерация (ADMIN)

```
Войти: admin@test.local / Test12345!
Открыть: /admin/moderation

  □ Опрос из Теста 1 виден
  □ Нажать Просмотреть → открывается preview со всеми вопросами
  □ Нажать Одобрить
  □ Prisma Studio → surveys → статус ACTIVE

Создать второй опрос и:
  □ Нажать Отклонить → ввести причину → подтвердить
  □ Prisma Studio → surveys → статус REJECTED, moderationNote заполнен
  □ Prisma Studio → wallets → баланс заказчика вернулся
  □ Prisma Studio → transactions → запись REFUND
```

### Тест 3 — Прохождение опроса (RESPONDENT)

```
Войти: respondent@test.local / Test12345!
Открыть: /respondent/surveys

  □ Одобренный опрос виден в ленте (таб "Доступные")
  □ Карточка показывает: название, вознаграждение, кол-во вопросов
  □ Нажать Начать → переход на /survey/[id]

На странице прохождения:
  □ URL: /survey/[id] — НЕТ сайдбара, только логотип вверху
  □ Прогресс-бар в шапке
  □ Первый вопрос отображается крупно
  □ Ответить → нажать Далее
  □ Нажать Назад → вернулись к предыдущему
  □ Прогресс-бар движется при переходах
  □ Попробовать пропустить обязательный вопрос → ошибка
  □ На последнем вопросе кнопка "Завершить опрос"
  □ Нажать Завершить

Экран завершения /survey/[id]/complete:
  □ URL правильный: /survey/[id]/complete
  □ Нет сайдбара
  □ Показана сумма начисления
  □ Кнопки: Найти новые опросы / Перейти к кошельку

После:
  □ /respondent/wallet → баланс увеличился
  □ /respondent/surveys → опрос исчез из ленты, появился в "Завершённые"
  □ Prisma Studio → survey_sessions → статус COMPLETED, isValid true
  □ Prisma Studio → survey_answers → все ответы сохранены
  □ Prisma Studio → transactions → запись EARNING
  □ Попробовать зайти снова на /survey/[id] → "Вы уже проходили этот опрос"
```

### Тест 4 — Антифрод

```
Создать тестового пользователя (новый email)
Войти как этот пользователь

  □ Начать опрос
  □ Ответить на все вопросы очень быстро (5-10 секунд)
  □ Завершить

Проверить:
  □ Prisma Studio → survey_sessions → fraudFlags: ["TOO_FAST"]
  □ isValid = false
  □ status = REJECTED
  □ transactions → начисления НЕТ
  □ Экран завершения → нет суммы ("Ответы приняты" без цифр)
```

---

## 7.2 — Частые проблемы

### Ошибки dnd-kit
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Prisma не видит новые поля
```bash
npx prisma generate
npx prisma db push
```

### Опрос не появляется в ленте
Проверить в Prisma Studio:
- `surveys.status` = 'ACTIVE'
- `surveys.endsAt` > текущего времени
- Профиль респондента совпадает с таргетингом

### Антифрод блокирует при тестировании
Временно уменьши в `lib/antifrod.ts`:
```typescript
const minTime = (survey?.questions.length ?? 5) * 2 // вместо 8
```
Вернуть обратно перед деплоем.

### Страница /survey/[id] редиректит в кабинет
Проверь что `app/(survey)/layout.tsx` создан и не конфликтует с `app/(dashboard)/layout.tsx`.

---

# ЧАСТЬ 8 — ДЕПЛОЙ

```bash
# Проверить что нет ошибок
npm run build
npm run lint

# Задеплоить
git add .
git commit -m "feat: этап 3 — конструктор, лента, прохождение на весь экран, антифрод"
git push origin main
```

После деплоя в Vercel Dashboard → Settings → Environment Variables проверить:
```
NEXT_PUBLIC_SUPABASE_URL       ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY  ✅
SUPABASE_SERVICE_ROLE_KEY      ✅
```

Пройти все 4 теста из Части 7 на живом сайте.

---

# ПОРЯДОК РАЗРАБОТКИ ПО ДНЯМ

```
День 1:
  □ Установить зависимости
  □ Настроить Supabase Storage
  □ Расширить Prisma схему → npx prisma db push
  □ types/survey.ts
  □ lib/storage.ts

День 2:
  □ lib/antifrod.ts
  □ lib/survey-feed.ts
  □ actions/surveys.ts

День 3:
  □ app/(survey)/layout.tsx             ← новый layout без сайдбара
  □ app/(survey)/survey/[id]/page.tsx
  □ app/(survey)/survey/[id]/complete/page.tsx

День 4:
  □ components/survey-player/QuestionRenderer.tsx
  □ components/survey-player/SurveyPlayer.tsx

День 5:
  □ app/(dashboard)/respondent/surveys/page.tsx
  □ components/respondent/SurveyFeedClient.tsx

День 6:
  □ Конструктор: SurveyBuilder.tsx
  □ Конструктор: StepBasic.tsx
  □ Конструктор: StepQuestions.tsx (самый сложный)

День 7:
  □ Конструктор: StepAudience.tsx
  □ Конструктор: StepBudget.tsx
  □ app/(dashboard)/client/surveys/create/page.tsx

День 8:
  □ app/(dashboard)/admin/moderation/page.tsx

День 9-10:
  □ Тестирование всех 4 сценариев
  □ Исправление багов

День 11:
  □ npm run build без ошибок
  □ Деплой на Vercel
  □ Финальная проверка на живом сайте
```