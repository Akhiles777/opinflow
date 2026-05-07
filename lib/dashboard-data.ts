import type { Role, SurveyStatus, TransactionStatus, TransactionType, UserStatus } from "@prisma/client";
import { getCommissionRate } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export type DashboardViewer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  roleLabel: string;
  initials: string;
};

function roleLabel(role: Role) {
  return role === "ADMIN" ? "Администратор" : role === "CLIENT" ? "Заказчик" : "Респондент";
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "PM";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function normalizeImageUrl(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function formatRub(amount: number | string | null | undefined) {
  const numeric = Number(amount ?? 0);
  const hasFraction = Math.abs(numeric % 1) > 0.001;
  return `${new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(numeric)} ₽`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU").format(date);
}

export async function getDashboardViewer(userId: string): Promise<DashboardViewer | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name?.trim() || "Пользователь",
    email: user.email,
    image: normalizeImageUrl(user.image),
    role: user.role,
    roleLabel: roleLabel(user.role),
    initials: getInitials(user.name ?? "", user.email),
  };
}

export async function getRespondentOverviewData(userId: string) {
  const now = new Date();
  const [viewer, wallet, completedCount, availableCount, referralCount, recentTransactions, surveys] =
    await Promise.all([
      getDashboardViewer(userId),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      }),
      prisma.surveySession.count({
        where: { userId, status: "COMPLETED", isValid: true },
      }),
      prisma.survey.count({
        where: {
          status: "ACTIVE",
          sessions: { none: { userId } },
          AND: [
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          ],
        },
      }),
      prisma.referral.count({ where: { senderId: userId } }),
      prisma.transaction.findMany({
        where: {
          wallet: { userId },
          status: "COMPLETED",
          type: { in: ["EARNING", "BONUS"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { amount: true, createdAt: true },
      }),
      prisma.survey.findMany({
        where: {
          status: { in: ["ACTIVE", "PAUSED"] },
          AND: [
            { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          ],
          OR: [
            { sessions: { some: { userId, status: "IN_PROGRESS" } } },
            { sessions: { none: { userId } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          category: true,
          title: true,
          status: true,
          sessions: {
            where: { userId },
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { id: true, status: true, isValid: true },
          },
          _count: {
            select: {
              sessions: { where: { status: "COMPLETED", isValid: true } },
            },
          },
        },
      }),
    ]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const earnedToday = recentTransactions
    .filter((item) => item.createdAt >= startOfToday)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    viewer,
    balance: Number(wallet?.balance ?? 0),
    completedCount,
    availableCount,
    referralCount,
    earnedToday,
    surveys: surveys.map((survey) => ({
      id: survey.id,
      category: survey.category || "Исследование",
      title: survey.title,
      status: survey.sessions[0]?.status === "IN_PROGRESS" || survey.status === "PAUSED"
        ? ("in-progress" as const)
        : ("available" as const),
      meta: `${survey._count.sessions} ответов`,
    })),
  };
}

export async function getWalletData(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      balance: true,
      totalEarned: true,
      totalSpent: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          createdAt: true,
          type: true,
          description: true,
          amount: true,
          status: true,
        },
      },
    },
  });

  return {
    balance: Number(wallet?.balance ?? 0),
    totalEarned: Number(wallet?.totalEarned ?? 0),
    totalSpent: Number(wallet?.totalSpent ?? 0),
    transactions:
      wallet?.transactions.map((item) => ({
        date: formatDate(item.createdAt),
        type: item.type,
        description: item.description ?? "Операция",
        amount: Number(item.amount),
        status: item.status,
      })) ?? [],
  };
}

export async function getRespondentReferralData(userId: string) {
  const [countInvited, referrals, bonusTransactions] = await Promise.all([
    prisma.referral.count({ where: { senderId: userId } }),
    prisma.referral.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        receiver: {
          select: {
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: {
        wallet: { userId },
        type: "BONUS",
        status: "COMPLETED",
      },
      select: { amount: true },
    }),
  ]);

  const registeredCount = referrals.length;
  const earned = bonusTransactions.reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    referralCode: userId.slice(0, 10),
    invitedCount: countInvited,
    registeredCount,
    earned,
    referrals: referrals.map((item) => {
      const displayName = item.receiver.name?.trim() || item.receiver.email.split("@")[0];
      return {
        name: `${displayName.slice(0, 1)}***`,
        date: formatDate(item.receiver.createdAt),
        status: item.receiver.status === "ACTIVE" ? "Активен" : "Зарегистрирован",
        bonus: item.bonusPaid ? 150 : 0,
      };
    }),
  };
}

export async function getClientOverviewData(userId: string) {
  const [viewer, wallet, surveys] = await Promise.all([
    getDashboardViewer(userId),
    prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    }),
    prisma.survey.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: {
            sessions: { where: { status: "COMPLETED", isValid: true } },
          },
        },
      },
    }),
  ]);

  const activeCount = surveys.filter((survey) => survey.status === "ACTIVE").length;
  const totalResponses = surveys.reduce((sum, survey) => sum + survey._count.sessions, 0);
  const moderationCount = surveys.filter((survey) => survey.status === "PENDING_MODERATION").length;

  return {
    viewer,
    balance: Number(wallet?.balance ?? 0),
    activeCount,
    totalResponses,
    totalSurveys: surveys.length,
    moderationCount,
    surveys: surveys.map((survey) => ({
      id: survey.id,
      title: survey.title,
      responses: survey._count.sessions,
      status: survey.status,
    })),
  };
}

