# ИНСТРУКЦИЯ ПО РАЗРАБОТКЕ — ЭТАП 3
# Конструктор опросов + Лента + Прохождение + Антифрод + Начисления

---

# ЧАСТЬ 1 — ПОДГОТОВКА ПРОЕКТА

---

## 1.1 — Проверка что проект работает

Прежде чем писать новый код — убедись что текущий проект запускается без ошибок.

```bash
cd opinflow
npm install
npm run dev
```

Открой `http://localhost:3000`. Проверь:
- Главная страница открывается
- Авторизация через email работает
- Кабинеты открываются после входа

Если что-то не работает — исправь это сначала. Никогда не начинай новый функционал на сломанной основе.

---

## 1.2 — Установка зависимостей

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install date-fns
npm install uuid
npm install @types/uuid -D
```

**Что это и зачем:**

`@dnd-kit/core` — основная библиотека для drag-and-drop. Нужна для перетаскивания вопросов в конструкторе.

`@dnd-kit/sortable` — расширение dnd-kit специально для сортируемых списков. Именно это используем для списка вопросов.

`@dnd-kit/utilities` — утилиты dnd-kit, нужны для CSS трансформаций при перетаскивании.

`date-fns` — работа с датами. Нужна для дат начала и окончания опроса.

`uuid` — генерация уникальных ID. Нужна для временных ID вопросов пока они не сохранены в БД.

После установки проверь:
```bash
npm run dev
# Не должно быть ошибок
```

---

## 1.3 — Настройка Supabase Storage

Медиафайлы (изображения к вопросам) нужно хранить в облаке. Используем Supabase Storage который уже подключён к проекту.

**Создание bucket:**

1. Зайди на supabase.com → твой проект
2. В левом меню → **Storage**
3. Нажми **New bucket**
4. Name: `opinflow-media`
5. Поставь галку **Public bucket** — файлы будут доступны по прямой ссылке
6. Нажми **Create bucket**

**Настройка политик доступа:**

После создания bucket нажми на него → **Policies** → **New policy**

Добавь две политики:

Политика 1 — чтение для всех:
```
Policy name: Public read
Allowed operation: SELECT
Target roles: public
Policy definition: true
```

Политика 2 — загрузка для авторизованных:
```
Policy name: Authenticated upload
Allowed operation: INSERT
Target roles: authenticated
Policy definition: true
```

**Создание файла `lib/storage.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js'

// Используем service role key — только на сервере, никогда на клиенте
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'opinflow-media'

// Загрузить файл и получить публичный URL
export async function uploadQuestionMedia(file: File): Promise<string> {
  // Проверяем тип файла
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Разрешены только изображения: JPEG, PNG, WebP, GIF')
  }

  // Проверяем размер (максимум 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Файл слишком большой. Максимум 10MB')
  }

  // Генерируем уникальное имя
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Загружаем
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, {
      contentType: file.type,
      cacheControl: '3600',
    })

  if (error) throw new Error(`Ошибка загрузки файла: ${error.message}`)

  // Получаем публичный URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

// Удалить файл по URL
export async function deleteMedia(publicUrl: string): Promise<void> {
  // Извлекаем путь из URL
  const urlParts = publicUrl.split(`/${BUCKET}/`)
  if (urlParts.length < 2) return

  const filePath = urlParts[1]
  await supabase.storage.from(BUCKET).remove([filePath])
}
```

---

## 1.4 — Расширение Prisma схемы

Это самый критичный шаг всего этапа. Открой `prisma/schema.prisma`.

### Шаг А — Обновить модель Survey

Найди существующую модель `Survey` и добавь новые поля:

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
  // Сколько ответов нужно собрать. Когда собрано — опрос автоматически закрывается.

  reward          Decimal?   @db.Decimal(10, 2)
  // Вознаграждение респонденту за одно прохождение в рублях.

  estimatedTime   Int?
  // Примерное время прохождения в минутах. Показывается в карточке опроса.

  budget          Decimal?   @db.Decimal(10, 2)
  // Общий бюджет = maxResponses × reward × 1.15 (с комиссией).
  // Списывается с кошелька заказчика при создании опроса.

  targetGender    String?
  // Таргетинг по полу: "any" | "male" | "female"

  targetAgeMin    Int?
  targetAgeMax    Int?
  // Таргетинг по возрасту. Если null — без ограничений.

  targetCities    String[]
  // Список городов. Пустой массив = все города.

  targetIncomes   String[]
  // Уровни дохода: "under30k" | "30-60k" | "60-100k" | "over100k"

  targetInterests String[]
  // Интересы из профиля респондента.

  startsAt        DateTime?
  // Дата начала показа опроса. Если null — сразу после одобрения.

  endsAt          DateTime?
  // Дата окончания. После этой даты опрос скрывается из ленты.

  moderationNote  String?
  // Причина отклонения — видит только заказчик в своём кабинете.
  // ─────────────────────────────────────────────────────

  // Связи
  creator    User             @relation("SurveyCreator", fields: [creatorId], references: [id])
  responses  SurveyResponse[]
  questions  SurveyQuestion[]  // ← новая связь
  sessions   SurveySession[]   // ← новая связь
  complaints Complaint[]       // ← новая связь

  @@map("surveys")
}
```

### Шаг Б — Добавить новые модели

Добавь в конец файла после всех существующих моделей:

