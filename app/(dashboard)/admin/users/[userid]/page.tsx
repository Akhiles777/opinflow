import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import { getAdminUsersData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

type TabValue = "all" | "RESPONDENT" | "CLIENT" | "blocked";

type Row = Awaited<ReturnType<typeof getAdminUsersData>>[number];

const tabs = [
  { label: "Все", value: "all" },
  { label: "Респонденты", value: "RESPONDENT" },
  { label: "Заказчики", value: "CLIENT" },
  { label: "Заблокированные", value: "blocked" },
] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await requireRole("ADMIN");
  const params = (await searchParams) ?? {};

  const tab = (params.tab as TabValue) || "all";
  const users = await getAdminUsersData();
  

  const filtered = users.filter((u) => {
    if (tab === "all") return true;
    if (tab === "blocked") return u.status.v === "rejected";
    return u.role === tab;
  });

  const columns: Column<Row>[] = [
    { key: "user", header: "Пользователь", cell: (r) => r.email, className: "max-w-[280px] lg:max-w-[420px]" },
    { key: "role", header: "Роль", cell: (r) => (r.role === "CLIENT" ? "Заказчик" : r.role === "ADMIN" ? "Администратор" : "Респондент") },
    { key: "reg", header: "Регистрация", cell: (r) => r.registered },
    { key: "act", header: "Активность", cell: (r) => r.activity },
    {
      key: "status",
      header: "Статус",
      cell: (r) => <Badge variant={r.status.v}>{r.status.t}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader title="Пользователи" subtitle="Реальные пользователи, роли и статусы из базы данных." />

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.value === tab;
          const href = t.value === "all" ? "/admin/users" : `/admin/users?tab=${t.value}`;
          return (
            <a
              key={t.value}
              href={href}
              className={[
                "rounded-xl border px-4 py-2 text-sm font-semibold font-body transition-colors",
                active
                  ? "bg-brand/10 border-brand/30 text-brand"
                  : "bg-dash-card border-dash-border text-dash-muted hover:text-dash-heading hover:bg-dash-bg",
              ].join(" ")}
            >
              {t.label}
            </a>
          );
        })}
      </div>

      <div className="mt-8">
        {filtered.length > 0 ? (
          <DataTable columns={columns} users={filtered} keyForRow={(r) => r.id} />
        ) : (
          <EmptyState title="Пользователи не найдены" description="По текущему фильтру в базе пока нет подходящих аккаунтов." />
        )}
      </div>
    </div>
  );
}