export async function getClientSurveysData(userId: string) {
  const surveys = await prisma.survey.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      maxResponses: true,
      budget: true,
      status: true,
      _count: {
        select: {
          sessions: { where: { status: "COMPLETED", isValid: true } },
        },
      },
    },
  });

  return surveys.map((survey) => ({
    id: survey.id,
    title: survey.title,
    answers: survey._count.sessions,
    progress: survey.maxResponses ? `${survey._count.sessions} / ${survey.maxResponses}` : `${survey._count.sessions} ответов`,
    budget: survey.budget ? Number(survey.budget) : "—",
    status: mapSurveyStatus(survey.status),
  }));
}

export async function getRespondentSurveysData(userId: string) {
  const responses = await prisma.surveyResponse.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      survey: {
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      },
    },
  });

  return {
    inProgress: [] as Array<{ id: string; title: string; progress: string; deadline: string }>,
    completed: responses.map((response) => ({
      id: response.survey.id,
      date: formatDate(response.createdAt),
      title: response.survey.title,
      reward: "—",
    })),
  };
}

export async function getAdminOverviewData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const [pendingModeration, newUsers, monthTransactions, latestSurveys, latestUsers, latestTransactions] =
    await Promise.all([
      prisma.survey.count({ where: { status: "PENDING_MODERATION" } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: monthStart }, status: "COMPLETED" },
        select: { amount: true, type: true, createdAt: true, wallet: { select: { user: { select: { email: true } } } } },
      }),
      prisma.survey.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { title: true, status: true, createdAt: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { email: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        where: { status: "COMPLETED" },
        select: {
          amount: true,
          type: true,
          createdAt: true,
          wallet: { select: { user: { select: { email: true } } } },
        },
      }),
    ]);

  const turnover = monthTransactions.reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  const respondentPayouts = monthTransactions
    .filter((item) => item.type === "WITHDRAWAL" || item.type === "EARNING" || item.type === "BONUS")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);

  const events = [
    ...latestSurveys.map((item) => ({
      text: `${item.title} · ${mapSurveyStatus(item.status).t.toLowerCase()}`,
      time: formatDate(item.createdAt),
      sortAt: item.createdAt.getTime(),
    })),
    ...latestUsers.map((item) => ({
      text: `Новый пользователь ${item.email}`,
      time: formatDate(item.createdAt),
      sortAt: item.createdAt.getTime(),
    })),
    ...latestTransactions.map((item) => ({
      text: `${mapTransactionTypeForClient(item.type)} ${formatRub(Math.abs(Number(item.amount)))} · ${item.wallet.user.email}`,
      time: formatDate(item.createdAt),
      sortAt: item.createdAt.getTime(),
    })),
  ]
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 6);

  return {
    pendingModeration,
    newUsers,
    turnover,
    respondentPayouts,
    events: events.map(({ text, time }) => ({ text, time })),
  };
}

export async function getAdminUsersData() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      status: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    registered: formatDate(user.createdAt),
    activity: formatDate(user.updatedAt),
    status: mapUserStatus(user.status),
    href: `/${user.id}`,
  }));

 
}



export async function getAdminFinanceData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [transactions, commissionRate] = await Promise.all([
    prisma.transaction.findMany({
    where: { createdAt: { gte: monthStart } },
    orderBy: { createdAt: "desc" },
    include: {
      wallet: {
        select: {
          user: {
            select: { email: true },
          },
        },
      },
    },
    }),
    getCommissionRate(),
  ]);

  const turnover = transactions
    .filter((item) => item.status === "COMPLETED")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  // Комиссия платформы рассчитывается как 15% от списаний
  const commission = transactions
    .filter((item) => item.type === "SPENDING")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)) * commissionRate, 0);
  const paidOut = transactions
    .filter((item) => item.type === "WITHDRAWAL" && item.status === "COMPLETED")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  const depositCount = transactions.filter((item) => item.type === "DEPOSIT" && item.status === "COMPLETED").length;

  return {
    turnover,
    commission,
    paidOut,
    depositCount,
    rows: transactions.slice(0, 50).map((item) => ({
      id: item.id,
      date: formatDate(item.createdAt),
      type: item.type,
      user: item.wallet.user.email,
      amount: Number(item.amount),
      fee: item.type === "SPENDING" ? Number(item.amount) * commissionRate : 0,
      status: mapTransactionStatus(item.status),
    })),
  };
}

export function mapSurveyStatus(status: SurveyStatus) {
  return status === "ACTIVE"
    ? { v: "active" as const, t: "Активен" }
    : status === "PAUSED"
      ? { v: "pending" as const, t: "Пауза" }
      : status === "PENDING_MODERATION"
        ? { v: "moderation" as const, t: "На модерации" }
        : status === "COMPLETED"
          ? { v: "draft" as const, t: "Завершён" }
          : status === "REJECTED"
            ? { v: "rejected" as const, t: "Отклонён" }
            : { v: "draft" as const, t: "Черновик" };
}

export function mapTransactionStatus(status: TransactionStatus) {
  return status === "COMPLETED"
    ? { v: "completed" as const, t: "Завершено" }
    : status === "FAILED"
      ? { v: "rejected" as const, t: "Ошибка" }
      : status === "CANCELLED"
        ? { v: "draft" as const, t: "Отменено" }
        : { v: "pending" as const, t: "Ожидание" };
}

export function mapTransactionTypeForRespondent(type: TransactionType) {
  return type === "WITHDRAWAL" ? "Вывод" : "Начисление";
}

export function mapTransactionTypeForClient(type: TransactionType) {
  return type === "DEPOSIT" || type === "REFUND" ? "Пополнение" : "Списание";
}

export function mapUserStatus(status: UserStatus) {
  return status === "ACTIVE"
    ? { v: "active" as const, t: "Активен" }
    : status === "BLOCKED"
      ? { v: "rejected" as const, t: "Заблокирован" }
      : { v: "pending" as const, t: "Ожидает подтверждения" };
}
