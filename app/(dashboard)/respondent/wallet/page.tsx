import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";

type Row = {
  date: string;
  type: "Начисление" | "Вывод";
  description: string;
  amount: string;
  status: "completed" | "pending" | "failed";
};

const rows: Row[] = [
  { date: "12.03.2026", type: "Начисление", description: "Опрос: доставка", amount: "+120 ₽", status: "completed" },
  { date: "11.03.2026", type: "Начисление", description: "Опрос: кофе", amount: "+220 ₽", status: "completed" },
  { date: "10.03.2026", type: "Вывод", description: "СБП (телефон)", amount: "-500 ₽", status: "pending" },
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

export default function RespondentWalletPage() {
  return (
    <div>
      <PageHeader
        title="Кошелёк"
        subtitle="Баланс, вывод средств и история транзакций."
      />

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-dash-sidebar text-white p-8">
          <p className="text-sm text-white/40 mb-2 font-body">Доступный баланс</p>
          <p className="font-display text-5xl text-white font-bold mb-6 tabular-nums">1 240 ₽</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white hover:bg-brand-mid transition-colors"
          >
            Вывести средства
          </button>
          <p className="mt-3 text-xs text-white/35 font-body">Модал вывода подключим на Этапе 4.</p>
        </div>

        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Статистика</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Заработано", value: "8 940 ₽" },
              { label: "В этом месяце", value: "1 540 ₽" },
              { label: "Выведено", value: "2 300 ₽" },
            ].map((i) => (
              <div key={i.label} className="rounded-xl border border-dash-border bg-dash-bg p-4">
                <p className="text-xs text-dash-muted font-body">{i.label}</p>
                <p className="mt-2 text-lg font-semibold text-dash-heading tabular-nums">{i.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          История транзакций
        </p>
        <DataTable columns={columns} rows={rows} keyForRow={(r) => r.date + r.description} />
      </div>
    </div>
  );
}

