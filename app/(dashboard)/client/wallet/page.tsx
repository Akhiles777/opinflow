import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  formatRub,
  getWalletData,
  mapTransactionStatus,
  mapTransactionTypeForClient,
} from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

type Row = {
  date: string;
  type: "Пополнение" | "Списание";
  description: string;
  amount: string;
  status: "completed" | "pending" | "rejected" | "draft";
};

const columns: Column<Row>[] = [
  { key: "date", header: "Дата", cell: (r) => r.date },
  { key: "type", header: "Тип", cell: (r) => r.type },
  { key: "desc", header: "Описание", cell: (r) => r.description },
  { key: "amount", header: "Сумма", cell: (r) => <span className="tabular-nums font-semibold">{r.amount}</span> },
  {
    key: "status",
    header: "Статус",
    cell: (r) => <Badge variant={r.status}>{mapTransactionStatusText(r.status)}</Badge>,
  },
];

function mapTransactionStatusText(status: Row["status"]) {
  return status === "completed" ? "Завершено" : status === "pending" ? "Ожидание" : status === "rejected" ? "Ошибка" : "Отменено";
}

export default async function ClientWalletPage() {
  const session = await requireRole("CLIENT");
  const wallet = await getWalletData(session.user.id);
  const rows: Row[] = wallet.transactions.map((item) => {
    const type = mapTransactionTypeForClient(item.type);
    return {
      date: item.date,
      type,
      description: item.description,
      amount: `${type === "Пополнение" ? "+" : "-"}${formatRub(Math.abs(item.amount))}`,
      status: mapTransactionStatus(item.status).v,
    };
  });

  return (
    <div>
      <PageHeader title="Кошелёк" subtitle="Баланс заказчика, пополнения и списания." />

      <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
        <div className="rounded-2xl border border-dash-border bg-dash-card p-8">
          <p className="mb-2 text-sm font-body text-dash-muted">Текущий баланс</p>
          <p className="mb-6 font-display text-4xl font-bold tabular-nums text-dash-heading sm:text-5xl">{formatRub(wallet.balance)}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white hover:bg-brand-mid transition-colors"
          >
            Пополнить баланс
          </button>
          <p className="mt-3 text-xs font-body text-dash-muted">Модал пополнения подключим на Этапе 4.</p>
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
        {rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} keyForRow={(r) => r.date + r.description} />
        ) : (
          <EmptyState
            title="Операций пока нет"
            description="После пополнения баланса и запуска опросов здесь появится история списаний и пополнений."
          />
        )}
      </div>
    </div>
  );
}
