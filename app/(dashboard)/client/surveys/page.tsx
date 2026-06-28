import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import OrderExpertButton from "@/components/dashboard/OrderExpertButton";
import TurnkeyOrderModal from "@/components/dashboard/TurnkeyOrderModal";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatRub, getClientSurveysData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

type Row = Awaited<ReturnType<typeof getClientSurveysData>>[number];

export default async function ClientSurveysPage() {
  const session = await requireRole("CLIENT");
  const rows = await getClientSurveysData(session.user.id);

  const columns: Column<Row>[] = [
    { key: "title", header: "Название", cell: (r) => r.title, className: "max-w-[320px] lg:max-w-[520px]" },
    { key: "progress", header: "Прогресс", cell: (r) => <span className="tabular-nums">{r.progress}</span> },
    { key: "answers", header: "Ответов", cell: (r) => <span className="tabular-nums">{r.answers}</span> },
    { key: "budget", header: "Бюджет", cell: (r) => <span className="tabular-nums font-semibold">{r.budget === "—" ? "—" : formatRub(r.budget)}</span> },
    {
      key: "status",
      header: "Статус",
      cell: (r) => <Badge variant={r.status.v}>{r.status.t}</Badge>,
    },
    {
      key: "actions",
      header: "Действия",
      cell: (r) =>
        r.isDraft ? (
          <a
            className="inline-flex items-center rounded-lg bg-brand/10 px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/20 transition-colors"
            href={`/client/surveys/create?draft=${r.id}`}
          >
            Продолжить заполнение
          </a>
        ) : (
          <div className="flex flex-wrap gap-3 items-center">
            <a className="text-sm font-semibold text-brand hover:underline" href={`/client/surveys/${r.id}`}>Статистика</a>
            <OrderExpertButton surveyId={r.id} answers={r.answers} expertReview={r.expertReview} />
          </div>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Мои опросы"
        subtitle="Реальные опросы заказчика, статусы и количество ответов."
        right={
          <div className="flex flex-wrap items-center gap-3">
            <TurnkeyOrderModal />
            <a
              href="/client/surveys/create"
              className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors"
            >
              Создать опрос
            </a>
          </div>
        }
      />

      <div className="mt-8">
        {rows.length > 0 ? (
          <DataTable columns={columns} rows={rows} keyForRow={(r) => r.id} />
        ) : (
          <EmptyState title="Опросов пока нет" description="Создайте первый опрос, и он появится в этом списке." />
        )}
      </div>
    </div>
  );
}
