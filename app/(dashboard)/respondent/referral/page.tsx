import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";

type Row = {
  name: string;
  date: string;
  status: string;
  bonus: string;
};

const rows: Row[] = [
  { name: "А***", date: "05.03.2026", status: "Зарегистрирован", bonus: "120 ₽" },
  { name: "М***", date: "01.03.2026", status: "Активен", bonus: "80 ₽" },
];

const columns: Column<Row>[] = [
  { key: "name", header: "Имя", cell: (r) => r.name },
  { key: "date", header: "Регистрация", cell: (r) => r.date },
  { key: "status", header: "Статус", cell: (r) => r.status },
  { key: "bonus", header: "Ваш бонус", cell: (r) => <span className="tabular-nums font-semibold text-brand">{r.bonus}</span> },
];

export default function RespondentReferralPage() {
  return (
    <div>
      <PageHeader title="Рефералы" subtitle="Ссылка, статистика и приглашённые пользователи." />

      <div className="mt-8">
        <div className="rounded-2xl border border-dash-border bg-dash-card p-8">
          <p className="mb-2 text-sm font-body text-dash-muted">Ваша реферальная ссылка</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value="https://potokmneny.ru/r/abc123"
              className="h-11 min-w-0 flex-1 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body"
            />
            <button type="button" className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Скопировать
            </button>
          </div>
          <p className="mt-3 text-xs font-body text-dash-muted">Состояние “Скопировано ✓” добавим на Этапе 2.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Приглашено", value: "3" },
            { label: "Зарегистрировалось", value: "2" },
            { label: "Заработано", value: "200 ₽" },
          ].map((s) => (
            <div key={s.label} className="min-w-0 rounded-2xl border border-dash-border bg-dash-card p-6">
              <p className="text-sm text-dash-muted font-body">{s.label}</p>
              <p className="mt-2 break-words font-display text-2xl font-bold tabular-nums text-dash-heading sm:text-3xl">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          Приглашённые
        </p>
        <DataTable columns={columns} rows={rows} keyForRow={(r) => r.name + r.date} />
      </div>
    </div>
  );
}