```prisma
// ══════════════════════════════════════════════════════════
// ВОПРОСЫ ОПРОСА
// ══════════════════════════════════════════════════════════

model SurveyQuestion {
  id          String       @id @default(cuid())
  surveyId    String
  order       Int
  // Порядок вопроса (0, 1, 2...). Используется для сортировки.
  // При drag-and-drop обновляется у всех затронутых вопросов.

  type        QuestionType

  title       String
  // Текст вопроса. Обязательное поле.

  description String?
  // Дополнительное пояснение к вопросу. Необязательное.

  required    Boolean      @default(true)
  // Если true — респондент не может пропустить вопрос.

  mediaUrl    String?
  // Ссылка на изображение из Supabase Storage.

  options     Json?
  // Варианты ответов. Структура зависит от типа вопроса:
  //
  // SINGLE_CHOICE / MULTIPLE_CHOICE / RANKING:
  //   ["Вариант 1", "Вариант 2", "Вариант 3"]
  //
  // MATRIX:
  //   { rows: ["Строка 1", "Строка 2"], cols: ["Столбец 1", "Столбец 2"] }
  //
  // SCALE / OPEN_TEXT:
  //   null (не используется)

  settings    Json?
  // Дополнительные настройки. Структура:
  //
  // SCALE:
  //   { min: 1, max: 10, minLabel: "Плохо", maxLabel: "Отлично" }
  //
  // OPEN_TEXT:
  //   { maxLength: 500, placeholder: "Введите ваш ответ..." }
  //
  // Остальные типы: null

  logic       Json?
  // Правила показа вопроса. Массив LogicRule:
  // [
  //   {
  //     ifQuestionId: "question_id",
  //     operator: "equals",       // "equals" | "not_equals" | "contains"
  //     value: "Да",
  //     action: "show"            // "show" | "hide"
  //   }
  // ]
  // Все правила применяются через AND.
  // Если logic пустой или null — вопрос всегда показывается.

  createdAt   DateTime     @default(now())

  survey  Survey         @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  answers SurveyAnswer[]

  @@map("survey_questions")
}

enum QuestionType {
  SINGLE_CHOICE    // Одиночный выбор — radio кнопки
  MULTIPLE_CHOICE  // Множественный выбор — чекбоксы
  SCALE            // Шкала — ползунок
  MATRIX           // Матрица — таблица с radio
  RANKING          // Ранжирование — drag-and-drop список
  OPEN_TEXT        // Открытый ответ — textarea
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
  // Заполняется когда пользователь дошёл до конца.

  timeSpent   Int?
  // Время прохождения в секундах.
  // Считается на фронте: Date.now() - startedAt.

  ipAddress   String?
  // IP адрес пользователя. Берётся из заголовка x-forwarded-for.

  userAgent   String?
  // User-Agent браузера.

  deviceId    String?
  // Fingerprint браузера. Генерируется на фронте.
  // Позволяет отслеживать устройство даже при смене IP.

  isValid     Boolean       @default(true)
  // false если антифрод заблокировал прохождение.

  fraudFlags  String[]
  // Список причин блокировки:
  // "TOO_FAST"          — прошёл слишком быстро
  // "DUPLICATE_IP"      — тот же IP уже проходил
  // "DUPLICATE_DEVICE"  — то же устройство уже проходило
  // "IDENTICAL_ANSWERS" — все ответы одинаковые
  // "NEW_ACCOUNT"       — аккаунт создан менее суток назад

  survey  Survey         @relation(fields: [surveyId], references: [id], onDelete: Cascade)
  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers SurveyAnswer[]

  @@unique([surveyId, userId])
  // Один пользователь может пройти опрос только один раз.
  // При попытке создать вторую сессию — ошибка уникальности.

  @@map("survey_sessions")
}

enum SessionStatus {
  IN_PROGRESS  // Пользователь начал но не закончил
  COMPLETED    // Успешно завершено
  ABANDONED    // Бросил на середине (для статистики)
  REJECTED     // Антифрод заблокировал — деньги не начисляются
}

// ══════════════════════════════════════════════════════════
// ОТВЕТЫ НА ВОПРОСЫ
// ══════════════════════════════════════════════════════════

model SurveyAnswer {
  id         String   @id @default(cuid())
  sessionId  String
  questionId String

  value      Json
  // Ответ пользователя. Структура зависит от типа вопроса:
  //
  // SINGLE_CHOICE:    "Вариант 2"
  // MULTIPLE_CHOICE:  ["Вариант 1", "Вариант 3"]
  // SCALE:            7
  // MATRIX:           { "Строка 1": "Столбец 2", "Строка 2": "Столбец 1" }
  // RANKING:          ["Вариант 3", "Вариант 1", "Вариант 2"]
  // OPEN_TEXT:        "Текст ответа пользователя"

  createdAt  DateTime @default(now())

  session  SurveySession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question SurveyQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, questionId])
  // Один ответ на один вопрос в рамках одной сессии.

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
  // Краткая причина: "inappropriate_content" | "technical_issue" | "other"

  details    String?
  // Подробное описание от пользователя.

  status     ComplaintStatus @default(PENDING)
  createdAt  DateTime        @default(now())

  fromUser User    @relation(fields: [fromUserId], references: [id])
  survey   Survey? @relation(fields: [surveyId], references: [id])

  @@map("complaints")
}

enum ComplaintStatus {
  PENDING   // Новая, не рассмотрена
  REVIEWED  // Взята в работу
  RESOLVED  // Решена
  DISMISSED // Отклонена как необоснованная
}
```

### Шаг В — Применить схему

```bash
# Сгенерировать Prisma Client с новыми моделями
npx prisma generate

# Применить изменения в базу данных
npx prisma db push
```

Должно вывести что таблицы созданы. Проверь:

```bash
npx prisma studio
# Открой http://localhost:5555
# Должны появиться: survey_questions, survey_sessions, survey_answers, complaints
```

---

# ЧАСТЬ 2 — ТИПЫ И ВСПОМОГАТЕЛЬНЫЕ ФАЙЛЫ

---

## 2.1 — Типы TypeScript

Создай файл `types/survey.ts`:

```typescript
// Типы вопросов — соответствуют enum QuestionType в Prisma
export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'SCALE'
  | 'MATRIX'
  | 'RANKING'
  | 'OPEN_TEXT'

// Правило логики показа вопроса
export type LogicRule = {
  ifQuestionId: string    // ID вопроса на который смотрим
  operator:     'equals' | 'not_equals' | 'contains'
  value:        string    // Значение для сравнения
  action:       'show' | 'hide'  // Что делать с текущим вопросом
}

// Настройки вопроса (зависят от типа)
export type QuestionSettings =
  | { min: number; max: number; minLabel?: string; maxLabel?: string }  // SCALE
  | { maxLength: number; placeholder?: string }                          // OPEN_TEXT
  | Record<string, never>                                                // остальные

// Вопрос в конструкторе (до сохранения в БД)
export type Question = {
  id:          string           // временный uuid, заменяется на cuid после сохранения
  type:        QuestionType
  title:       string
  description: string
  required:    boolean
  mediaUrl:    string | null
  options:     string[]         // для SINGLE, MULTIPLE, RANKING
  matrixRows:  string[]         // для MATRIX
  matrixCols:  string[]         // для MATRIX
  settings:    QuestionSettings
  logic:       LogicRule[]
}

// Черновик опроса — полное состояние конструктора
export type SurveyDraft = {
  // Шаг 1
  title:       string
  description: string
  category:    string

  // Шаг 2
  questions: Question[]

  // Шаг 3
  targetGender:    'any' | 'male' | 'female'
  targetAgeMin:    number   // 18
  targetAgeMax:    number   // 99
  targetCities:    string[]
  targetIncomes:   string[]
  targetInterests: string[]

  // Шаг 4
  maxResponses:  number   // минимум 10
  reward:        number   // минимум 20 ₽
  startsAt:      string   // ISO строка даты
  endsAt:        string   // ISO строка даты
}

// Начальное состояние черновика
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

// Создать пустой вопрос по типу
export function createEmptyQuestion(type: QuestionType): Question {
  const base = {
    id:          crypto.randomUUID(),
    type,
    title:       '',
    description: '',
    required:    true,
    mediaUrl:    null,
    options:     [],
    matrixRows:  [],
    matrixCols:  [],
    settings:    {} as QuestionSettings,
    logic:       [],
  }

  switch (type) {
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
      return { ...base, options: ['Вариант 1', 'Вариант 2'] }

    case 'RANKING':
      return { ...base, options: ['Элемент 1', 'Элемент 2', 'Элемент 3'] }

    case 'SCALE':
      return { ...base, settings: { min: 1, max: 5, minLabel: 'Плохо', maxLabel: 'Отлично' } }

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

// Метки типов для UI
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE:   'Одиночный выбор',
  MULTIPLE_CHOICE: 'Множественный выбор',
  SCALE:           'Шкала оценки',
  MATRIX:          'Матрица',
  RANKING:         'Ранжирование',
  OPEN_TEXT:       'Открытый ответ',
}
```

