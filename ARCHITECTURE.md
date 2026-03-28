# Архитектура проекта

## Общая картина

`ПотокМнений` построен как `Next.js App Router` приложение с разделением на:
- публичную часть сайта,
- auth-часть,
- role-based dashboard,
- backend-логику через `NextAuth`, `Prisma`, `Server Actions`.

Основной принцип:
- UI в `app/` и `components/`
- бизнес-логика и выборки в `lib/`
- мутации через `actions/`
- схема данных в `prisma/schema.prisma`

## Слои приложения

### 1. Presentation Layer

Файлы:
- `app/page.tsx`
- `components/layout/*`
- `components/sections/*`
- `components/ui/*`
- `components/dashboard/*`

Задача:
- отрисовка страниц,
- layout,
- формы,
- таблицы,
- dashboard shell,
- theme toggle,
- анимации и UI-компоненты.

### 2. Routing Layer

Маршруты сгруппированы по зонам ответственности:

- публичный сайт:
  - `app/page.tsx`
- auth:
  - `app/(auth)/*`
- dashboard:
  - `app/(dashboard)/*`
- auth API:
  - `app/api/auth/[...nextauth]/route.ts`

Отдельный redirect-router:
- `app/dashboard/page.tsx`

Он отправляет пользователя в нужный кабинет в зависимости от роли.

### 3. Auth Layer

Ключевой файл:
- `auth.ts`

Что находится в auth-слое:
- `NextAuth` конфиг
- `Credentials` provider для email/password
- `Yandex` OAuth
- специальный `vkid` credentials bridge для входа через VK ID SDK
- `jwt/session callbacks`
- логика актуализации роли и статуса пользователя

Почему VK сделан отдельно:
- стандартный `VK` provider оказался нестабилен в текущей связке
- используется клиентский SDK и затем локальный `signIn("vkid")`

### 4. Authorization Layer

Файлы:
- `middleware.ts`
- `lib/auth-utils.ts`

Что делает этот слой:
- не даёт неавторизованным пользователям попасть в dashboard
- ограничивает доступ по ролям
- даёт server-side helper:
  - `requireAuth()`
  - `requireRole(role)`

## Ролевая модель

Роли в системе:
- `RESPONDENT`
- `CLIENT`
- `ADMIN`

Источник истины:
- поле `User.role` в БД

Дополнительное правило:
- `ADMIN_EMAILS` в env может автоматически повышать пользователя до admin

Это применяется:
- при регистрации
- при email-входе
- при OAuth-входе

Логика лежит в:
- `lib/role-utils.ts`

## Слой данных

Главный файл:
- `lib/dashboard-data.ts`

Это агрегирующий слой для dashboard-страниц.

Он:
- не рендерит UI
- не выполняет редиректы
- только собирает данные из Prisma и приводит их к удобному виду

Примеры:
- `getDashboardViewer`
- `getRespondentOverviewData`
- `getWalletData`
- `getRespondentReferralData`
- `getClientOverviewData`
- `getClientSurveysData`
- `getAdminOverviewData`
- `getAdminUsersData`
- `getAdminFinanceData`

Идея правильная:
- page-компоненты остаются тонкими
- Prisma-запросы не размазываются по JSX

## Мутации

Используются `Server Actions`.

Файлы:
- `actions/auth.ts`
- `actions/profile.ts`

### `actions/auth.ts`

Отвечает за:
- регистрацию
- повторную отправку письма
- запрос на сброс пароля
- сброс пароля
- проверку токена
- подтверждение email

### `actions/profile.ts`

Отвечает за:
- обновление профиля респондента
- обновление профиля заказчика

## Модель данных

Источник:
- `prisma/schema.prisma`

Основные сущности:
- `User`
- `Account`
- `Session`
- `EmailToken`
- `RespondentProfile`
- `ClientProfile`
- `Wallet`
- `Transaction`
- `Survey`
- `SurveyResponse`
- `Referral`

### Что уже хорошо покрыто схемой

- auth
- роли
- профили
- кошельки
- транзакции
- базовые опросы
- факт ответа на опрос
- реферальная система

### Что схема пока не хранит

- вопросы опроса
- варианты ответов
- частичный прогресс прохождения
- жалобы
- модерационные решения
- экспертные заключения
- файлы
- платёжные интеграции

Из-за этого часть экранов пока остаётся UI-каркасом.

## Email Layer

Файл:
- `lib/email.ts`

Провайдер:
- `Resend`

Что отправляется:
- письмо подтверждения email
- письмо сброса пароля

Логика:
- base URL берётся из `NEXTAUTH_URL`
- если `RESEND_API_KEY` не задан, выбрасывается контролируемая ошибка

## Dashboard Architecture

### Общий layout

- `app/(dashboard)/layout.tsx` — server component
- `components/dashboard/DashboardShell.tsx` — client shell

Паттерн:
1. server layout получает текущую сессию
2. из БД достаётся viewer
3. client shell получает уже готовые данные пользователя

### Shared components

- `Sidebar`
- `TopBar`
- `PageHeader`
- `StatCard`
- `DataTable`
- `Badge`
- `EmptyState`

Это даёт единый визуальный язык для всех кабинетов.

## VK flow отдельно

Файл:
- `components/auth/VKIDButton.tsx`

Поток:
1. загружается VK ID SDK
2. через `OneTap` получаем `code + device_id`
3. делаем `exchangeCode`
4. забираем user info
5. вызываем `signIn("vkid")`
6. credentials provider создаёт или обновляет пользователя в БД

Это решение нестандартное, но сейчас наиболее устойчивое для проекта.

## Redirect Flow

### После логина

Используется:
- `callbackUrl`
- `app/dashboard/page.tsx`

Если `callbackUrl` не задан:
- пользователь попадает на `/dashboard`
- дальше автоматически уходит в нужный кабинет по роли

### После logout

Используется:
- `signOut({ callbackUrl: "/login" })`

## Ограничения текущей архитектуры

1. Часть dashboard-страниц уже живая, часть пока каркас.
2. Нет отдельного service/repository слоя — сейчас его роль выполняют `lib/*`.
3. VK flow клиентский и более хрупкий, чем стандартный OAuth.
4. Нет централизованного audit/event log.
5. Нет очередей/background jobs для email и тяжёлых задач.

## Куда расти дальше

Следующий архитектурный шаг после Этапа 2:
- расширить Prisma schema
- вынести survey-domain в отдельный модуль
- добавить сущности вопросов/ответов
- развести admin workflows по отдельным data/service файлам
- добавить реальные документы и биллинг
