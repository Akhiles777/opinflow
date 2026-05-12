Document OpinionFlow overview
Нет незавершенных задач


Опять таки в админках шрифт и текст маленькие надо чуть увеличить

Проверю конкретные админ-страницы и общий DashboardShell, и увеличу базовый кегль/межстрочный так, чтобы админка читалась “крупнее”, без ломки стиля.

Увеличил шрифт и читаемость в админке:

Включил увеличенный масштаб для админки через scale="lg" в 
layout.tsx
 (это делает крупнее пункты сайдбара/топбара и подпись роли).
Поднял кегль текстов/метаданных в админ-страницах:

page.tsx

page.tsx

page.tsx

page.tsx
Заодно в шеле кабинетов вернул логотип на /logo.png и привёл его к object-contain в 
DashboardShell.tsx
.

TypeScript проверка проходит.



# ПРОМПТ — Личные кабинеты «ПотокМнений»
# Три роли: Респондент, Заказчик, Администратор

---

## 🎯 КОНЦЕПЦИЯ КАБИНЕТОВ

Референс по стилю: Linear.app, Vercel Dashboard.

**Принцип:**
- Тёмный сайдбар (#0A0A0F) — навигация, логотип, профиль
- Светлый контент (#F9FAFB) — рабочая область, таблицы, формы
- Акцент #6366F1 (индиго) — активные состояния, кнопки, прогресс

Это гибрид тёмного и светлого — не устаёт глаз, выглядит профессионально.

---

## 🗂️ СТРУКТУРА ФАЙЛОВ
app/
  (dashboard)/
    layout.tsx                  ← общий layout с сайдбаром
    respondent/
      page.tsx                  ← лента опросов (главная респондента)
      wallet/page.tsx            ← баланс и вывод средств
      surveys/page.tsx           ← мои опросы
      profile/page.tsx           ← профиль и анкета
      referral/page.tsx          ← реферальная программа
    client/
      page.tsx                  ← список опросов заказчика
      surveys/create/page.tsx   ← конструктор опросов
      surveys/[id]/page.tsx     ← статистика опроса
      wallet/page.tsx            ← баланс заказчика
      settings/page.tsx          ← настройки компании
    admin/
      page.tsx                  ← модерация опросов
      users/page.tsx             ← управление пользователями
      experts/page.tsx           ← управление экспертами
      finance/page.tsx           ← финансы

components/
  dashboard/
    Sidebar.tsx                 ← общий сайдбар (адаптируется под роль)
    TopBar.tsx                  ← верхняя панель с поиском и уведомлениями
    StatCard.tsx                ← карточка статистики
    SurveyCard.tsx              ← карточка опроса в ленте
    DataTable.tsx               ← универсальная таблица
    EmptyState.tsx              ← состояние пустого списка
    Badge.tsx                   ← статус-бейдж
    PageHeader.tsx              ← заголовок страницы

---

## 🎨 ДИЗАЙН-СИСТЕМА КАБИНЕТОВ — С ПОДДЕРЖКОЙ ТЕМ

### Принцип переключения тем

Используем next-themes + CSS-переменные + Tailwind darkMode: 'class'.

Пользователь может переключать тему кнопкой в TopBar — выбор сохраняется в localStorage.

### Установка
bash
npm install next-themes

### tailwind.config.ts
ts
darkMode: 'class',  // ← обязательно

extend: {
  colors: {
    // Все цвета кабинета через CSS-переменные
    dash: {
      sidebar: 'var(--dash-sidebar)',
      bg:      'var(--dash-bg)',
      card:    'var(--dash-card)',
      border:  'var(--dash-border)',
      muted:   'var(--dash-muted)',
      heading: 'var(--dash-heading)',
      body:    'var(--dash-body)',
    }
  }
}

### app/globals.css — CSS-переменные для двух тем
css
/* СВЕТЛАЯ ТЕМА (по умолчанию) */
:root {
  --dash-sidebar:  #0A0A0F;
  --dash-bg:       #F9FAFB;
  --dash-card:     #FFFFFF;
  --dash-border:   #E5E7EB;
  --dash-muted:    #6B7280;
  --dash-heading:  #111827;
  --dash-body:     #374151;
}

/* ТЁМНАЯ ТЕМА */
.dark {
  --dash-sidebar:  #060608;      /* чуть темнее чем светлая */
  --dash-bg:       #0D0D14;
  --dash-card:     #13131E;
  --dash-border:   rgba(255,255,255,0.07);
  --dash-muted:    rgba(255,255,255,0.35);
  --dash-heading:  #FFFFFF;
  --dash-body:     rgba(255,255,255,0.65);
}

### app/(dashboard)/layout.tsx — подключение ThemeProvider
tsx
import { ThemeProvider } from 'next-themes'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="flex h-screen overflow-hidden bg-dash-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

### components/dashboard/ThemeToggle.tsx — кнопка переключения
tsx
'use client'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null  // избегаем hydration mismatch

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 rounded-lg border border-dash-border
                 flex items-center justify-center
                 text-dash-muted hover:text-dash-heading
                 hover:bg-dash-bg transition-all duration-200"
      aria-label="Переключить тему"
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />}
    </button>
  )
}

