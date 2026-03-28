# Локальная разработка и деплой

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Создание `.env`

Создайте локальный `.env` на основе `.env.example`.

Минимальный набор:

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

RESEND_API_KEY=""
```

## Что означает каждая env-переменная

### База данных

- `DATABASE_URL`
  - runtime connection
  - для Prisma Client внутри приложения
- `DIRECT_URL`
  - direct connection
  - для Prisma CLI (`db push`, `generate`, и т.д.)

Если используете Prisma Postgres:
- `DATABASE_URL` должен быть pooled
- `DIRECT_URL` должен быть direct

### Auth

- `NEXTAUTH_URL`
  - базовый URL проекта
  - нужен для callback URL и email-ссылок
- `NEXTAUTH_SECRET`
  - обязателен

### Админ

- `ADMIN_EMAILS`
  - список email через запятую
  - пользователи с этими email получают роль `ADMIN`

Пример:

```env
ADMIN_EMAILS="owner@example.com,admin@example.com"
```

### OAuth

- `VK_CLIENT_ID`
- `VK_CLIENT_SECRET`
- `YANDEX_CLIENT_ID`
- `YANDEX_CLIENT_SECRET`

### Почта

- `RESEND_API_KEY`

## Подготовка Prisma

### Генерация клиента

```bash
npx prisma generate
```

### Применение схемы

```bash
npx prisma db push
```

Если нужно проверить состояние схемы:

```bash
npx prisma validate
```

## Запуск проекта

### Dev

```bash
npm run dev
```

### TypeScript check

```bash
npx tsc --noEmit
```

### Lint

```bash
npm run lint
```

### Production build

```bash
npm run build
```

## Важные замечания по сборке

### Prisma на Vercel

В проекте уже настроено:

```json
"postinstall": "prisma generate",
"build": "prisma generate && next build"
```

Это сделано специально, чтобы Vercel не падал на устаревшем Prisma Client.

### Google Fonts

Локально `npm run build` может падать, если среда не может достучаться до:
- `fonts.googleapis.com`

Это не всегда ошибка проекта.

Если хотите полностью независимую сборку:
- переводите шрифты на локальные файлы

## Локальная проверка auth

### Обычная регистрация

1. открыть `/register`
2. выбрать роль
3. создать аккаунт
4. открыть почту
5. перейти по ссылке подтверждения
6. войти через `/login`

### Вход в admin

1. добавить email в `ADMIN_EMAILS`
2. перезапустить сервер
3. выйти из аккаунта
4. войти снова
5. открыть `/admin`

### Yandex OAuth

Для локальной разработки в кабинете Яндекса должен быть callback:

```text
http://localhost:3000/api/auth/callback/yandex
```

### VK

Для локальной разработки проверьте:
- корректный `VK_CLIENT_ID`
- корректный `VK_CLIENT_SECRET`
- что ваш VK app настроен под нужный домен/callback

VK в проекте работает через VK ID SDK и отдельный bridge, а не через стандартный NextAuth VK provider.

## Деплой на Vercel

## Что обязательно задать в Vercel

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ADMIN_EMAILS`
- `VK_CLIENT_ID`
- `VK_CLIENT_SECRET`
- `YANDEX_CLIENT_ID`
- `YANDEX_CLIENT_SECRET`
- `RESEND_API_KEY`

### `NEXTAUTH_URL`

Пример:

```env
NEXTAUTH_URL="https://opinflow-xi.vercel.app"
```

### Redirect URI для Яндекса

```text
https://YOUR_DOMAIN/api/auth/callback/yandex
```

### Redirect URI для email-ссылок

Ссылки в письмах берутся из `NEXTAUTH_URL`.

Если `NEXTAUTH_URL` неверный:
- verify email
- reset password

будут вести не туда.

## Что делать после изменения env

### Локально

Перезапустить dev server:

```bash
npm run dev
```

### На Vercel

Сделать redeploy.

## Частые проблемы

### 1. Не могу войти в admin

Проверьте:
- есть ли email в `ADMIN_EMAILS`
- перезапущен ли сервер
- выполнен ли повторный вход

### 2. Не приходит письмо

Проверьте:
- `RESEND_API_KEY`
- режим Resend
- подтверждён ли домен

Если Resend в test mode:
- письмо может уходить только на разрешённый адрес

### 3. Ошибка Prisma / база недоступна

Проверьте:
- `DATABASE_URL`
- `DIRECT_URL`
- доступность базы

### 4. OAuth не работает

Проверьте:
- client id / secret
- redirect URI
- `NEXTAUTH_URL`

### 5. После изменения роли всё ещё старая роль

Выйдите и войдите снова.

## Рекомендуемый рабочий цикл

1. `npm run dev`
2. правки кода
3. `npx tsc --noEmit`
4. проверить вручную нужные страницы
5. перед деплоем:
   - `npx tsc --noEmit`
   - `npm run build`

## Полезные файлы для разработки

Смотреть в первую очередь:
- `auth.ts`
- `middleware.ts`
- `actions/auth.ts`
- `actions/profile.ts`
- `lib/dashboard-data.ts`
- `prisma/schema.prisma`

## Что не стоит ломать без понимания

- `auth.ts`
  - очень много сценариев сходится в одном месте
- `lib/dashboard-data.ts`
  - от него зависят server pages dashboard
- `prisma/schema.prisma`
  - любое изменение требует пересмотра выборок и build-flow
