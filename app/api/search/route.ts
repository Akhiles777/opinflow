import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const RESPONDENT_PAGES = [
  { title: "Обзор",          subtitle: "Главная страница кабинета",            href: "/respondent",         icon: "overview" },
  { title: "Лента опросов",  subtitle: "Доступные опросы для прохождения",     href: "/respondent/feed",    icon: "feed" },
  { title: "Мои опросы",     subtitle: "Пройденные и активные опросы",         href: "/respondent/surveys", icon: "mine" },
  { title: "Кошелёк",        subtitle: "Баланс и история начислений",          href: "/respondent/wallet",  icon: "wallet" },
  { title: "Рефералы",       subtitle: "Реферальная программа и бонусы",      href: "/respondent/referral",icon: "referral" },
  { title: "Профиль",        subtitle: "Настройки аккаунта и личные данные",  href: "/respondent/profile", icon: "profile" },
];

const CLIENT_PAGES = [
  { title: "Обзор",          subtitle: "Главная страница кабинета",            href: "/client",                icon: "overview" },
  { title: "Мои опросы",     subtitle: "Управление созданными опросами",       href: "/client/surveys",        icon: "surveys" },
  { title: "Создать опрос",  subtitle: "Запустить новый опрос",                href: "/client/surveys/create", icon: "create" },
  { title: "Кошелёк",        subtitle: "Баланс и платежи",                     href: "/client/wallet",         icon: "wallet" },
  { title: "Настройки",      subtitle: "Настройки профиля и аккаунта",         href: "/client/settings",       icon: "settings" },
];

const ADMIN_PAGES = [
  { title: "Обзор",          subtitle: "Панель администратора",                href: "/admin",            icon: "overview" },
  { title: "Модерация",      subtitle: "Опросы на проверке",                   href: "/admin/moderation", icon: "shield" },
  { title: "Пользователи",   subtitle: "Управление пользователями платформы",  href: "/admin/users",      icon: "users" },
  { title: "Эксперты",       subtitle: "Список экспертов-рецензентов",         href: "/admin/experts",    icon: "experts" },
  { title: "Финансы",        subtitle: "Финансовая статистика и операции",     href: "/admin/finance",    icon: "finance" },
  { title: "Настройки",      subtitle: "Системные настройки платформы",        href: "/admin/settings",   icon: "settings" },
];

function mapSurveyStatus(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Активный",
    DRAFT: "Черновик",
    PENDING_MODERATION: "На модерации",
    PAUSED: "На паузе",
    COMPLETED: "Завершён",
    REJECTED: "Отклонён",
  };
  return map[status] ?? status;
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    RESPONDENT: "Респондент",
    CLIENT: "Заказчик",
    ADMIN: "Администратор",
  };
  return map[role] ?? role;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ groups: [], total: 0 }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 1) {
    return NextResponse.json({ groups: [], total: 0 });
  }

  const role = session.user.role;
  const userId = session.user.id;
  const groups: Array<{ label: string; type: string; results: Array<{ id: string; title: string; subtitle?: string; href: string; icon: string }> }> = [];

  // ── Pages (static, role-based) ────────────────────────────────────────────
  const pages = role === "ADMIN" ? ADMIN_PAGES : role === "CLIENT" ? CLIENT_PAGES : RESPONDENT_PAGES;
  const matchedPages = pages.filter(
    (p) => p.title.toLowerCase().includes(q.toLowerCase()) || p.subtitle.toLowerCase().includes(q.toLowerCase()),
  );
  if (matchedPages.length > 0) {
    groups.push({
      label: "Страницы",
      type: "page",
      results: matchedPages.map((p) => ({ id: p.href, title: p.title, subtitle: p.subtitle, href: p.href, icon: p.icon })),
    });
  }

  // ── Respondent ─────────────────────────────────────────────────────────────
  if (role === "RESPONDENT") {
    const availableSurveys = await prisma.survey.findMany({
      where: { status: "ACTIVE", title: { contains: q, mode: "insensitive" }, NOT: { surveyMode: "SELF_SERVICE" } },
      take: 5,
      select: { id: true, title: true, category: true, reward: true, estimatedTime: true },
    });
    if (availableSurveys.length > 0) {
      groups.push({
        label: "Доступные опросы",
        type: "survey",
        results: availableSurveys.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: [s.category, s.reward ? `${Number(s.reward)} ₽` : null, s.estimatedTime ? `~${s.estimatedTime} мин` : null].filter(Boolean).join(" · "),
          href: `/respondent/feed?q=${encodeURIComponent(q)}`,
          icon: "survey",
        })),
      });
    }

    const mySessions = await prisma.surveySession.findMany({
      where: {
        userId,
        status: "COMPLETED",
        survey: { title: { contains: q, mode: "insensitive" } },
      },
      take: 4,
      select: { survey: { select: { id: true, title: true, category: true } } },
    });
    if (mySessions.length > 0) {
      groups.push({
        label: "Мои пройденные опросы",
        type: "completed",
        results: mySessions.map((s) => ({
          id: s.survey.id,
          title: s.survey.title,
          subtitle: s.survey.category ?? "Завершён",
          href: `/respondent/surveys?tab=completed&q=${encodeURIComponent(q)}`,
          icon: "completed",
        })),
      });
    }
  }

  // ── Client ─────────────────────────────────────────────────────────────────
  if (role === "CLIENT") {
    const mySurveys = await prisma.survey.findMany({
      where: { creatorId: userId, title: { contains: q, mode: "insensitive" } },
      take: 6,
      select: { id: true, title: true, status: true, surveyMode: true, _count: { select: { sessions: true } } },
    });
    if (mySurveys.length > 0) {
      groups.push({
        label: "Ваши опросы",
        type: "survey",
        results: mySurveys.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: `${s._count.sessions} ответов · ${mapSurveyStatus(s.status)}`,
          href: (s.surveyMode ?? "POOL") === "SELF_SERVICE"
            ? `/client/surveys/self-service/${s.id}`
            : `/client/surveys/${s.id}`,
          icon: "survey",
        })),
      });
    }
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (role === "ADMIN") {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
      },
      take: 5,
      select: { id: true, name: true, email: true, role: true },
    });
    if (users.length > 0) {
      groups.push({
        label: "Пользователи",
        type: "user",
        results: users.map((u) => ({
          id: u.id,
          title: u.name ?? u.email,
          subtitle: `${u.email} · ${roleLabel(u.role)}`,
          href: `/admin/users?q=${encodeURIComponent(q)}`,
          icon: "user",
        })),
      });
    }

    const surveys = await prisma.survey.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, status: true },
    });
    if (surveys.length > 0) {
      groups.push({
        label: "Опросы",
        type: "survey",
        results: surveys.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: mapSurveyStatus(s.status),
          href: `/admin/moderation`,
          icon: "survey",
        })),
      });
    }
  }

  const total = groups.reduce((sum, g) => sum + g.results.length, 0);
  return NextResponse.json({ groups, total });
}