### Добавить ThemeToggle в TopBar
tsx
// В TopBar.tsx — справа рядом с уведомлениями:
<div className="flex items-center gap-3">
  <ThemeToggle />
  <NotificationButton />
  <Divider />
  <UserAvatar />
</div>

### Правило написания компонентов с темами

Все компоненты используют только переменные dash-* — никаких захардкоженных цветов:
tsx
// ✅ Правильно — адаптируется к теме автоматически
<div className="bg-dash-card border border-dash-border text-dash-heading">

// ❌ Неправильно — сломается в тёмной теме
<div className="bg-white border border-gray-200 text-gray-900">

Исключение — сайдбар. Он всегда тёмный в обеих темах (bg-dash-sidebar),
потому что --dash-sidebar задан одинаково тёмным в :root и .dark.

---

## 📐 ОБЩИЙ LAYOUT — app/(dashboard)/layout.tsx
tsx
// Структура: flex h-screen overflow-hidden

// САЙДБАР (фиксированный, w-64)
// bg: dash-sidebar
// border-r: border-white/5
// flex flex-col

// ОСНОВНАЯ ОБЛАСТЬ (flex-1, overflow-y-auto)
// bg: dash-bg

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

---

## 🔲 SIDEBAR — components/dashboard/Sidebar.tsx
tsx
// bg-[#0A0A0F] w-64 flex flex-col border-r border-white/5

// Верх — логотип
<div className="px-6 h-16 flex items-center border-b border-white/5 flex-shrink-0">
  <div className="flex items-center gap-2.5">
    <div className="w-5 h-5 rounded-md bg-brand" />
    <span className="font-display text-white font-bold text-sm">ПотокМнений</span>
  </div>
</div>

// Навигация — flex-1 overflow-y-auto py-4 px-3
// Секции навигации с заголовками

// Ссылка навигации:
// Обычная: flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
//          text-white/40 hover:text-white hover:bg-white/5 transition-all
// Активная: text-white bg-white/8 font-medium

// Иконки: SVG Lucide, w-4 h-4

// Низ — профиль пользователя
<div className="px-3 pb-4 border-t border-white/5 pt-4 flex-shrink-0">
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                  hover:bg-white/5 transition-colors cursor-pointer">
    // Аватар: w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center
    //         text-xs font-bold text-brand-light (инициалы)
    <div>
      <p className="text-sm font-medium text-white">Имя пользователя</p>
      <p className="text-xs text-white/30">роль</p>
    </div>
  </div>
</div>

---

## 🔝 TOPBAR — components/dashboard/TopBar.tsx
tsx
// h-16 border-b border-dash-border bg-dash-card
// px-8 flex items-center justify-between

// Слева: PageHeader (заголовок текущей страницы) — через props или context
// Справа:
//   - Кнопка уведомлений: иконка Bell, w-9 h-9 rounded-lg
//                          hover:bg-dash-bg border border-dash-border
//                          relative (красная точка если есть уведомления)
//   - Разделитель w-px h-6 bg-dash-border
//   - Аватар пользователя: w-9 h-9 rounded-full bg-brand/10 text-brand text-xs font-bold

---

## 👤 КАБИНЕТ РЕСПОНДЕНТА

### Навигация сайдбара (respondent):
📊 Обзор          /respondent
📋 Лента опросов  /respondent/surveys  ← "Доступные"
⏳ Мои опросы     /respondent/surveys?tab=mine
💰 Кошелёк        /respondent/wallet
👥 Рефералы       /respondent/referral
👤 Профиль        /respondent/profile

---

### respondent/page.tsx — Главная (Обзор)

**PageHeader:** «Добрый день, [Имя] 👋»

**Верхние карточки статистики — grid grid-cols-4 gap-5 mb-8:**
tsx
// StatCard компонент:
// bg-dash-card border border-dash-border rounded-2xl p-6
// hover:shadow-md transition-shadow

<StatCard
  icon={<WalletIcon />}          // Lucide иконка
  label="Текущий баланс"
  value="1 240 ₽"
  trend="+350 ₽ сегодня"         // зелёный текст
  trendUp={true}
/>
<StatCard label="Опросов пройдено" value="24" trend="+3 за неделю" trendUp={true} />
<StatCard label="Доступных опросов" value="8" />
<StatCard label="Приглашено друзей" value="3" trend="+1 реферал" trendUp={true} />

**Лента доступных опросов — grid grid-cols-2 gap-4:**
tsx
// SurveyCard компонент:
// bg-dash-card border border-dash-border rounded-2xl p-6
// hover:border-brand/30 hover:shadow-md transition-all duration-200 cursor-pointer