---

## 2.2 — Антифрод система

Создай файл `lib/antifrod.ts`:

```typescript
import { prisma } from '@/lib/prisma'

export type FraudCheckInput = {
  userId:    string
  surveyId:  string
  timeSpent: number             // секунды
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

  // Загружаем данные опроса параллельно
  const [survey, user, sameIpSession, sameDeviceSession] = await Promise.all([
    prisma.survey.findUnique({
      where:   { id: input.surveyId },
      include: { questions: true },
    }),
    prisma.user.findUnique({
      where: { id: input.userId },
    }),
    // Проверяем тот же IP у другого пользователя
    prisma.surveySession.findFirst({
      where: {
        surveyId:  input.surveyId,
        ipAddress: input.ipAddress,
        userId:    { not: input.userId },
        isValid:   true,
        status:    'COMPLETED',
      },
    }),
    // Проверяем то же устройство у другого пользователя
    input.deviceId
      ? prisma.surveySession.findFirst({
          where: {
            surveyId: input.surveyId,
            deviceId: input.deviceId,
            userId:   { not: input.userId },
            isValid:  true,
            status:   'COMPLETED',
          },
        })
      : Promise.resolve(null),
  ])

  // ─── Проверка 1: Слишком быстрое прохождение ───────────
  // Минимум 8 секунд на каждый вопрос
  const questionCount = survey?.questions.length ?? 5
  const minTimeSeconds = questionCount * 8
  if (input.timeSpent < minTimeSeconds) {
    flags.push('TOO_FAST')
  }

  // ─── Проверка 2: Дублирующий IP адрес ──────────────────
  if (sameIpSession) {
    flags.push('DUPLICATE_IP')
  }

  // ─── Проверка 3: Дублирующее устройство ────────────────
  if (sameDeviceSession) {
    flags.push('DUPLICATE_DEVICE')
  }

  // ─── Проверка 4: Одинаковые ответы на все вопросы ──────
  // Если пользователь тыкал одну и ту же кнопку везде
  const answerValues = Object.values(input.answers)
  if (answerValues.length > 3) {
    const firstAnswerStr = JSON.stringify(answerValues[0])
    const allSame = answerValues.every(v => JSON.stringify(v) === firstAnswerStr)
    if (allSame) {
      flags.push('IDENTICAL_ANSWERS')
    }
  }

  // ─── Проверка 5: Очень новый аккаунт ───────────────────
  // Аккаунт создан менее 24 часов назад
  if (user) {
    const accountAgeMs = Date.now() - user.createdAt.getTime()
    const oneDayMs = 24 * 60 * 60 * 1000
    if (accountAgeMs < oneDayMs) {
      flags.push('NEW_ACCOUNT')
    }
  }

  return {
    isValid: flags.length === 0,
    flags,
  }
}
```

---

## 2.3 — Лента опросов для респондента

Создай файл `lib/survey-feed.ts`:

