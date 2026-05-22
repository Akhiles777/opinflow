"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ShieldOff, Eye, MessageSquareWarning } from "lucide-react";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import Modal from "@/components/dashboard/Modal";
import { toggleUserBlockAction, resolveComplaintAction } from "@/actions/admin-settings";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: "RESPONDENT" | "CLIENT" | "ADMIN";
  status: "ACTIVE" | "PENDING_VERIFICATION" | "BLOCKED";
  registered: string;
  balance: number;
  totalEarned: number;
  surveysCount: number;
  extra: string;
};

type ComplaintRow = {
  id: string;
  fromEmail: string;
  fromName: string;
  surveyTitle: string;
  surveyId: string | null;
  reason: string;
  details: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  date: string;
};

type Props = {
  users: UserRow[];
  complaints: ComplaintRow[];
  activeTab: string;
  searchQuery: string;
};

const TABS = [
  { label: "Все", value: "all" },
  { label: "Респонденты", value: "RESPONDENT" },
  { label: "Заказчики", value: "CLIENT" },
  { label: "Заблокированные", value: "blocked" },
  { label: "Жалобы", value: "complaints" },
] as const;

function roleLabel(role: UserRow["role"]) {
  if (role === "CLIENT") return "Заказчик";
  if (role === "ADMIN") return "Администратор";
  return "Респондент";
}

function statusVariant(status: UserRow["status"]): "active" | "pending" | "rejected" {
  if (status === "ACTIVE") return "active";
  if (status === "BLOCKED") return "rejected";
  return "pending";
}

function statusLabel(status: UserRow["status"]) {
  if (status === "ACTIVE") return "Активен";
  if (status === "BLOCKED") return "Заблокирован";
  return "Не подтверждён";
}

function complaintStatusVariant(status: ComplaintRow["status"]): "active" | "pending" | "rejected" | "moderation" {
  if (status === "RESOLVED") return "active";
  if (status === "DISMISSED") return "rejected";
  if (status === "REVIEWED") return "moderation";
  return "pending";
}

function complaintStatusLabel(status: ComplaintRow["status"]) {
  if (status === "RESOLVED") return "Решено";
  if (status === "DISMISSED") return "Отклонено";
  if (status === "REVIEWED") return "Проверяется";
  return "Ожидает";
}

function formatRub(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
}