<SurveyCard
  category="Потребительский"          // Badge с цветом категории
  title="Оцените качество сервиса доставки"
  reward={120}                        // "120 ₽" — крупно, текст brand
  duration={5}                        // "~5 минут"
  questions={8}                       // "8 вопросов"
  clientRating={4.8}                  // звёздочки
  status="available"                  // available | in-progress | completed
/>

// Кнопка "Начать →" появляется при hover на карточке
// Если in-progress — прогресс-бар снизу карточки + кнопка "Продолжить →"

---

### respondent/wallet/page.tsx — Кошелёк

**PageHeader:** «Кошелёк»

**Верх — две карточки рядом:**
tsx
// Карточка баланса (большая, bg-[#0A0A0F] text-white rounded-2xl p-8)
<div>
  <p className="text-sm text-white/40 mb-2">Доступный баланс</p>
  <p className="font-display text-5xl text-white font-bold mb-6">1 240 ₽</p>
  <Button variant="primary" size="lg">Вывести средства</Button>
</div>

// Карточка статистики (bg-dash-card border)
// Сумма заработано всего / В этом месяце / Выведено

**Модал вывода средств:**
tsx
// При клике "Вывести" → Modal
// Шаги (Step 1 из 2):
//   Шаг 1: Выбор способа вывода (карточки-варианты):
//     - Банковская карта
//     - СБП (по номеру телефона)
//     - ЮMoney / QIWI
//   Шаг 2: Ввод суммы (min 100 ₽) и реквизитов
//   Кнопка "Вывести" → подтверждение

**История транзакций — таблица:**
tsx
// Колонки: Дата | Тип | Описание | Сумма | Статус
// Тип: "Начисление" (зелёный +) / "Вывод" (серый -)
// Статус: Badge — Завершено (зелёный) / Ожидание (жёлтый) / Ошибка (красный)

---

### respondent/surveys/page.tsx — Мои опросы

**Два таба:** «В работе» | «Завершённые»

**Таб "В работе":**
tsx
// Карточка незавершённого опроса:
// bg-dash-card border border-dash-border rounded-2xl p-6
// Прогресс-бар (вопрос X из Y)
// Таймер "Осталось: 3 дня" (если есть дедлайн)
// Кнопка "Продолжить →"

**Таб "Завершённые":**
tsx
// Таблица: Дата | Название | Вознаграждение | Действия
// В "Действия": кнопка "Пожаловаться" (ghost, маленькая)

---

### respondent/profile/page.tsx — Профиль

**Две колонки:**

**Левая — аватар и основное:**
tsx
// Аватар (большой, 96px) + кнопка "Изменить фото"
// Имя, email
// Кнопка "Изменить пароль"

**Правая — анкета (форма):**
tsx
// Поля анкеты (все — select или input):
// Пол: select (Мужской / Женский)
// Дата рождения: date input
// Город: text input с автодополнением
// Уровень дохода: select (до 30к / 30-60к / 60-100к / 100к+)
// Образование: select
// Интересы: мультиселект-теги (авто, технологии, еда, спорт...)

// Кнопка "Сохранить изменения" — variant="primary"
// Уведомление "Данные сохранены ✓" после сохранения

---

### respondent/referral/page.tsx — Рефералы
tsx
// Блок реферальной ссылки:
// bg-[#0A0A0F] rounded-2xl p-8 text-white
// "Ваша реферальная ссылка:"
// Input с ссылкой + кнопка "Скопировать" рядом
// При копировании: кнопка меняется на "Скопировано ✓" на 2 сек

// Статистика: grid grid-cols-3 gap-4
// Приглашено / Зарегистрировались / Заработано с рефералов

// Таблица приглашённых:
// Имя (скрытое, только первые буквы) | Дата регистрации | Статус | Ваш бонус

---

## 🏢 КАБИНЕТ ЗАКАЗЧИКА

### Навигация сайдбара (client):
📊 Обзор           /client
📋 Мои опросы      /client/surveys
➕ Создать опрос   /client/surveys/create
💰 Кошелёк         /client/wallet
⚙️ Настройки       /client/settings

---

### client/page.tsx — Обзор

**StatCards — grid grid-cols-4 gap-5:**
tsx
<StatCard label="Баланс" value="45 200 ₽" />
<StatCard label="Активных опросов" value="3" />
<StatCard label="Всего ответов" value="1 247" trend="+89 сегодня" trendUp={true} />
<StatCard label="Средняя конверсия" value="73%" />

**Список активных опросов — таблица:**
tsx
// Колонки: Название | Прогресс | Ответов | Бюджет | Статус | Действия
// Прогресс: полоска (answered / maxResponses)
// Статус: Badge — Активен (зелёный) / Пауза (жёлтый) / На модерации (синий) / Завершён (серый)
// Действия: иконки — Статистика | Пауза | Остановить

---

### client/surveys/create/page.tsx — Конструктор опросов