```typescript
import { prisma } from '@/lib/prisma'

// Возраст в годах из даты рождения
function getAge(birthDate?: Date | null): number {
  if (!birthDate) return 0
  const diffMs = Date.now() - birthDate.getTime()
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
}

export async function getSurveyFeed(userId: string) {
  // Загружаем профиль респондента для таргетинга
  const profile = await prisma.respondentProfile.findUnique({
    where: { userId },
  })

  // ID опросов которые пользователь уже проходил (или проходит)
  const existingSessions = await prisma.surveySession.findMany({
    where:  { userId },
    select: { surveyId: true },
  })
  const excludeIds = existingSessions.map(s => s.surveyId)

  const userAge = getAge(profile?.birthDate)
  const now = new Date()

  const surveys = await prisma.survey.findMany({
    where: {
      status: 'ACTIVE',

      // Исключить уже пройденные
      id: { notIn: excludeIds.length > 0 ? excludeIds : [''] },

      // Опрос ещё идёт
      OR: [
        { endsAt: null },
        { endsAt: { gt: now } },
      ],

      // Опрос уже начался
      AND: [
        {
          OR: [
            { startsAt: null },
            { startsAt: { lte: now } },
          ],
        },

        // Таргетинг по полу
        {
          OR: [
            { targetGender: 'any' },
            { targetGender: null },
            { targetGender: profile?.gender ?? 'any' },
          ],
        },

        // Таргетинг по минимальному возрасту
        {
          OR: [
            { targetAgeMin: null },
            { targetAgeMin: { lte: userAge } },
          ],
        },

        // Таргетинг по максимальному возрасту
        {
          OR: [
            { targetAgeMax: null },
            { targetAgeMax: { gte: userAge } },
          ],
        },

        // Таргетинг по городу
        {
          OR: [
            { targetCities: { isEmpty: true } },
            profile?.city
              ? { targetCities: { has: profile.city } }
              : {},
          ],
        },
      ],
    },

    include: {
      questions: { select: { id: true } },  // только для подсчёта
      _count:    { select: { sessions: { where: { isValid: true, status: 'COMPLETED' } } } },
    },

    orderBy: [
      { reward: 'desc' },     // сначала самые дорогие
      { createdAt: 'desc' },  // потом новые
    ],

    take: 20,
  })

  return surveys
}

// Незавершённые сессии пользователя (опросы в работе)
export async function getInProgressSurveys(userId: string) {
  return prisma.surveySession.findMany({
    where:   { userId, status: 'IN_PROGRESS' },
    include: { survey: { include: { questions: { select: { id: true } } } } },
    orderBy: { startedAt: 'desc' },
  })
}

// Завершённые сессии пользователя
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

---

## 3.1 — Все actions для опросов

Создай файл `actions/surveys.ts`:

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { requireRole, requireAuth } from '@/lib/auth-utils'
import { checkFraud } from '@/lib/antifrod'
import { headers } from 'next/headers'
import type { SurveyDraft } from '@/types/survey'
import { revalidatePath } from 'next/cache'

// ══════════════════════════════════════════════════════════
// ЗАКАЗЧИК — СОЗДАНИЕ ОПРОСА
// ══════════════════════════════════════════════════════════

export async function createSurveyAction(draft: SurveyDraft) {
  const session = await requireRole('CLIENT')

  // Валидация
  if (!draft.title.trim()) return { error: 'Введите название опроса' }
  if (draft.questions.length === 0) return { error: 'Добавьте хотя бы один вопрос' }
  if (draft.maxResponses < 10) return { error: 'Минимум 10 респондентов' }
  if (draft.reward < 20) return { error: 'Минимальное вознаграждение — 20 ₽' }

  // Рассчитать бюджет (вознаграждения + 15% комиссия платформы)
  const rewardTotal = draft.maxResponses * draft.reward
  const commission  = rewardTotal * 0.15
  const budget      = rewardTotal + commission

  // Проверить баланс заказчика
  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  })
  if (!wallet) return { error: 'Кошелёк не найден' }
  if (Number(wallet.balance) < budget) {
    return { error: `Недостаточно средств. Нужно ${budget.toFixed(0)} ₽, доступно ${Number(wallet.balance).toFixed(0)} ₽` }
  }

  // Создать опрос и вопросы в транзакции
  const survey = await prisma.$transaction(async (tx) => {
    // Создаём опрос
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

    // Создаём вопросы
    await tx.surveyQuestion.createMany({
      data: draft.questions.map((q, index) => ({
        surveyId:    newSurvey.id,
        order:       index,
        type:        q.type,
        title:       q.title,
        description: q.description || null,
        required:    q.required,
        mediaUrl:    q.mediaUrl,
        options:     q.type === 'MATRIX'
          ? { rows: q.matrixRows, cols: q.matrixCols }
          : q.options.length > 0 ? q.options : null,
        settings:    Object.keys(q.settings).length > 0 ? q.settings : null,
        logic:       q.logic.length > 0 ? q.logic : null,
      })),
    })

    // Списываем бюджет с кошелька
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance:    { decrement: budget },
        totalSpent: { increment: budget },
      },
    })

    // Записываем транзакцию
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
// РЕСПОНДЕНТ — УПРАВЛЕНИЕ ПРОХОЖДЕНИЕМ
// ══════════════════════════════════════════════════════════

export async function startSurveyAction(surveyId: string) {
  const session = await requireRole('RESPONDENT')

  // Проверяем что опрос существует и активен
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
  })
  if (!survey) return { error: 'Опрос не найден' }
  if (survey.status !== 'ACTIVE') return { error: 'Опрос недоступен' }

  // Проверяем что не проходил
  const existing = await prisma.surveySession.findUnique({
    where: {
      surveyId_userId: { surveyId, userId: session.user.id },
    },
  })

  if (existing) {
    if (existing.status === 'IN_PROGRESS') {
      // Продолжить незавершённую сессию
      return { success: true, sessionId: existing.id, isResume: true }
    }
    return { error: 'Вы уже проходили этот опрос' }
  }

  // Создаём новую сессию
  const surveySession = await prisma.surveySession.create({
    data: {
      surveyId,
      userId: session.user.id,
      status: 'IN_PROGRESS',
    },
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
  const hdrs = await headers()

  const ipAddress = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const userAgent = hdrs.get('user-agent') ?? 'unknown'

  // Загружаем опрос с вопросами
  const survey = await prisma.survey.findUnique({
    where:   { id: params.surveyId },
    include: { questions: true },
  })
  if (!survey) return { error: 'Опрос не найден' }

  // Запускаем антифрод проверку
  const fraud = await checkFraud({
    userId:    session.user.id,
    surveyId:  params.surveyId,
    timeSpent: params.timeSpent,
    answers:   params.answers,
    ipAddress,
    userAgent,
    deviceId:  params.deviceId,
  })

  // Всё сохраняем в одной транзакции
  await prisma.$transaction(async (tx) => {
    // Обновляем сессию
    const updatedSession = await tx.surveySession.update({
      where: { id: params.sessionId },
      data: {
        status:      fraud.isValid ? 'COMPLETED' : 'REJECTED',
        completedAt: new Date(),
        timeSpent:   params.timeSpent,
        ipAddress,
        userAgent,
        deviceId:    params.deviceId,
        isValid:     fraud.isValid,
        fraudFlags:  fraud.flags,
      },
    })

    // Сохраняем ответы (только на вопросы которые есть в опросе)
    const validQuestionIds = new Set(survey.questions.map(q => q.id))
    const answersToSave = Object.entries(params.answers)
      .filter(([questionId]) => validQuestionIds.has(questionId))
      .map(([questionId, value]) => ({
        sessionId:  updatedSession.id,
        questionId,
        value,
      }))

    if (answersToSave.length > 0) {
      await tx.surveyAnswer.createMany({ data: answersToSave })
    }

    // Начисляем вознаграждение только если прошёл антифрод
    if (fraud.isValid && survey.reward) {
      const wallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
      })

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance:     { increment: survey.reward },
            totalEarned: { increment: survey.reward },
          },
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

  // Проверяем достигнут ли maxResponses — закрываем опрос
  if (fraud.isValid && survey.maxResponses) {
    const validCount = await prisma.surveySession.count({
      where: { surveyId: params.surveyId, isValid: true, status: 'COMPLETED' },
    })
    if (validCount >= survey.maxResponses) {
      await prisma.survey.update({
        where: { id: params.surveyId },
        data:  { status: 'COMPLETED' },
      })
    }
  }

  revalidatePath('/respondent/surveys')
  revalidatePath('/respondent/wallet')

  return {
    success:  true,
    rewarded: fraud.isValid,
    amount:   fraud.isValid ? Number(survey.reward) : 0,
  }
}

// ══════════════════════════════════════════════════════════
// АДМИНИСТРАТОР — МОДЕРАЦИЯ
// ══════════════════════════════════════════════════════════

export async function approveSurveyAction(surveyId: string) {
  await requireRole('ADMIN')

  await prisma.survey.update({
    where: { id: surveyId },
    data:  { status: 'ACTIVE' },
  })

  revalidatePath('/admin/moderation')
  return { success: true }
}

export async function rejectSurveyAction(surveyId: string, reason: string) {
  await requireRole('ADMIN')

  if (!reason.trim()) return { error: 'Укажите причину отклонения' }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
  })
  if (!survey) return { error: 'Опрос не найден' }

  await prisma.$transaction(async (tx) => {
    // Отклоняем опрос
    await tx.survey.update({
      where: { id: surveyId },
      data:  { status: 'REJECTED', moderationNote: reason.trim() },
    })

    // Возвращаем деньги заказчику
    if (survey.budget && survey.creatorId) {
      const wallet = await tx.wallet.findUnique({
        where: { userId: survey.creatorId },
      })

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance:    { increment: survey.budget },
            totalSpent: { decrement: survey.budget },
          },
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

// Пауза / возобновление опроса заказчиком
export async function toggleSurveyPauseAction(surveyId: string) {
  const session = await requireRole('CLIENT')

  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, creatorId: session.user.id },
  })
  if (!survey) return { error: 'Опрос не найден' }

  const newStatus = survey.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'

  await prisma.survey.update({
    where: { id: surveyId },
    data:  { status: newStatus },
  })

  revalidatePath('/client/surveys')
  return { success: true, newStatus }
}
```

