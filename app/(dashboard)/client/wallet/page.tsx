import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";

type Row = {
  date: string;
  type: "Пополнение" | "Списание";
  description: string;
  amount: string;
  status: "completed" | "pending" | "failed";
};

const rows: Row[] = [
  { date: "12.03.2026", type: "Пополнение", description: "ЮKassa", amount: "+10 000 ₽", status: "completed" },
  { date: "11.03.2026", type: "Списание", description: "Опрос: доставка", amount: "-12 800 ₽", status: "completed" },
  { date: "11.03.2026", type: "Списание", description: "Комиссия платформы", amount: "-1 280 ₽", status: "completed" },
];

const columns: Column<Row>[] = [
  { key: "date", header: "Дата", cell: (r) => r.date },
  { key: "type", header: "Тип", cell: (r) => r.type },
  { key: "desc", header: "Описание", cell: (r) => r.description },
  { key: "amount", header: "Сумма", cell: (r) => <span className="tabular-nums font-semibold">{r.amount}</span> },
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

export default function ClientWalletPage() {
  return (
    <div>
      <PageHeader title="Кошелёк" subtitle="Баланс заказчика, пополнения и списания." />

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-dash-sidebar text-white p-8">
          <p className="text-sm text-white/40 mb-2 font-body">Текущий баланс</p>
          <p className="font-display text-5xl text-white font-bold mb-6 tabular-nums">45 200 ₽</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white hover:bg-brand-mid transition-colors"
          >
            Пополнить баланс
          </button>
          <p className="mt-3 text-xs text-white/35 font-body">Модал пополнения подключим на Этапе 4.</p>
        </div>

        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Справка</p>
          <p className="mt-2 text-sm text-dash-muted font-body leading-relaxed">
            Здесь будет выбор способа пополнения: карта или безналичный счёт для юрлиц.
          </p>
          <div className="mt-6 grid gap-2">
            <div className="rounded-xl border border-dash-border bg-dash-bg p-4">
              <p className="text-sm font-semibold text-dash-heading font-body">Комиссия</p>
              <p className="mt-1 text-sm text-dash-muted font-body">Покажем расчёт комиссии перед запуском опроса.</p>
            </div>
            <div className="rounded-xl border border-dash-border bg-dash-bg p-4">
              <p className="text-sm font-semibold text-dash-heading font-body">Документы</p>
              <p className="mt-1 text-sm text-dash-muted font-body">Счёт/акт/оферта будут доступны после Этапа 5.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          История операций
        </p>
        <DataTable columns={columns} rows={rows} keyForRow={(r) => r.date + r.description} />
      </div>
    </div>
  );
}