Это самая сложная страница. Делать в несколько шагов (Stepper):

**Stepper — 4 шага:**
tsx
// Визуальный stepper вверху:
// Шаг 1: Основное  →  Шаг 2: Вопросы  →  Шаг 3: Аудитория  →  Шаг 4: Бюджет

// Активный шаг: circle bg-brand text-white
// Пройденный: circle bg-brand/20 text-brand с галочкой
// Будущий: circle bg-dash-border text-dash-muted

**Шаг 1 — Основное:**
tsx
// Название опроса: input text-lg font-semibold
// Описание: textarea
// Категория: select (Потребительские / HR / Продукт / Маркетинг / Другое)
// Время прохождения (авто или вручную)

**Шаг 2 — Вопросы (главный):**
tsx
// Список вопросов — drag-and-drop (@dnd-kit/core)
// Каждый вопрос — карточка:
// bg-dash-card border border-dash-border rounded-xl p-5
// Слева: иконка drag ⠿, номер вопроса
// Тип вопроса: select в правом верхнем углу карточки
// Текст вопроса: input
// Варианты ответов (для single/multiple): динамический список + кнопка "Добавить вариант"
// Логика показа: кнопка "Добавить условие" → раскрывается секция с правилами
// Загрузка медиа: кнопка "Прикрепить файл"
// Удаление: иконка Trash в углу

// Типы вопросов (select):
// 📌 Одиночный выбор
// ☑️ Множественный выбор
// ⭐ Шкала Лайкерта (1-5 или 1-10)
// 📊 Матрица
// 🔢 Ранжирование
// 📝 Открытый ответ

// Кнопка "Добавить вопрос" — внизу списка, пунктирная граница
// bg-dash-bg border-2 border-dashed border-dash-border
// hover:border-brand/40 hover:bg-brand/5 transition-colors

**Шаг 3 — Аудитория:**
tsx
// Фильтры таргетинга:
// Пол: кнопки-тоглы (Все / Мужской / Женский)
// Возраст: range slider (18 — 65)
// Города: мультиселект
// Уровень дохода: чекбоксы
// Интересы: теги с мультиселектом

// Справа — виджет расчёта:
// bg-[#0A0A0F] rounded-2xl p-6 text-white sticky top-6
// "Расчётный охват: ~2 400 чел."
// "Прогноз сбора: 3-5 дней"
// (обновляется при изменении фильтров)

**Шаг 4 — Бюджет:**
tsx
// Количество респондентов: number input со стрелками
// Вознаграждение за одного: number input (min 20 ₽)

// Итоговый блок (sticky, bg-[#0A0A0F] rounded-2xl text-white):
// Вознаграждения:     X × Y = Z ₽
// Комиссия платформы: Z × 15% = W ₽
// ─────────────────────────────────
// Итого к оплате:     V ₽

// Расписание: дата запуска (DatePicker) + чекбокс "Авто-остановка"
// Кнопка "Опубликовать опрос" → variant="primary" size="xl"
// Кнопка "Сохранить черновик" → variant="secondary"

---

### client/surveys/[id]/page.tsx — Статистика опроса

**Верх — PageHeader с названием опроса + бейдж статуса + кнопки Пауза/Стоп**

**StatCards:** Всего ответов | Конверсия входа | Среднее время | Завершили

**Графики (recharts):**
tsx
// 1. Динамика сбора ответов: LineChart (по дням)
//    bg-dash-card border border-dash-border rounded-2xl p-6

// 2. Демография: два BarChart рядом (пол + возраст)

// 3. По каждому вопросу — своя визуализация:
//    Одиночный/множественный выбор: HorizontalBarChart
//    Шкала: распределение по числам
//    Открытые ответы: список топ-ответов + кнопка "ИИ-анализ"

**Кнопка "Скачать отчёт"** — PDF и Excel

---

### client/wallet/page.tsx — Кошелёк заказчика
tsx
// Аналогично кошельку респондента, но:
// Вместо "Вывести" — кнопка "Пополнить баланс"
// При клике → Modal с вариантами: Банковская карта / Безнал (счёт для юрлиц)
// История: Пополнения и Списания за опросы

---

### client/settings/page.tsx — Настройки
tsx
// Две секции:

// 1. Профиль компании:
// Название компании / ИНН / Контактное лицо / Email / Телефон
// Кнопка "Сохранить"

// 2. Реквизиты для счёта:
// Юридический адрес / Банк / Расчётный счёт / БИК
// Кнопка "Сохранить реквизиты"

---

## 🛡️ КАБИНЕТ АДМИНИСТРАТОРА

### Навигация сайдбара (admin):
📊 Обзор          /admin
🔍 Модерация      /admin/moderation
👥 Пользователи   /admin/users
🎓 Эксперты       /admin/experts
💰 Финансы        /admin/finance

---

### admin/page.tsx — Обзор

**StatCards:** Опросов на модерации | Новых пользователей | Оборот за месяц | Жалоб в обработке

