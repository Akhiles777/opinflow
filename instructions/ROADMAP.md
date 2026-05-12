# Roadmap проекта

## Общая логика этапов

Проект развивается поэтапно:

1. интерфейс и навигация
2. auth, роли, профили, база
3. полноценная survey-domain логика
4. аналитика, графики, рабочие действия в кабинетах
5. документы, эксперты, биллинг, расширенная админка

Ниже — честное состояние проекта на текущий момент.

## Этап 1 — UI / Frontend Foundation

### Что входило

- главная страница
- auth-страницы
- dashboard layout
- кабинеты трёх ролей как UI
- адаптивность
- темы

### Что сделано

- главная страница собрана
- auth UI собран
- dashboard shell собран
- тёмная/светлая тема работает
- мобильное меню и dashboard burger есть
- базовая адаптивность сильно улучшена

### Что осталось от этапа 1

- точечный polish визуала ещё возможен всегда
- но как фундамент этап уже закрыт

## Этап 2 — Backend Foundation

### Цель

Подключить реальный backend к уже готовой вёрстке.

### Что должно было появиться

- регистрация
- email verification
- login
- forgot/reset password
- OAuth
- профили
- role-based redirect
- реальные данные в кабинетах

### Что сделано

#### Auth

- email registration
- email verification
- email login
- password reset
- Yandex OAuth
- VK ID flow

#### Roles

- `RESPONDENT`
- `CLIENT`
- `ADMIN`
- admin через `ADMIN_EMAILS`

#### Prisma / DB

Схема уже покрывает:
- users
- sessions/accounts
- email tokens
- respondent profile
- client profile
- wallets
- transactions
- surveys
- survey responses
- referrals

#### Реальные данные уже подключены в:

- respondent overview
- respondent wallet
- respondent referral
- respondent profile
- client overview
- client surveys list
- client wallet
- client settings
- admin overview
- admin users
- admin finance
- dashboard shell

### Что остаётся ограничением Этапа 2

Пока невозможно полноценно оживить без расширения схемы:
- конструктор вопросов
- статистику по конкретным вопросам
- модерацию с workflow
- жалобы
- экспертов
- загрузки файлов
- промежуточный progress по вопросам

То есть не потому что “не дописано”, а потому что текущая БД это ещё не описывает.

## Этап 3 — Survey Domain

### Что нужно добавить

- сущности вопросов
- типы вопросов
- варианты ответов
- таргетинг
- бюджеты опросов
- промежуточный progress
- draft/publish flow

### После этого можно будет оживить

- `client/surveys/create`
- `client/surveys/[id]`
- respondent survey progress

## Этап 4 — Analytics & Operations

### Планируемо

- графики
- аналитика
- экспорт
- рабочие действия в кабинетах
- полноценные таблицы операций

### После этого можно будет закрыть

- графики заказчика
- детальную аналитику
- действия pause/stop
- более глубокие admin workflows

## Этап 5 — Business Layer

### Планируемо

- документы
- эксперты
- модерация
- реальные платежи
- биллинг
- файловые загрузки

## Текущее состояние по разделам

### Главная страница

Статус:
- в рабочем состоянии

### Auth

Статус:
- рабочий

Над чем ещё можно работать:
- дополнительный UX polish

### Respondent

Статус:
- частично живой

Живое:
- overview
- wallet
- referral
- profile
- completed surveys

Ограничения:
- нет промежуточного progress model

### Client

Статус:
- частично живой

Живое:
- overview
- surveys list
- wallet
- settings

Ограничения:
- create survey и survey details ещё зависят от следующего этапа

### Admin

Статус:
- частично живой

Живое:
- overview
- users
- finance

Ограничения:
- moderation и experts не могут стать полностью реальными без новых сущностей

## Приоритет следующей разработки

Если двигаться разумно, следующий приоритет такой:

1. расширить Prisma schema под survey questions и answer structure
2. оживить `client/surveys/create`
3. оживить `client/surveys/[id]`
4. добавить жалобы и moderation data model
5. оживить `admin/moderation`
6. после этого переходить к экспертам и документам

## Что считать done прямо сейчас

Можно считать завершённым:
- базовый frontend foundation
- auth foundation
- role-based access foundation
- profiles foundation
- dashboard data foundation

## Что считать следующей большой вехой

Следующая большая веха:
- “Survey Engine”

То есть момент, когда опрос уже существует не как просто карточка в таблице, а как полноценная сущность с вопросами, логикой, ответами и аналитикой.
