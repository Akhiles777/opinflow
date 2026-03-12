"use client";

import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";

type Row = {
  email: string;
  role: "RESPONDENT" | "CLIENT";
  registered: string;
  activity: string;
  status: "active" | "blocked" | "new";
};

const rows: Row[] = [
  { email: "user1@mail.ru", role: "RESPONDENT", registered: "10.03.2026", activity: "сегодня", status: "active" },
  { email: "brand@company.ru", role: "CLIENT", registered: "02.03.2026", activity: "вчера", status: "active" },
  { email: "suspect@mail.ru", role: "RESPONDENT", registered: "12.03.2026", activity: "нет", status: "blocked" },
];

const tabs = [
  { label: "Все", value: "all" },
  { label: "Респонденты", value: "RESPONDENT" },
  { label: "Заказчики", value: "CLIENT" },
  { label: "Заблокированные", value: "blocked" },
] as const;

export default function AdminUsersPage() {
  const [tab, setTab] = React.useState<(typeof tabs)[number]["value"]>("all");

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "blocked") return r.status === "blocked";
    return r.role === tab;
  });

  const columns: Column<Row>[] = [
    { key: "user", header: "Пользователь", cell: (r) => r.email, className: "max-w-[420px]" },
    { key: "role", header: "Роль", cell: (r) => r.role },
    { key: "reg", header: "Регистрация", cell: (r) => r.registered },
    { key: "act", header: "Активность", cell: (r) => r.activity },
    {
      key: "status",
      header: "Статус",
      cell: (r) => {
        const map =
          r.status === "active"
            ? { v: "active" as const, t: "Активен" }
            : r.status === "blocked"
            ? { v: "rejected" as const, t: "Заблокирован" }
            : { v: "pending" as const, t: "Новый" };
        return <Badge variant={map.v}>{map.t}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Действия",
      cell: (r) => (
        <div className="flex gap-3">
          <a className="text-sm font-semibold text-brand hover:underline" href="#">Просмотреть</a>
          <a className="text-sm font-semibold text-brand hover:underline" href="#">
            {r.status === "blocked" ? "Разблокировать" : "Заблокировать"}
          </a>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Пользователи" subtitle="Поиск, фильтры, блокировки и роли." />

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={[
              "px-4 py-2 rounded-xl text-sm font-semibold font-body border transition-colors",
              t.value === tab
                ? "bg-brand/10 border-brand/30 text-brand"
                : "bg-dash-card border-dash-border text-dash-muted hover:text-dash-heading hover:bg-dash-bg",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <DataTable columns={columns} rows={filtered} keyForRow={(r) => r.email} />
      </div>
    </div>
  );
}