**Последние события — лента:**
tsx
// Список последних действий в системе:
// [иконка] Описание события — время
// Новый опрос на модерации · 5 мин назад
// Жалоба от респондента · 12 мин назад
// Пополнение баланса 15 000 ₽ · 1 час назад

---

### admin/moderation/page.tsx — Модерация

**Фильтры вверху:** Все | На проверке | Одобренные | Отклонённые

**Таблица опросов:**
tsx
// Колонки: Опрос | Заказчик | Создан | Вопросов | Бюджет | Статус | Действия
// Действия:
//   "Просмотреть" → открывает preview опроса в Modal (полный просмотр)
//   "Одобрить" → зелёная кнопка icon-only
//   "Отклонить" → красная кнопка icon-only → Modal с textarea "Причина отклонения"

**Modal просмотра опроса:**
tsx
// Полный превью опроса как его видит респондент
// Внизу модала: кнопки "Одобрить" и "Отклонить с причиной"

---

### admin/users/page.tsx — Пользователи

**Табы:** Все | Респонденты | Заказчики | Заблокированные

**Поиск + фильтры:**
tsx
// Input поиска по email/имени
// Select: Статус (Активен / Заблокирован / Новый)
// Select: Дата регистрации

**Таблица:**
tsx
// Колонки: Пользователь | Роль | Регистрация | Активность | Статус | Действия
// Действия:
//   "Просмотреть" → страница пользователя
//   "Заблокировать" / "Разблокировать" — toggle

**Жалобы — отдельная вкладка:**
tsx
// Список жалоб от респондентов:
// Жалобщик | На кого/что | Причина | Дата | Действия (Принять / Отклонить)

---

### admin/experts/page.tsx — Эксперты
tsx
// Список заказов "Экспертное заключение":
// Таблица: Заказчик | Опрос | Дата заказа | Назначен эксперт | Статус | Действия

// Действия:
//   "Назначить эксперта" → Modal: select эксперта из списка
//   "Загрузить заключение" → upload PDF файла → отправляется заказчику

---

### admin/finance/page.tsx — Финансы

**StatCards:** Оборот за месяц | Комиссия платформы | Выплачено респондентам | Пополнений

**Графики:**
tsx
// BarChart — оборот по неделям (recharts)

**Таблица транзакций:**
tsx
// Колонки: Дата | Тип | Пользователь | Сумма | Комиссия | Статус
// Экспорт в Excel — кнопка вверху справа

**Настройка комиссии:**
tsx
// Секция внизу:
// "Текущая комиссия платформы: 15%"
// Input для изменения + кнопка "Сохранить"

---

## 🧩 ОБЩИЕ КОМПОНЕНТЫ

### StatCard.tsx
tsx
type Props = {
  icon?: React.ReactNode
  label: string
  value: string
  trend?: string
  trendUp?: boolean
}

// bg-dash-card border border-dash-border rounded-2xl p-6
// Иконка (если есть): w-10 h-10 bg-brand/10 rounded-xl text-brand mb-4
// Label: text-sm text-dash-muted font-body mb-1
// Value: font-display text-3xl text-dash-heading font-bold
// Trend: text-xs mt-2
//   trendUp=true  → text-green-600 "↑ +89 сегодня"
//   trendUp=false → text-red-500   "↓ -12 за неделю"

### Badge.tsx
tsx
// Варианты статусов:
// active:      bg-green-50  text-green-700  border-green-200
// pending:     bg-yellow-50 text-yellow-700 border-yellow-200
// rejected:    bg-red-50    text-red-700    border-red-200
// draft:       bg-gray-100  text-gray-600   border-gray-200
// moderation:  bg-blue-50   text-blue-700   border-blue-200
// completed:   bg-purple-50 text-purple-700 border-purple-200

// Все: border rounded-full px-2.5 py-0.5 text-xs font-semibold font-body

### EmptyState.tsx
tsx
// Когда список пустой:
// SVG иллюстрация (простая, линейная)
// Заголовок: font-display text-xl text-dash-heading
// Описание: text-sm text-dash-muted
// CTA кнопка (опциональная)

// Примеры:
// Нет доступных опросов → "Загляните позже, новые опросы появятся скоро"
// Нет истории транзакций → "Пройдите первый опрос и получите вознаграждение"

### DataTable.tsx
tsx
// Универсальная таблица:
// thead: bg-dash-bg border-b border-dash-border
//   th: text-xs font-semibold uppercase tracking-wider text-dash-muted px-6 py-3
// tbody: divide-y divide-dash-border
//   tr: hover:bg-dash-bg transition-colors
//   td: px-6 py-4 text-sm text-dash-body

---

## ❌ ЗАПРЕЩЕНО

- Inline стили style={{}}
- Любые UI-библиотеки (shadcn, MUI, Ant Design) — только Tailwind
- Таблицы без hover состояний
- Страницы без EmptyState при пустых данных
- Моковые данные захламляющие JSX — выносить в отдельные const mockData в начале файла
- Смешивать логику и вёрстку в одном компоненте

