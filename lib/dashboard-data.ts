import type { Role, SurveyStatus, TransactionStatus, TransactionType } from "@prisma/client";
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
    image: user.image,
    role: user.role,
    roleLabel: roleLabel(user.role),
    initials: getInitials(user.name ?? "", user.email),
  };
}

export async function getRespondentOverviewData(userId: string) {
  const [viewer, wallet, completedCount, availableCount, referralCount, recentTransactions, surveys] =
    await Promise.all([
      getDashboardViewer(userId),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      }),
      prisma.surveyResponse.count({ where: { userId } }),
      prisma.survey.count({ where: { status: "ACTIVE" } }),
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
        where: { status: { in: ["ACTIVE", "PAUSED", "COMPLETED"] } },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          _count: { select: { responses: true } },
          responses: { where: { userId }, select: { id: true }, take: 1 },
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
      status: survey.responses.length > 0 ? ("completed" as const) : survey.status === "PAUSED" ? ("in-progress" as const) : ("available" as const),
      meta: `${survey._count.responses} ответов`,
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
      include: {
        _count: { select: { responses: true } },
      },
    }),
  ]);

  const activeCount = surveys.filter((survey) => survey.status === "ACTIVE").length;
  const totalResponses = surveys.reduce((sum, survey) => sum + survey._count.responses, 0);
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
      responses: survey._count.responses,
      status: survey.status,
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