export default function AdminUsersClient({ users, complaints, activeTab, searchQuery }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [blockTarget, setBlockTarget] = useState<UserRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const url = new URL(window.location.href);
    if (localSearch.trim()) {
      url.searchParams.set("q", localSearch.trim());
    } else {
      url.searchParams.delete("q");
    }
    router.push(url.pathname + url.search);
  }

  function handleTabChange(value: string) {
    const url = new URL(window.location.href);
    if (value === "all") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", value);
    }
    url.searchParams.delete("q");
    setLocalSearch("");
    router.push(url.pathname + url.search);
  }

  function handleToggleBlock() {
    if (!blockTarget) return;
    setError(null);
    startTransition(async () => {
      const res = await toggleUserBlockAction(blockTarget.id);
      if (res.error) {
        setError(res.error);
      } else {
        setBlockTarget(null);
        router.refresh();
      }
    });
  }

  function handleResolveComplaint(id: string, status: "RESOLVED" | "DISMISSED") {
    startTransition(async () => {
      await resolveComplaintAction(id, status);
      router.refresh();
    });
  }

  const showComplaints = activeTab === "complaints";

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.value === activeTab || (t.value === "all" && !activeTab);
          return (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={[
                "rounded-xl border px-4 py-2 text-sm font-semibold font-body transition-colors",
                active
                  ? "bg-brand/10 border-brand/30 text-brand"
                  : "bg-dash-card border-dash-border text-dash-muted hover:text-dash-heading hover:bg-dash-bg",
              ].join(" ")}
            >
              {t.label}
              {t.value === "complaints" && complaints.filter((c) => c.status === "PENDING").length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {complaints.filter((c) => c.status === "PENDING").length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search (only for users tabs) */}
      {!showComplaints && (
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Поиск по email или имени..."
            className="h-10 w-full max-w-sm rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            className="h-10 rounded-xl border border-brand/30 bg-brand/10 px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand/20"
          >
            Найти
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setLocalSearch(""); router.push(window.location.pathname + (activeTab !== "all" ? `?tab=${activeTab}` : "")); }}
              className="h-10 rounded-xl border border-dash-border px-4 text-sm text-dash-muted transition-colors hover:text-dash-heading"
            >
              Сбросить
            </button>
          )}
        </form>
      )}

      {/* Users table */}
      {!showComplaints && (
        <div className="mt-6">
          {users.length === 0 ? (
            <EmptyState title="Пользователи не найдены" description="По текущему фильтру нет подходящих аккаунтов." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-dash-border bg-dash-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Пользователь</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Роль</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Статус</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Регистрация</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Баланс</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Активность</th>
                      <th className="px-4 py-3 text-right font-semibold text-dash-muted">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-dash-heading truncate max-w-[220px]">{u.email}</p>
                            {u.name && <p className="text-xs text-dash-muted">{u.name}</p>}
                            {u.extra && <p className="text-xs text-dash-muted">{u.extra}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-dash-body">{roleLabel(u.role)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(u.status)}>{statusLabel(u.status)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-dash-muted">{u.registered}</td>
                        <td className="px-4 py-3 text-dash-body">{formatRub(u.balance)}</td>
                        <td className="px-4 py-3 text-dash-muted">
                          {u.role === "CLIENT"
                            ? `${u.surveysCount} опросов`
                            : `${u.surveysCount} прохождений`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-dash-border text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-heading"
                              title="Просмотреть профиль"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {u.role !== "ADMIN" && (
                              <button
                                onClick={() => { setError(null); setBlockTarget(u); }}
                                className={[
                                  "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                                  u.status === "BLOCKED"
                                    ? "border-green-500/30 text-green-500 hover:bg-green-500/10"
                                    : "border-red-500/30 text-red-500 hover:bg-red-500/10",
                                ].join(" ")}
                                title={u.status === "BLOCKED" ? "Разблокировать" : "Заблокировать"}
                              >
                                {u.status === "BLOCKED"
                                  ? <Shield className="h-4 w-4" />
                                  : <ShieldOff className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complaints tab */}
      {showComplaints && (
        <div className="mt-6">
          {complaints.length === 0 ? (
            <EmptyState title="Жалоб нет" description="Жалобы от пользователей появятся здесь." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-dash-border bg-dash-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dash-border">
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">От кого</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Опрос</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Причина</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Дата</th>
                      <th className="px-4 py-3 text-left font-semibold text-dash-muted">Статус</th>
                      <th className="px-4 py-3 text-right font-semibold text-dash-muted">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id} className="border-b border-dash-border last:border-0 hover:bg-dash-bg transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-dash-heading truncate max-w-[180px]">{c.fromEmail}</p>
                          {c.fromName && <p className="text-xs text-dash-muted">{c.fromName}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {c.surveyId ? (
                            <Link href={`/admin/moderation?id=${c.surveyId}`} className="text-brand hover:underline truncate max-w-[160px] block">
                              {c.surveyTitle}
                            </Link>
                          ) : (
                            <span className="text-dash-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-dash-body truncate max-w-[200px]">{c.reason}</p>
                          {c.details && <p className="text-xs text-dash-muted mt-0.5 truncate max-w-[200px]">{c.details}</p>}
                        </td>
                        <td className="px-4 py-3 text-dash-muted">{c.date}</td>
                        <td className="px-4 py-3">
                          <Badge variant={complaintStatusVariant(c.status)}>{complaintStatusLabel(c.status)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {c.status === "PENDING" || c.status === "REVIEWED" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleResolveComplaint(c.id, "RESOLVED")}
                                disabled={isPending}
                                className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-600 transition-colors hover:bg-green-500/20 disabled:opacity-50 dark:text-green-400"
                              >
                                Решено
                              </button>
                              <button
                                onClick={() => handleResolveComplaint(c.id, "DISMISSED")}
                                disabled={isPending}
                                className="rounded-lg border border-dash-border px-3 py-1.5 text-xs font-semibold text-dash-muted transition-colors hover:bg-dash-bg disabled:opacity-50"
                              >
                                Отклонить
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <MessageSquareWarning className="h-4 w-4 text-dash-muted opacity-40" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Block/Unblock confirmation modal */}
      <Modal
        open={!!blockTarget}
        onClose={() => { setBlockTarget(null); setError(null); }}
        title={blockTarget?.status === "BLOCKED" ? "Разблокировать пользователя?" : "Заблокировать пользователя?"}
      >
        <div className="space-y-4">
          <p className="text-sm text-dash-body">
            {blockTarget?.status === "BLOCKED"
              ? `Пользователь ${blockTarget.email} снова сможет входить на платформу.`
              : `Пользователь ${blockTarget?.email} потеряет доступ к платформе. Отменить можно в любой момент.`}
          </p>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleToggleBlock}
              disabled={isPending}
              className={[
                "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50",
                blockTarget?.status === "BLOCKED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
              ].join(" ")}
            >
              {isPending ? "Сохраняем..." : blockTarget?.status === "BLOCKED" ? "Разблокировать" : "Заблокировать"}
            </button>
            <button
              onClick={() => { setBlockTarget(null); setError(null); }}
              className="flex-1 rounded-xl border border-dash-border py-2.5 text-sm font-semibold text-dash-muted transition-colors hover:bg-dash-bg"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