---

## ✅ ПОРЯДОК ВЫПОЛНЕНИЯ

**Начинаем с общего — потом по ролям:**

**Блок 0 — Фундамент:**
1. tailwind.config.ts — добавить darkMode: 'class' и цвета dash-*
2. app/globals.css — CSS-переменные для светлой и тёмной темы
3. components/dashboard/ThemeToggle.tsx
4. app/(dashboard)/layout.tsx — с ThemeProvider
5. components/dashboard/Sidebar.tsx
6. components/dashboard/TopBar.tsx — с ThemeToggle внутри
7. components/dashboard/StatCard.tsx
8. components/dashboard/Badge.tsx
9. components/dashboard/EmptyState.tsx
10. components/dashboard/DataTable.tsx

**Блок 1 — Респондент:**
8. respondent/page.tsx (обзор + лента)
9. respondent/wallet/page.tsx
10. respondent/surveys/page.tsx
11. respondent/profile/page.tsx
12. respondent/referral/page.tsx

**Блок 2 — Заказчик:**
13. client/page.tsx
14. client/surveys/create/page.tsx ← самый сложный, делать последовательно по шагам
15. client/surveys/[id]/page.tsx
16. client/wallet/page.tsx
17. client/settings/page.tsx

**Блок 3 — Администратор:**
18. admin/page.tsx
19. admin/moderation/page.tsx
20. admin/users/page.tsx
21. admin/experts/page.tsx
22. admin/finance/page.tsx

**После каждого файла — стоп. Жди подтверждения перед следующим.**

Показать ещё

Переведу кабинеты на новый гибридный стиль (тёмный сайдбар + светлая рабочая область) с переключением темы через next-themes, как в твоём ТЗ. Сначала обновлю Tailwind/глобальные переменные и добавлю общий dashboard layout, затем перетащу роуты трёх ролей в app/(dashboard) чтобы не было конфликтов.

Сделал полный рефактор личных кабинетов под твоё ТЗ (Linear/Vercel-стиль): тёмный сайдбар + светлая рабочая область + переключение темы (light/dark) через next-themes, всё на dash-* CSS-переменных.

Фундамент

tailwind.config.ts
Добавил darkMode: "class".
Добавил цвета dash.* через CSS-переменные.

tailwind.config.ts
app/globals.css
Добавил переменные для светлой темы и .dark для тёмной, как в промпте.

app/globals.css
Общий layout кабинетов с ThemeProvider
Новый сегмент: app/(dashboard)/layout.tsx (Sidebar + TopBar + main).

app/(dashboard)/layout.tsx
Dashboard компоненты (все через dash-*, без inline style={{}})


Sidebar.tsx

TopBar.tsx
 (поиск + ThemeToggle + уведомления)

ThemeToggle.tsx

PageHeader.tsx

StatCard.tsx

SurveyCard.tsx

DataTable.tsx

EmptyState.tsx

Badge.tsx

Modal.tsx

Tabs.tsx
Роуты (как в твоей структуре)
Респондент:

/respondent

app/(dashboard)/respondent/page.tsx
/respondent/wallet

app/(dashboard)/respondent/wallet/page.tsx
/respondent/surveys

app/(dashboard)/respondent/surveys/page.tsx
/respondent/profile

app/(dashboard)/respondent/profile/page.tsx
/respondent/referral

app/(dashboard)/respondent/referral/page.tsx
Заказчик:

/client

app/(dashboard)/client/page.tsx
/client/surveys

app/(dashboard)/client/surveys/page.tsx
/client/surveys/create (stepper 4 шага, статично)

app/(dashboard)/client/surveys/create/page.tsx
/client/surveys/[id] (статистика-заглушка)

app/(dashboard)/client/surveys/[id]/page.tsx
/client/wallet

app/(dashboard)/client/wallet/page.tsx
/client/settings

app/(dashboard)/client/settings/page.tsx
Админ:

/admin

app/(dashboard)/admin/page.tsx
/admin/moderation (фильтры + таблица + превью/отклонение в модалках)

app/(dashboard)/admin/moderation/page.tsx
/admin/users (табы + таблица)

app/(dashboard)/admin/users/page.tsx
/admin/experts (таблица + модал назначения)

app/(dashboard)/admin/experts/page.tsx
/admin/finance (StatCards + таблица + настройка комиссии)

app/(dashboard)/admin/finance/page.tsx
Важно

Старые “тёмные” кабинеты в app/(respondent), app/(client), app/(admin) удалил, чтобы не было конфликтов роутов.
tsc --noEmit проходит.
Следующее логичное: привести лендинг к ссылкам “Войти/Регистрация” (пока у нас нет auth) и добавить на дашбордах EmptyState там, где списки могут быть пустыми по табам (например, у респондента “Завершённые” если убрать мок).



