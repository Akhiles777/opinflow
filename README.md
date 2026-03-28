# ПотокМнений

Маркетинговая платформа на `Next.js + NextAuth + Prisma + PostgreSQL`.

Проект сейчас находится на уровне:
- готовая главная страница,
- auth и роли,
- email-верификация и восстановление пароля,
- базовые кабинеты с реальными данными из БД там, где это уже поддерживает текущая схема.

## Стек

- `Next.js 16` App Router
- `React 19`
- `NextAuth v5 beta`
- `Prisma`
- `Prisma Postgres`
- `Resend`
- `Tailwind CSS 4`
- `TypeScript`

## Что уже работает

### Аутентификация

- регистрация по email и паролю
- подтверждение email через письмо
- вход по email и паролю
- восстановление пароля
- вход через `Yandex OAuth`
- вход через `VK ID` через отдельный клиентский flow

### Роли

В проекте есть 3 роли:
- `RESPONDENT`
- `CLIENT`
- `ADMIN`

Как роли назначаются сейчас:
- при обычной регистрации пользователь выбирает `RESPONDENT` или `CLIENT`
- если email попадает в `ADMIN_EMAILS`, роль автоматически становится `ADMIN`
- для VK/Yandex роль тоже может быть автоматически повышена до `ADMIN`, если email указан в `ADMIN_EMAILS`

### Кабинеты

На текущем этапе реальными данными уже наполнены:
- sidebar/topbar пользователя
- overview респондента
- кошелёк респондента
- рефералы респондента
- профиль респондента
- overview заказчика
- список опросов заказчика
- кошелёк заказчика
- настройки компании
- overview админа
- список пользователей админа
- финансы админа

## Что пока не реализовано полностью

Это важно понимать заранее.

В текущей Prisma-схеме пока нет сущностей для:
- вопросов опроса,
- промежуточного прогресса прохождения,
- жалоб,
- экспертных заключений,
- файлов,
- модерационных решений,
- полноценного управления платежами.

Поэтому некоторые страницы ещё существуют как UI-каркас и не могут быть “полностью живыми” без расширения схемы БД.

Это особенно касается:
- `client/surveys/create`
- `client/surveys/[id]`
- `admin/moderation`
- `admin/experts`

## Переменные окружения

См. шаблон:

```env
DATABASE_URL=""
DIRECT_URL=""

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
ADMIN_EMAILS="admin@example.com"

VK_CLIENT_ID=""
VK_CLIENT_SECRET=""
YANDEX_CLIENT_ID=""
YANDEX_CLIENT_SECRET=""

EMAIL_HOST="smtp.yandex.ru"
EMAIL_PORT="465"
EMAIL_USER="your@yandex.ru"
EMAIL_PASS=""
```

### Что важно

- `DATABASE_URL` — pooled connection для runtime
- `DIRECT_URL` — direct connection для Prisma CLI
- `ADMIN_EMAILS` — список admin-email через запятую
- `NEXTAUTH_SECRET` — обязателен
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` — обязательны для писем через Яндекс SMTP

Пример:

```env
ADMIN_EMAILS="you@example.com,owner@example.com"
```

## Локальный запуск

### 1. Установить зависимости

```bash
npm install
```

### 2. Создать `.env`

На основе `.env.example`.

### 3. Сгенерировать Prisma Client

```bash
npx prisma generate
```

### 4. Применить схему в БД

```bash
npx prisma db push
```

### 5. Запустить проект

```bash
npm run dev
```

### 6. Загрузить тестовые данные

```bash
npm run db:seed
```

Тестовые аккаунты:

```text
RESPONDENT: respondent@test.local / Test12345!
CLIENT:     client@test.local / Test12345!
ADMIN:      admin@test.local / Test12345!
```

Чтобы `admin@test.local` реально имел admin-доступ локально, добавьте в `.env`:

```env
ADMIN_EMAILS="admin@test.local"
```

## Скрипты

```bash
npm run dev
npm run build
npm run start
npm run lint
```

В `build` уже встроен:

```bash
prisma generate && next build
```

Это нужно, чтобы Vercel не падал на устаревшем Prisma Client.

## Структура проекта

### Корневые файлы

- `app/layout.tsx` — root layout, шрифты, глобальные провайдеры
- `app/page.tsx` — главная страница
- `auth.ts` — центральная конфигурация NextAuth
- `middleware.ts` — защита роутов по ролям
- `next.config.ts` — config Next.js

### Auth

- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(auth)/verify-email/page.tsx`
- `app/(auth)/auth/error/page.tsx`

Клиентские части:
- `components/auth/LoginPageClient.tsx`
- `components/auth/RegisterPageClient.tsx`
- `components/auth/OAuthButtons.tsx`
- `components/auth/VKIDButton.tsx`
- `components/auth/SignOutButton.tsx`