---

# ЧАСТЬ 4 — КОНСТРУКТОР ОПРОСОВ

---

## 4.1 — Главный компонент SurveyBuilder

Файл: `components/survey-builder/SurveyBuilder.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SurveyDraft, EMPTY_DRAFT } from '@/types/survey'
import { createSurveyAction } from '@/actions/surveys'
import StepBasic     from './StepBasic'
import StepQuestions from './StepQuestions'
import StepAudience  from './StepAudience'
import StepBudget    from './StepBudget'

const STEPS = [
  { number: 1, label: 'Основное'  },
  { number: 2, label: 'Вопросы'   },
  { number: 3, label: 'Аудитория' },
  { number: 4, label: 'Бюджет'    },
]

export default function SurveyBuilder() {
  const router = useRouter()
  const [step, setStep] = useState<1|2|3|4>(1)
  const [draft, setDraft] = useState<SurveyDraft>(EMPTY_DRAFT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateDraft(updates: Partial<SurveyDraft>) {
    setDraft(prev => ({ ...prev, ...updates }))
  }

  // Валидация текущего шага перед переходом
  function validateStep(): string | null {
    switch (step) {
      case 1:
        if (!draft.title.trim())    return 'Введите название опроса'
        if (!draft.category)        return 'Выберите категорию'
        return null
      case 2:
        if (draft.questions.length === 0) return 'Добавьте хотя бы один вопрос'
        for (const q of draft.questions) {
          if (!q.title.trim()) return 'Заполните текст всех вопросов'
          if (['SINGLE_CHOICE','MULTIPLE_CHOICE','RANKING'].includes(q.type) && q.options.length < 2) {
            return 'Добавьте минимум 2 варианта ответа'
          }
        }
        return null
      case 3:
        return null // аудитория необязательна
      case 4:
        if (draft.maxResponses < 10)  return 'Минимум 10 респондентов'
        if (draft.reward < 20)        return 'Минимальное вознаграждение — 20 ₽'
        if (!draft.endsAt)            return 'Укажите дату окончания'
        return null
      default:
        return null
    }
  }

  function handleNext() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    setStep(prev => Math.min(prev + 1, 4) as 1|2|3|4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setError(null)
    setStep(prev => Math.max(prev - 1, 1) as 1|2|3|4)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    const err = validateStep()
    if (err) { setError(err); return }

    setIsSubmitting(true)
    setError(null)

    const result = await createSurveyAction(draft)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    router.push(`/client/surveys/${result.surveyId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center flex-1 last:flex-none">
            {/* Круг с номером */}
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center
              text-sm font-bold flex-shrink-0 transition-all
              ${step === s.number
                ? 'bg-brand text-white'
                : step > s.number
                  ? 'bg-brand/20 text-brand'
                  : 'bg-dash-border text-dash-muted'}
            `}>
              {step > s.number ? '✓' : s.number}
            </div>
            {/* Лейбл */}
            <span className={`ml-2 text-sm font-medium ${
              step >= s.number ? 'text-dash-heading' : 'text-dash-muted'
            }`}>
              {s.label}
            </span>
            {/* Линия */}
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-4 ${step > s.number ? 'bg-brand/30' : 'bg-dash-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Контент шага */}
      <div className="bg-dash-card border border-dash-border rounded-2xl p-8 mb-6">
        {step === 1 && <StepBasic     draft={draft} onChange={updateDraft} />}
        {step === 2 && <StepQuestions draft={draft} onChange={updateDraft} />}
        {step === 3 && <StepAudience  draft={draft} onChange={updateDraft} />}
        {step === 4 && <StepBudget    draft={draft} onChange={updateDraft} />}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500
                        rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Навигация */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="px-6 py-3 rounded-xl border border-dash-border
                     text-dash-body hover:border-dash-muted
                     disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Назад
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="px-7 py-3 rounded-xl bg-brand text-white font-semibold
                       hover:bg-brand-dark transition-all"
          >
            Далее →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-7 py-3 rounded-xl bg-brand text-white font-semibold
                       hover:bg-brand-dark disabled:opacity-50
                       disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Публикация...' : 'Опубликовать опрос'}
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## 4.2 — StepQuestions — редактор вопросов

Это самый сложный компонент. Файл: `components/survey-builder/StepQuestions.tsx`

```typescript
'use client'
import { useState } from 'react'
import {
  DndContext, closestCenter, DragEndEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SurveyDraft, Question, QuestionType, QUESTION_TYPE_LABELS, createEmptyQuestion } from '@/types/survey'

// ─── Компонент одной карточки вопроса ────────────────────

function QuestionCard({
  question,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  question:   Question
  index:      number
  isExpanded: boolean
  onToggle:   () => void
  onUpdate:   (updates: Partial<Question>) => void
  onDelete:   () => void
}) {
  // Подключаем sortable
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-dash-card border border-dash-border rounded-xl overflow-hidden"
    >
      {/* Заголовок карточки */}
      <div
        className="flex items-center gap-3 p-5 cursor-pointer hover:bg-dash-bg transition-colors"
        onClick={onToggle}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-dash-muted
                     hover:text-dash-body transition-colors select-none p-1"
          onClick={e => e.stopPropagation()}
        >
          ⠿
        </div>

        {/* Номер */}
        <span className="w-7 h-7 rounded-lg bg-dash-bg border border-dash-border
                         flex items-center justify-center text-xs font-bold
                         text-dash-muted flex-shrink-0">
          {index + 1}
        </span>

        {/* Тип и заголовок */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-brand uppercase tracking-wider">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          <p className="text-sm text-dash-heading font-medium truncate mt-0.5">
            {question.title || 'Без названия'}
          </p>
        </div>

        {/* Обязательный */}
        {question.required && (
          <span className="text-xs text-red-400 flex-shrink-0">обязательный</span>
        )}

        {/* Удалить */}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="p-1.5 rounded-lg text-dash-muted hover:text-red-500
                     hover:bg-red-500/10 transition-all flex-shrink-0"
        >
          ✕
        </button>

        {/* Стрелка раскрытия */}
        <span className={`text-dash-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </div>

      {/* Редактор (раскрывается) */}
      {isExpanded && (
        <div className="border-t border-dash-border p-5 space-y-4">
          {/* Текст вопроса */}
          <div>
            <label className="block text-xs font-semibold text-dash-muted uppercase tracking-wider mb-1.5">
              Текст вопроса *
            </label>
            <input
              type="text"
              value={question.title}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="Введите вопрос..."
              className="w-full bg-dash-bg border border-dash-border rounded-lg px-4 py-2.5
                         text-sm text-dash-heading placeholder:text-dash-muted
                         focus:border-brand/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-semibold text-dash-muted uppercase tracking-wider mb-1.5">
              Описание (необязательно)
            </label>
            <input
              type="text"
              value={question.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Дополнительное пояснение..."
              className="w-full bg-dash-bg border border-dash-border rounded-lg px-4 py-2.5
                         text-sm text-dash-heading placeholder:text-dash-muted
                         focus:border-brand/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Варианты для SINGLE / MULTIPLE / RANKING */}
          {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RANKING'].includes(question.type) && (
            <div>
              <label className="block text-xs font-semibold text-dash-muted uppercase tracking-wider mb-2">
                Варианты ответов
              </label>
              <div className="space-y-2">
                {question.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-dash-muted w-5 text-right">{i + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const newOptions = [...question.options]
                        newOptions[i] = e.target.value
                        onUpdate({ options: newOptions })
                      }}
                      placeholder={`Вариант ${i + 1}`}
                      className="flex-1 bg-dash-bg border border-dash-border rounded-lg px-3 py-2
                                 text-sm text-dash-heading placeholder:text-dash-muted
                                 focus:border-brand/50 focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => onUpdate({ options: question.options.filter((_, idx) => idx !== i) })}
                      className="text-dash-muted hover:text-red-500 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => onUpdate({ options: [...question.options, ''] })}
                  className="text-sm text-brand hover:text-brand-dark transition-colors mt-1"
                >
                  + Добавить вариант
                </button>
              </div>
            </div>
          )}

          {/* Настройки шкалы */}
          {question.type === 'SCALE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-dash-muted mb-1.5">Минимум</label>
                <input
                  type="number"
                  value={(question.settings as any).min ?? 1}
                  onChange={e => onUpdate({ settings: { ...question.settings, min: Number(e.target.value) } })}
                  className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-sm
                             text-dash-heading focus:border-brand/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-dash-muted mb-1.5">Максимум</label>
                <input
                  type="number"
                  value={(question.settings as any).max ?? 10}
                  onChange={e => onUpdate({ settings: { ...question.settings, max: Number(e.target.value) } })}
                  className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-sm
                             text-dash-heading focus:border-brand/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Строки и столбцы матрицы */}
          {question.type === 'MATRIX' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-dash-muted uppercase tracking-wider mb-2">
                  Строки
                </label>
                {question.matrixRows.map((row, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={row}
                      onChange={e => {
                        const rows = [...question.matrixRows]
                        rows[i] = e.target.value
                        onUpdate({ matrixRows: rows })
                      }}
                      className="flex-1 bg-dash-bg border border-dash-border rounded-lg px-3 py-2
                                 text-sm text-dash-heading focus:border-brand/50 focus:outline-none"
                    />
                    <button onClick={() => onUpdate({ matrixRows: question.matrixRows.filter((_, idx) => idx !== i) })}
                            className="text-dash-muted hover:text-red-500 text-sm">✕</button>
                  </div>
                ))}
                <button onClick={() => onUpdate({ matrixRows: [...question.matrixRows, ''] })}
                        className="text-sm text-brand hover:text-brand-dark">+ Строка</button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dash-muted uppercase tracking-wider mb-2">
                  Столбцы
                </label>
                {question.matrixCols.map((col, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={col}
                      onChange={e => {
                        const cols = [...question.matrixCols]
                        cols[i] = e.target.value
                        onUpdate({ matrixCols: cols })
                      }}
                      className="flex-1 bg-dash-bg border border-dash-border rounded-lg px-3 py-2
                                 text-sm text-dash-heading focus:border-brand/50 focus:outline-none"
                    />
                    <button onClick={() => onUpdate({ matrixCols: question.matrixCols.filter((_, idx) => idx !== i) })}
                            className="text-dash-muted hover:text-red-500 text-sm">✕</button>
                  </div>
                ))}
                <button onClick={() => onUpdate({ matrixCols: [...question.matrixCols, ''] })}
                        className="text-sm text-brand hover:text-brand-dark">+ Столбец</button>
              </div>
            </div>
          )}

          {/* Обязательность */}
          <div className="flex items-center gap-3 pt-2 border-t border-dash-border">
            <button
              onClick={() => onUpdate({ required: !question.required })}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                question.required ? 'bg-brand' : 'bg-dash-border'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                question.required ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-dash-body">Обязательный вопрос</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Основной компонент StepQuestions ────────────────────

export default function StepQuestions({
  draft,
  onChange,
}: {
  draft:    SurveyDraft
  onChange: (updates: Partial<SurveyDraft>) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTypeMenu, setShowTypeMenu] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = draft.questions.findIndex(q => q.id === active.id)
    const newIndex = draft.questions.findIndex(q => q.id === over.id)
    onChange({ questions: arrayMove(draft.questions, oldIndex, newIndex) })
  }

  function addQuestion(type: QuestionType) {
    const newQ = createEmptyQuestion(type)
    onChange({ questions: [...draft.questions, newQ] })
    setExpandedId(newQ.id)
    setShowTypeMenu(false)
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    onChange({
      questions: draft.questions.map(q => q.id === id ? { ...q, ...updates } : q),
    })
  }

  function deleteQuestion(id: string) {
    onChange({ questions: draft.questions.filter(q => q.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-dash-heading mb-1">
        Вопросы
      </h2>
      <p className="text-sm text-dash-muted mb-6">
        Добавьте вопросы и настройте варианты ответов. Перетащите для изменения порядка.
      </p>

      {/* Список вопросов с DnD */}
      {draft.questions.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draft.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3 mb-4">
              {draft.questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  isExpanded={expandedId === q.id}
                  onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  onUpdate={updates => updateQuestion(q.id, updates)}
                  onDelete={() => deleteQuestion(q.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="border-2 border-dashed border-dash-border rounded-xl p-12 text-center mb-4">
          <p className="text-dash-muted text-sm">Добавьте первый вопрос</p>
        </div>
      )}

      {/* Кнопка добавить вопрос */}
      <div className="relative">
        <button
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          className="w-full py-3 border-2 border-dashed border-dash-border rounded-xl
                     text-sm font-medium text-dash-muted hover:border-brand/40
                     hover:text-brand hover:bg-brand/5 transition-all"
        >
          + Добавить вопрос
        </button>

        {showTypeMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-dash-card
                          border border-dash-border rounded-xl shadow-card-lg z-10 overflow-hidden">
            {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                className="w-full text-left px-4 py-3 text-sm text-dash-body
                           hover:bg-dash-bg hover:text-brand transition-colors
                           border-b border-dash-border last:border-0"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

# ЧАСТЬ 5 — ПЛЕЕР ОПРОСА

---

## 5.1 — Главный компонент SurveyPlayer

Файл: `components/survey-player/SurveyPlayer.tsx`

```typescript
'use client'
import { useState, useCallback } from 'react'
import { startSurveyAction, completeSurveyAction } from '@/actions/surveys'
import QuestionRenderer from './QuestionRenderer'
import SurveyComplete   from './SurveyComplete'

// Логика видимости вопросов на основе правил
function getVisibleQuestions(questions: any[], answers: Record<string, any>) {
  return questions.filter(question => {
    if (!question.logic || question.logic.length === 0) return true

    return question.logic.every((rule: any) => {
      const answer = answers[rule.ifQuestionId]
      const answerStr = Array.isArray(answer)
        ? answer.join(',')
        : String(answer ?? '')

      let matches = false
      switch (rule.operator) {
        case 'equals':     matches = answerStr === rule.value; break
        case 'not_equals': matches = answerStr !== rule.value; break
        case 'contains':   matches = answerStr.includes(rule.value); break
      }

      return rule.action === 'show' ? matches : !matches
    })
  })
}

// Генерация Device ID (упрощённый fingerprint)
function getDeviceId(): string {
  const key = 'opinflow_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `${navigator.userAgent}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`
    id = btoa(id).slice(0, 32)
    localStorage.setItem(key, id)
  }
  return id
}

type Props = {
  survey: {
    id:        string
    title:     string
    reward:    number | null
    questions: any[]
  }
}

type PlayerState = 'LOADING' | 'PLAYING' | 'SUBMITTING' | 'COMPLETE' | 'ERROR'

export default function SurveyPlayer({ survey }: Props) {
  const [state, setState]           = useState<PlayerState>('LOADING')
  const [sessionId, setSessionId]   = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]       = useState<Record<string, any>>({})
  const [startedAt]                 = useState(() => Date.now())
  const [result, setResult]         = useState<{ rewarded: boolean; amount: number } | null>(null)
  const [error, setError]           = useState<string | null>(null)

  // Инициализация — создать или продолжить сессию
  const initSession = useCallback(async () => {
    const res = await startSurveyAction(survey.id)
    if (res.error) { setError(res.error); setState('ERROR'); return }
    setSessionId(res.sessionId!)
    setState('PLAYING')
  }, [survey.id])

  // Запустить при первом рендере
  useState(() => { initSession() })

  // Текущие видимые вопросы
  const visibleQuestions = getVisibleQuestions(survey.questions, answers)
  const currentQuestion  = visibleQuestions[currentIndex]
  const isLastQuestion   = currentIndex === visibleQuestions.length - 1
  const progress         = visibleQuestions.length > 0
    ? (currentIndex / visibleQuestions.length) * 100
    : 0

  function handleAnswer(value: any) {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
  }

  function handleNext() {
    // Проверить обязательный вопрос
    if (currentQuestion.required && answers[currentQuestion.id] === undefined) {
      setError('Пожалуйста, ответьте на вопрос')
      return
    }
    setError(null)

    if (isLastQuestion) {
      handleComplete()
    } else {
      setCurrentIndex(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleBack() {
    setError(null)
    setCurrentIndex(prev => Math.max(prev - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleComplete() {
    if (!sessionId) return
    setState('SUBMITTING')

    const timeSpent = Math.floor((Date.now() - startedAt) / 1000)
    const deviceId  = getDeviceId()

    const res = await completeSurveyAction({
      surveyId: survey.id,
      sessionId,
      answers,
      timeSpent,
      deviceId,
    })

    if (res.error) {
      setError(res.error)
      setState('PLAYING')
      return
    }

    setResult({ rewarded: res.rewarded!, amount: res.amount! })
    setState('COMPLETE')
  }

  // Состояния
  if (state === 'LOADING') {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'ERROR' && !sessionId) {
    return (
      <div className="text-center py-32">
        <p className="text-dash-muted text-lg">{error}</p>
      </div>
    )
  }

  if (state === 'COMPLETE' && result) {
    return <SurveyComplete rewarded={result.rewarded} amount={result.amount} />
  }

  if (!currentQuestion) return null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Прогресс */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-dash-muted mb-2">
          <span>Вопрос {currentIndex + 1} из {visibleQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-dash-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Вопрос */}
      <div className="bg-dash-card border border-dash-border rounded-2xl p-8 mb-6">
        {/* Медиа */}
        {currentQuestion.mediaUrl && (
          <img
            src={currentQuestion.mediaUrl}
            alt=""
            className="w-full rounded-xl mb-6 object-cover max-h-64"
          />
        )}

        {/* Текст вопроса */}
        <div className="mb-6">
          <div className="flex items-start gap-2">
            <h3 className="text-lg font-semibold text-dash-heading leading-snug">
              {currentQuestion.title}
            </h3>
            {currentQuestion.required && (
              <span className="text-red-500 mt-1 flex-shrink-0">*</span>
            )}
          </div>
          {currentQuestion.description && (
            <p className="text-sm text-dash-muted mt-2">{currentQuestion.description}</p>
          )}
        </div>

        {/* Ответ */}
        <QuestionRenderer
          question={currentQuestion}
          value={answers[currentQuestion.id]}
          onChange={handleAnswer}
        />
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500
                        rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Навигация */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="px-6 py-3 rounded-xl border border-dash-border text-dash-body
                     hover:border-dash-muted disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all"
        >
          ← Назад
        </button>

        <button
          onClick={handleNext}
          disabled={state === 'SUBMITTING'}
          className="px-7 py-3 rounded-xl bg-brand text-white font-semibold
                     hover:bg-brand-dark disabled:opacity-50 transition-all"
        >
          {state === 'SUBMITTING'
            ? 'Отправка...'
            : isLastQuestion ? 'Завершить' : 'Далее →'}
        </button>
      </div>
    </div>
  )
}
```

---

# ЧАСТЬ 6 — ТЕСТИРОВАНИЕ

---

## 6.1 — Полный сценарий тестирования

Тестируй строго в таком порядке. Каждый шаг зависит от предыдущего.

### Тест 1 — Создание опроса (роль CLIENT)

```
1. Войти: client@test.local / Test12345!
2. Открыть /client/surveys/create
3. Шаг 1:
   - Ввести название "Тестовый опрос"
   - Выбрать категорию
   - Нажать "Далее" без названия — ожидаем ошибку валидации ✓
   - Заполнить и перейти дальше ✓

4. Шаг 2 — добавить по одному вопросу каждого типа:
   - Одиночный выбор с 3 вариантами
   - Множественный выбор с 3 вариантами
   - Шкала (1-10)
   - Матрица (2 строки × 3 столбца)
   - Ранжирование с 4 элементами
   - Открытый ответ
   - Перетащить вопросы — порядок должен меняться ✓
   - Попробовать перейти без вопросов — ошибка ✓

5. Шаг 3 — таргетинг:
   - Пол: Все
   - Возраст: 18-45
   - Города: Москва
   - Перейти дальше ✓

6. Шаг 4 — бюджет:
   - 20 респондентов × 50 ₽ = 1000 ₽ + 150 ₽ комиссия = 1150 ₽
   - Убедиться что расчёт правильный ✓
   - Нажать "Опубликовать" ✓

7. Проверить в Prisma Studio:
   - surveys → статус PENDING_MODERATION ✓
   - survey_questions → 6 записей с правильными данными ✓
   - wallets → balance уменьшился на 1150 ₽ ✓
   - transactions → запись типа SPENDING ✓
```

### Тест 2 — Модерация (роль ADMIN)

```
1. Войти: admin@test.local / Test12345!
2. Открыть /admin/moderation
3. Опрос из Теста 1 виден в списке ✓
4. Нажать "Просмотреть" — открывается превью со всеми вопросами ✓
5. Нажать "Одобрить"
6. Проверить: статус опроса → ACTIVE ✓
7. Создать ещё один опрос (повтори Тест 1)
8. Нажать "Отклонить" → ввести причину → подтвердить
9. Проверить:
   - Статус опроса → REJECTED ✓
   - moderationNote заполнен ✓
   - Баланс заказчика вернулся (wallets) ✓
   - Транзакция типа REFUND ✓
```

### Тест 3 — Прохождение опроса (роль RESPONDENT)

```
1. Войти: respondent@test.local / Test12345!
2. Открыть /respondent/surveys
3. Одобренный опрос виден в ленте ✓
4. Карточка показывает: название, вознаграждение, время ✓
5. Нажать "Начать"
6. Прохождение:
   - Первый вопрос отображается ✓
   - Ответить и нажать "Далее" ✓
   - Нажать "Назад" — вернуться к предыдущему вопросу ✓
   - Прогресс-бар движется ✓
   - На последнем вопросе кнопка "Завершить" ✓
7. После завершения:
   - Экран "Опрос завершён!" ✓
   - Показана сумма начисления ✓
8. Проверить:
   - /respondent/wallet → баланс увеличился ✓
   - Prisma Studio → survey_sessions → статус COMPLETED, isValid true ✓
   - Prisma Studio → survey_answers → все ответы сохранены ✓
   - transactions → запись типа EARNING ✓
9. Открыть /respondent/surveys — опрос исчез из ленты ✓
10. Попробовать зайти снова на /respondent/survey/[id]:
    - Должна быть ошибка "Вы уже проходили этот опрос" ✓
```

### Тест 4 — Антифрод

```
1. Создать нового тестового пользователя (respondent2@test.local)
2. Войти как этот пользователь
3. Начать прохождение опроса
4. Ответить очень быстро (буквально за 10 секунд)
5. Завершить
6. Проверить в Prisma Studio → survey_sessions:
   - fraudFlags содержит "TOO_FAST" ✓
   - isValid = false ✓
   - status = REJECTED ✓
7. Проверить → transactions: начисления НЕТ ✓
8. На экране завершения: нет суммы, просто "Ответы приняты" ✓
```

---

## 6.2 — Частые ошибки и решения

### Ошибка: "Cannot find module @dnd-kit/..."
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Ошибка: Prisma ругается на новые поля
```bash
npx prisma generate
npx prisma db push
```

### Ошибка: Опрос не появляется в ленте
Проверь в Prisma Studio:
- `surveys.status` = 'ACTIVE' (не PENDING_MODERATION)
- `surveys.endsAt` > текущей даты
- Таргетинг совпадает с профилем респондента (гендер, возраст, город)

### Ошибка: Антифрод блокирует при тестировании
Уменьши minTime в `lib/antifrod.ts` для тестов:
```typescript
const minTimeSeconds = questionCount * 2 // вместо 8
```
Не забудь вернуть обратно перед продакшном.

### Ошибка: Медиа не загружается
- Проверь bucket 'opinflow-media' существует в Supabase Storage
- Проверь что bucket публичный
- Проверь SUPABASE_SERVICE_ROLE_KEY в .env
- Проверь NEXT_PUBLIC_SUPABASE_URL в .env

### Ошибка: TypeScript ошибки при build
```bash
npm run build 2>&1 | head -50
# Читай первые ошибки — обычно это импорты или несоответствие типов
```

---

# ЧАСТЬ 7 — ДЕПЛОЙ

---

## 7.1 — Подготовка к деплою

```bash
# Проверь TypeScript
npm run build

# Проверь lint
npm run lint

# Убедись что нет незакоммиченных изменений
git status
```

Исправь все ошибки до деплоя.

## 7.2 — Деплой

```bash
git add .
git commit -m "feat: этап 3 — конструктор, лента, прохождение, антифрод, начисления"
git push origin main
# Vercel задеплоит автоматически
```

## 7.3 — Проверка переменных окружения на Vercel

Vercel Dashboard → Settings → Environment Variables.
Убедись что все есть, особенно новые:
```
NEXT_PUBLIC_SUPABASE_URL       ✅
NEXT_PUBLIC_SUPABASE_ANON_KEY  ✅
SUPABASE_SERVICE_ROLE_KEY      ✅
```

## 7.4 — Финальная проверка на живом сайте

После деплоя пройди все 4 теста из Части 6 на живом сайте.
Особенно важно проверить загрузку медиафайлов — на Vercel это работает иначе чем локально.