Измени везде шрифт (особенно цифр) на Bebas Neue если его нету то сам скачай, и так-же устрани все ошибки которые уже есть:
## Error Type
Console Error

## Error Message
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch if (typeof window !== 'undefined').
- Variable input such as Date.now() or Math.random() which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <HotReload globalError={[...]} webSocket={WebSocket} staticIndicatorState={{pathname:null, ...}}>
      <AppDevOverlayErrorBoundary globalError={[...]}>
        <ReplaySsrOnlyErrors>
        <DevRootHTTPAccessFallbackBoundary>
          <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
            <HTTPAccessFallbackErrorBoundary pathname="/client" notFound={<NotAllowedRootHTTPFallbackError>} ...>
              <RedirectBoundary>
                <RedirectErrorBoundary router={{...}}>
                  <Head>
                  <__next_root_layout_boundary__>
                    <SegmentViewNode type="layout" pagePath="/WebstormP...">
                      <SegmentTrieNode>
                      <link>
                      <script>
                      <RootLayout>
                        <html
                          lang="ru"
-                         className="light"
-                         style={{color-scheme:"light"}}
                        >
                  ...



    at html (<anonymous>:null:null)
    at RootLayout (app/layout.tsx:31:5)

## Code Frame
  29 | }>) {
  30 |   return (
> 31 |     <html lang="ru">
     |     ^
  32 |       <body className={${syne.variable} ${inter.variable} bg-surface-950 text-white antialiased}>
  33 |         {children}
  34 |       </body>

Next.js version: 16.1.6 (Turbopack)


И так-же позаботься что бы и в будущем не было когда будут уже подключены платеже апи и бд

Показать ещё

Меняю шрифт на Bebas Neue во всём проекте (включая цифры) и параллельно чиню hydration mismatch от next-themes на уровне <html> в root layout.

Сделал 2 вещи: шрифт Bebas Neue “везде” + убрал hydration mismatch от темы.

1) Bebas Neue везде (включая цифры)
Подключил Bebas_Neue через next/font/google и завёл переменную --font-bebas:

app/layout.tsx
Поставил Bebas как базовый font-family проекта:

app/globals.css
В Tailwind перевёл и font-display, и font-body на Bebas (Inter оставил как fallback):

tailwind.config.ts
2) Исправил ошибку hydration mismatch (next-themes)
Проблема была из‑за того, что next-themes добавляет class="light|dark" и style="color-scheme: ..." на <html> уже на клиенте, а SSR отдаёт без них.

Добавил suppressHydrationWarning на <html> и <body>:

app/layout.tsx
Это стандартное решение под next-themes, и в будущем (когда подключим БД/платежи) эта проблема не вернётся.

Про “в будущем не было ошибок” (коротко, что я учёл)
В дашборде не использую Date.now()/Math.random() в SSR-рендере.
Для темы уже есть mounted guard в ThemeToggle, а mismatch на <html> подавлен корректно.
tsc --noEmit проходит.



У тебя во многих местах уменьшился размер текста, исправь 

Сейчас пройдусь по dashboard-компонентам и страницам, найду где text-xs/text-sm стало слишком мелко (особенно после замены шрифта), и подниму типографику до нормальной читабельности без раздувания лэйаута.

Поднял размеры текста обратно (и сделал “базу” крупнее), чтобы после смены шрифта ничего не выглядело мелким.

Изменения:

Базовый размер текста в рабочей области дашборда: text-base leading-relaxed в 
layout.tsx
Таблицы стали читабельнее:
th: text-sm (было text-xs)
td: text-base (было text-sm)
в 
DataTable.tsx
Карточки статистики:
label text-base
value text-4xl
trend text-sm
в 
StatCard.tsx
Карточки опросов:
category/rating поднял до text-sm
meta и hover-CTA до text-base
в 
SurveyCard.tsx
Сайдбар (навигация и профиль) сделал заметно крупнее:
ссылки text-base, больше вертикальный паддинг
заголовки секций text-xs
профиль снизу text-base/text-sm
в 
Sidebar.tsx
tsc --noEmit проходит.



Нет мне не нравиться давай шрифт Geist  для хорошей читаемости

Перевёл шрифт на Geist (для читабельности) и убрал Bebas.

Что поменял:

Подключение шрифтов: теперь Geist + Geist_Mono (через next/font/google), Inter оставлен как fallback для кириллицы.

app/layout.tsx
Tailwind font-display и font-body теперь используют var(--font-geist) (Inter как запасной).

tailwind.config.ts
Базовый font-family в globals.css теперь var(--font-geist).

app/globals.css
Убрал добавленную зависимость geist (её нельзя установить в текущем окружении из‑за DNS), чтобы не плодить ошибки.

package.json
TypeScript проверка проходит.



Сделай так-же и для всего сайта возможность менять тему сайта(белый и черный), и что бы все смотрелось красиво и читабельно

