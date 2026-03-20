import * as React from "react";
import { Banknote, Percent, Wallet2, TrendingUp } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";

type Row = {
  date: string;
  type: string;
  user: string;
  amount: string;
  fee: string;
  status: "completed" | "pending" | "failed";
};

const stats = [
  { label: "Оборот за месяц", value: "1 284 000 ₽", icon: <TrendingUp className="w-5 h-5" /> },
  { label: "Комиссия платформы", value: "12 800 ₽", icon: <Percent className="w-5 h-5" /> },
  { label: "Выплачено респондентам", value: "584 000 ₽", icon: <Wallet2 className="w-5 h-5" /> },
  { label: "Пополнений", value: "96", icon: <Banknote className="w-5 h-5" /> },
];

const rows: Row[] = [
  { date: "12.03.2026", type: "TOPUP", user: "brand@company.ru", amount: "+10 000 ₽", fee: "0 ₽", status: "completed" },
  { date: "11.03.2026", type: "COMMISSION", user: "brand@company.ru", amount: "+1 280 ₽", fee: "—", status: "completed" },
  { date: "10.03.2026", type: "WITHDRAWAL", user: "user1@mail.ru", amount: "-500 ₽", fee: "—", status: "pending" },
];

const columns: Column<Row>[] = [
  { key: "date", header: "Дата", cell: (r) => r.date },
  { key: "type", header: "Тип", cell: (r) => r.type },
  { key: "user", header: "Пользователь", cell: (r) => r.user },
  { key: "amount", header: "Сумма", cell: (r) => <span className="tabular-nums font-semibold">{r.amount}</span> },
  { key: "fee", header: "Комиссия", cell: (r) => <span className="tabular-nums">{r.fee}</span> },
  {
    key: "status",
    header: "Статус",
    cell: (r) => {
      const map = {
        completed: { v: "completed" as const, t: "Завершено" },
        pending: { v: "pending" as const, t: "Ожидание" },
        failed: { v: "rejected" as const, t: "Ошибка" },
      }[r.status];
      return <Badge variant={map.v}>{map.t}</Badge>;
    },
  },
];

export default function AdminFinancePage() {
  return (
    <div>
      <PageHeader title="Финансы" subtitle="Оборот, комиссии и транзакции." />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="mt-10 bg-dash-card border border-dash-border rounded-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-dash-heading font-body">Транзакции</p>
          <button type="button" className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors">
            Экспорт в Excel
          </button>
        </div>
        <div className="mt-5">
          <DataTable columns={columns} rows={rows} keyForRow={(r) => r.date + r.user + r.type} />
        </div>
      </div>

      <div className="mt-10 bg-dash-card border border-dash-border rounded-2xl p-6">
        <p className="text-sm font-semibold text-dash-heading font-body">Настройка комиссии</p>
        <p className="mt-2 text-sm text-dash-muted font-body">
          Текущая комиссия платформы: <span className="font-semibold text-dash-heading">15%</span>
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <input className="h-11 w-full sm:w-48 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="15" />
          <button type="button" className="h-11 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
