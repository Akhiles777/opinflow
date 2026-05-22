import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, Shield, ShieldOff } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { formatRub } from "@/lib/dashboard-data";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/dashboard/Badge";
import StatCard from "@/components/dashboard/StatCard";
import AdminUserActions from "@/components/dashboard/AdminUserActions";

function fmt(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function fmtDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU").format(date);
}

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  await requireRole("ADMIN");
  const { userid } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userid },
    include: {
      respondentProfile: true,
      clientProfile: true,
      wallet: {
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
      surveysCreated: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, status: true, createdAt: true, budget: true },
      },
      surveySessions: {
        orderBy: { startedAt: "desc" },
        take: 10,
        include: {
          survey: { select: { title: true, reward: true } },
        },
      },
      withdrawalRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, amount: true, method: true, status: true, createdAt: true, adminNote: true },
      },
    },
  });

  if (!user) notFound();

  const statusVariant = user.status === "ACTIVE" ? "active" : user.status === "BLOCKED" ? "rejected" : "pending";
  const statusLabel = user.status === "ACTIVE" ? "Активен" : user.status === "BLOCKED" ? "Заблокирован" : "Не подтверждён";
  const roleLabel = user.role === "CLIENT" ? "Заказчик" : user.role === "ADMIN" ? "Администратор" : "Респондент";

  const balance = Number(user.wallet?.balance ?? 0);
  const totalEarned = Number(user.wallet?.totalEarned ?? 0);
  const totalSpent = Number(user.wallet?.totalSpent ?? 0);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-dash-muted transition-colors hover:text-dash-heading"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к пользователям
        </Link>
      </div>

      <PageHeader
        title={user.name ?? user.email}
        subtitle={user.email}
      />

      {/* Status & actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Badge variant={statusVariant}>{statusLabel}</Badge>
        <Badge variant="moderation">{roleLabel}</Badge>
        <span className="text-sm text-dash-muted">
          Регистрация: {fmtDate(user.createdAt)}
        </span>
        {user.role !== "ADMIN" && (
          <AdminUserActions userId={user.id} currentStatus={user.status} />
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Баланс"
          value={formatRub(balance)}
          icon={<Shield className="h-5 w-5" />}
        />
        {user.role === "RESPONDENT" && (
          <>
            <StatCard label="Всего заработано" value={formatRub(totalEarned)} icon={<Mail className="h-5 w-5" />} />
            <StatCard label="Прохождений" value={String(user.surveySessions.length)} icon={<Calendar className="h-5 w-5" />} />
          </>
        )}
        {user.role === "CLIENT" && (
          <>
            <StatCard label="Всего потрачено" value={formatRub(totalSpent)} icon={<Mail className="h-5 w-5" />} />
            <StatCard label="Опросов создано" value={String(user.surveysCreated.length)} icon={<Calendar className="h-5 w-5" />} />
          </>
        )}
      </div>

      {/* Profile details */}
      {user.respondentProfile && (
        <div className="mt-8 rounded-2xl border border-dash-border bg-dash-card p-6">
          <p className="mb-4 text-[15px] font-semibold text-dash-heading">Профиль респондента</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
            {[
              { label: "Пол", value: user.respondentProfile.gender },
              { label: "Город", value: user.respondentProfile.city },
              { label: "Образование", value: user.respondentProfile.education },
              { label: "Доход", value: user.respondentProfile.income },
              { label: "Занятость", value: user.respondentProfile.employmentStatus },
              { label: "Семейное положение", value: user.respondentProfile.maritalStatus },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <dt className="text-dash-muted">{label}</dt>
                  <dd className="mt-0.5 font-medium text-dash-heading">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
      )}

      {user.clientProfile && (
        <div className="mt-6 rounded-2xl border border-dash-border bg-dash-card p-6">
          <p className="mb-4 text-[15px] font-semibold text-dash-heading">Профиль заказчика</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
            {[
              { label: "Компания", value: user.clientProfile.companyName },
              { label: "ИНН", value: user.clientProfile.inn },
              { label: "Контакт", value: user.clientProfile.contactName },
              { label: "Телефон", value: user.clientProfile.phone },
              { label: "Банк", value: user.clientProfile.bankName },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <dt className="text-dash-muted">{label}</dt>
                  <dd className="mt-0.5 font-medium text-dash-heading">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
      )}

      {/* Surveys (client) */}
      {user.role === "CLIENT" && user.surveysCreated.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-6 py-4">
            <p className="text-[15px] font-semibold text-dash-heading">Созданные опросы</p>
          </div>
          <div className="divide-y divide-dash-border">
            {user.surveysCreated.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-dash-heading">{s.title}</p>
                  <p className="text-xs text-dash-muted">{fmtDate(s.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.budget && <span className="text-sm text-dash-muted">{formatRub(Number(s.budget))}</span>}
                  <Badge variant={
                    s.status === "ACTIVE" ? "active" :
                    s.status === "REJECTED" ? "rejected" :
                    s.status === "PENDING_MODERATION" ? "moderation" :
                    s.status === "COMPLETED" ? "completed" : "pending"
                  }>
                    {s.status === "ACTIVE" ? "Активен" :
                     s.status === "REJECTED" ? "Отклонён" :
                     s.status === "PENDING_MODERATION" ? "На модерации" :
                     s.status === "COMPLETED" ? "Завершён" :
                     s.status === "DRAFT" ? "Черновик" : "Приостановлен"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Survey sessions (respondent) */}
      {user.role === "RESPONDENT" && user.surveySessions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-6 py-4">
            <p className="text-[15px] font-semibold text-dash-heading">Прохождения опросов</p>
          </div>
          <div className="divide-y divide-dash-border">
            {user.surveySessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-dash-heading">{s.survey.title}</p>
                  <p className="text-xs text-dash-muted">{fmt(s.startedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.survey.reward && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +{formatRub(Number(s.survey.reward))}
                    </span>
                  )}
                  <Badge variant={
                    s.status === "COMPLETED" && s.isValid ? "active" :
                    s.status === "COMPLETED" && !s.isValid ? "rejected" :
                    s.status === "REJECTED" ? "rejected" : "pending"
                  }>
                    {s.status === "COMPLETED" && s.isValid ? "Зачтено" :
                     s.status === "COMPLETED" ? "Не зачтено" :
                     s.status === "IN_PROGRESS" ? "В процессе" : "Отклонено"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal requests (respondent) */}
      {user.role === "RESPONDENT" && user.withdrawalRequests.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-6 py-4">
            <p className="text-[15px] font-semibold text-dash-heading">Заявки на вывод</p>
          </div>
          <div className="divide-y divide-dash-border">
            {user.withdrawalRequests.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-dash-heading">{formatRub(Number(w.amount))}</p>
                  <p className="text-xs text-dash-muted">{w.method} · {fmtDate(w.createdAt)}</p>
                  {w.adminNote && <p className="text-xs text-red-500 mt-0.5">{w.adminNote}</p>}
                </div>
                <Badge variant={
                  w.status === "COMPLETED" ? "active" :
                  w.status === "REJECTED" || w.status === "FAILED" ? "rejected" :
                  w.status === "PROCESSING" ? "moderation" : "pending"
                }>
                  {w.status === "COMPLETED" ? "Выплачено" :
                   w.status === "REJECTED" ? "Отклонено" :
                   w.status === "FAILED" ? "Ошибка" :
                   w.status === "PROCESSING" ? "Обрабатывается" : "Ожидает"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {user.wallet && user.wallet.transactions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dash-border bg-dash-card">
          <div className="border-b border-dash-border px-6 py-4">
            <p className="text-[15px] font-semibold text-dash-heading">Последние транзакции</p>
          </div>
          <div className="divide-y divide-dash-border">
            {user.wallet.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm text-dash-body">{t.description ?? t.type}</p>
                  <p className="text-xs text-dash-muted">{fmt(t.createdAt)}</p>
                </div>
                <span className={[
                  "text-sm font-semibold",
                  ["EARNING", "DEPOSIT", "REFUND", "BONUS"].includes(t.type)
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500",
                ].join(" ")}>
                  {["EARNING", "DEPOSIT", "REFUND", "BONUS"].includes(t.type) ? "+" : "−"}{formatRub(Math.abs(Number(t.amount)))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