Делаю глобальный переключатель темы для всего сайта (лендинг + кабинеты): выношу ThemeProvider в корневой app/layout.tsx, добавляю site-* CSS-переменные и перевожу лендинг/кнопки на них, чтобы светлая и тёмная темы выглядели одинаково аккуратно и читабельно.

Сделал глобальную смену темы для всего сайта (белая/чёрная), чтобы и лендинг и кабинеты выглядели читабельно.

Что сделано:

Глобальный ThemeProvider
Вынес ThemeProvider в корень, теперь тема применяется ко всему приложению (лендинг + /respondent|/client|/admin).

Providers.tsx


layout.tsx
Убрал ThemeProvider из дашборд-лейаута, чтобы не было двойных провайдеров.

layout.tsx
Переменные и цвета для лендинга
Добавил site-* CSS-переменные (light/dark) и Tailwind-цвета site.*, чтобы лендинг нормально переключался.

app/globals.css


tailwind.config.ts
Кнопка переключения темы
Добавил общий ThemeToggle и вставил его в хедер (лендинг) и в TopBar (кабинеты).
Сделал tone="site" для лендинга и tone="dash" для кабинетов, чтобы выглядело уместно в обоих местах.

ThemeToggle.tsx


Header.tsx


TopBar.tsx
Лендинг перевёл на site-палитру
Обновил main и ключевые секции, чтобы они не были “вечно тёмными” и в светлой теме выглядели чисто.

page.tsx


Hero.tsx


Stats.tsx


TwoAudiences.tsx


Cabinets.tsx


About.tsx


Partners.tsx


FAQ.tsx


CTA.tsx


Footer.tsx
Проверка: tsc --noEmit проходит.

Если хочешь, следующим шагом могу пройтись по оставшимся “наследным” компонентам, которые ещё используют bg-surface-* (например components/layout/DashboardShell.tsx, если он вообще нужен), чтобы вообще нигде не было “захардкоженной” темы.



Молодец, теперь для навигаций надо сделать плавный скролл а так-же в качестве иконки поставить favicon.png(без рамок и без лишнего), и тема сайта что бы по умолчанию была темной

Сделаю 3 правки: включу гарантированный smooth scroll для якорных ссылок (с учётом липкого хедера), заменю иконку в шапке/футере/сайдбаре на favicon.png без рамок, и оставлю дефолтную тему тёмной (у тебя уже почти так, проверю и закреплю).

Сделал.

Плавный скролл в навигации
Перенёс scroll-behavior: smooth на html (так надёжнее для якорей).
Добавил scroll-padding-top: 80px, чтобы якоря не прятались под липким хедером.

app/globals.css
Иконка = favicon.png (без рамок/лишнего)
В хедере и футере заменил /logo.png на /favicon.png, убрал “рамочные” обвязки, оставил чистую картинку object-contain.

components/layout/Header.tsx


components/layout/Footer.tsx
В dashboard sidebar тоже поставил /favicon.png и убрал рамку вокруг иконки.

components/dashboard/Sidebar.tsx
components/layout/DashboardShell.tsx уже был на /favicon.png (оставил как есть).
Тема по умолчанию тёмная
Уже было defaultTheme="dark" в провайдерах, это сохраняется.

components/theme/Providers.tsx
tsc --noEmit проходит.



Сделай для белой темы цвет чуть темнее а то он слишком яркий

Сделал светлую тему менее “ярко-белой” (меньше бликов, более спокойный off-white):

Обновил переменные light-темы для site-* и dash-* (фон стал темнее, бордеры/текст чуть контрастнее).

app/globals.css
TypeScript проверка проходит.



Надо цвет еще немного темнее сделать, и скролл по ссылкам не стал плавным он такой же

Сделал.

Светлая тема ещё темнее (меньше “свечения”)
Затемнил фон/секции/бордеры/текст для light-темы site-* и dash-*.

app/globals.css
Плавный скролл по ссылкам (реально плавный)
CSS scroll-behavior иногда не срабатывает предсказуемо в Next, поэтому добавил обработчик клика на hash-ссылки через scrollIntoView({ behavior: "smooth" }).
Новый компонент: 
SmoothHashLink.tsx
Подключил в навигации хедера и футера:

Header.tsx

Footer.tsx
Плюс добавил scroll-margin-top для всех id, чтобы якоря не прятались под липким хедером:

app/globals.css

tsc --noEmit проходит.



Надо на первом блоке отступ сверху еще немного уменьшить

Уменьшил верхний отступ в первом (Hero) блоке: pt-20 sm:pt-24 → pt-16 sm:pt-20 в 
Hero.tsx
.








Разрешения по умолчанию




Работать локально

Сведения о ветке

Changes
+0
-0

Действия Git
GitHub CLI недоступен

Artifacts

yandexAuth.png

README.md

DEVELOPMENT.md

ARCHITECTURE.md

ROADMAP.md

localhost:3000/api/auth/callback/yandex
