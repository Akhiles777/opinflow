import * as React from "react";
import { Banknote, Percent, Wallet2, TrendingUp } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import AdminFinanceExportButton from "@/components/dashboard/AdminFinanceExportButton";
import { formatRub, getAdminFinanceData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

type Row = Awaited<ReturnType<typeof getAdminFinanceData>>["rows"][number];

export default async function AdminFinancePage() {
  await requireRole("ADMIN");
  const data = await getAdminFinanceData();

  const stats = [
    { label: "Оборот за месяц", value: formatRub(data.turnover), icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Комиссия платформы", value: formatRub(data.commission), icon: <Percent className="w-5 h-5" /> },
    { label: "Выплачено респондентам", value: formatRub(data.paidOut), icon: <Wallet2 className="w-5 h-5" /> },
    { label: "Пополнений", value: String(data.depositCount), icon: <Banknote className="w-5 h-5" /> },
  ];

  const columns: Column<Row>[] = [
    { key: "date", header: "Дата", cell: (r) => r.date },
    { key: "type", header: "Тип", cell: (r) => r.type },
    { key: "user", header: "Пользователь", cell: (r) => r.user },
    { key: "amount", header: "Сумма", cell: (r) => <span className="tabular-nums font-semibold">{formatRub(r.amount)}</span> },
    { key: "fee", header: "Комиссия", cell: (r) => <span className="tabular-nums">{r.fee > 0 ? formatRub(r.fee) : "—"}</span> },
    {
      key: "status",
      header: "Статус",
      cell: (r) => <Badge variant={r.status.v}>{r.status.t}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader title="Финансы" subtitle="Реальные транзакции, оборот и комиссии из базы данных." />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-semibold text-dash-heading font-body">Транзакции</p>
          <AdminFinanceExportButton rows={data.rows} />
        </div>
        <div className="mt-5">
          {data.rows.length > 0 ? (
            <DataTable columns={columns} users={data.rows} keyForRow={(r) => r.id} />
          ) : (
            <EmptyState title="Транзакций пока нет" description="Как только пользователи начнут пополнять кошельки и выводить средства, операции появятся здесь." />
          )}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-dash-border bg-dash-card p-6">
        <p className="text-[15px] font-semibold text-dash-heading font-body">Настройка комиссии</p>
        <p className="mt-2 text-[15px] text-dash-muted font-body">
          В рамках Этапа 2 комиссия пока только отображается. Управление значением подключим в следующем этапе.
        </p>
        <div className="mt-5">
          <span className="inline-flex rounded-xl border border-dash-border bg-dash-bg px-4 py-3 text-[15px] font-semibold text-dash-heading">
            Текущая расчётная комиссия: 15%
          </span>
        </div>
      </div>
    </div>
  );
}