### Dashboard

- `app/(dashboard)/layout.tsx` — server layout для кабинетов
- `components/dashboard/DashboardShell.tsx` — client shell
- `components/dashboard/Sidebar.tsx`
- `components/dashboard/TopBar.tsx`

### Data / Backend

- `prisma/schema.prisma` — вся текущая схема БД
- `lib/prisma.ts` — singleton Prisma client
- `lib/auth-utils.ts` — `requireAuth`, `requireRole`
- `lib/user-setup.ts` — создаёт wallet/profile при необходимости
- `lib/role-utils.ts` — логика admin-role через `ADMIN_EMAILS`
- `lib/dashboard-data.ts` — server-side выборки для кабинетов
- `lib/email.ts` — отправка писем через Resend
- `lib/validations.ts` — Zod-схемы

### Server Actions

- `actions/auth.ts`
- `actions/profile.ts`

## Как устроен auth

### Email-регистрация

Поток:

1. пользователь регистрируется
2. создаётся `User` со статусом `PENDING_VERIFICATION`
3. создаётся `EmailToken`
4. отправляется письмо через Resend
5. после подтверждения email:
   - `status = ACTIVE`
   - создаются `wallet` и нужный профиль

### Email-вход

Используется `Credentials` provider в `auth.ts`.

Проверки:
- есть ли пользователь
- есть ли `passwordHash`
- проходит ли `bcrypt.compare`
- не заблокирован ли аккаунт
- подтверждён ли email

### Yandex OAuth

Используется стандартный provider `next-auth/providers/yandex`.

### VK

VK сделан не через стандартный provider `next-auth/providers/vk`, а через отдельный `VK ID` клиентский flow.

Причина:
- стандартный flow с VK в этой связке оказался нестабильным
- используется клиентский SDK и затем `signIn("vkid")` через credentials bridge

Основные файлы:
- `components/auth/VKIDButton.tsx`
- `auth.ts`

## Как работает ADMIN

Админ не выбирается на форме регистрации.

Admin назначается автоматически, если email входит в `ADMIN_EMAILS`.

Это применяется:
- при регистрации
- при email-входе
- при OAuth-входе

Если вы добавили email в `ADMIN_EMAILS`, но уже были залогинены:

1. выйдите из аккаунта
2. войдите снова

## Как устроены реальные данные в dashboard

Основная идея:
- страницы кабинетов — server components
- данные собираются в `lib/dashboard-data.ts`
- UI-компоненты максимально простые и переиспользуемые

Примеры:
- баланс и транзакции идут из `Wallet` и `Transaction`
- overview заказчика и респондента строится из `Survey`, `SurveyResponse`, `Referral`
- admin overview/users/finance строятся из `User`, `Survey`, `Transaction`

## Ограничения текущего этапа

Если вы видите текст вроде “будет позже”, это обычно означает одно из двух:

1. для функции ещё нет сущности в БД
2. по ТЗ это уже следующий этап

То есть проблема не в том, что “код забыли дописать”, а в том, что текущая схема не хранит нужные данные.

## Типичные проблемы

### Не приходит письмо

Проверьте:
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- режим аккаунта Resend
- подтверждён ли домен / адрес отправителя

### Не могу войти в admin

Проверьте:
- добавлен ли ваш email в `ADMIN_EMAILS`
- перезапущен ли сервер после изменения `.env`
- перелогинились ли вы после смены env

### Prisma ошибки на Vercel

В проекте уже включён `prisma generate` в `postinstall` и `build`.

Если всё равно есть ошибки:
- проверьте `DATABASE_URL`
- проверьте `DIRECT_URL`
- проверьте, что переменные действительно заданы в Vercel

### Локально не проходит `npm run build`

В некоторых средах сборка может упираться в загрузку Google Fonts.

Это не всегда ошибка проекта как такового, а может быть ограничение сети среды, в которой запускается сборка.

## Что смотреть в первую очередь разработчику

Если нужно быстро влиться в проект, начните отсюда:

1. `prisma/schema.prisma`
2. `auth.ts`
3. `middleware.ts`
4. `actions/auth.ts`
5. `actions/profile.ts`
6. `lib/dashboard-data.ts`
7. `app/(dashboard)/layout.tsx`

## Рекомендуемый порядок дальнейшей разработки

1. Добить все разделы, которые уже можно наполнить текущей схемой
2. Расширить Prisma schema под:
   - survey questions
   - moderation
   - complaints
   - experts
   - files
3. После этого оживлять:
   - `client/surveys/create`
   - `client/surveys/[id]`
   - `admin/moderation`
   - `admin/experts`

## Статус документации

Этот README описывает текущее реальное состояние проекта после выполнения Этапа 2 и последующих правок вокруг auth, ролей, dashboard и Prisma.
