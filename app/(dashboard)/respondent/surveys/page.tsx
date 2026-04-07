import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import Tabs from "@/components/dashboard/Tabs";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import EmptyState from "@/components/dashboard/EmptyState";
import { getRespondentSurveysData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

type InProgress = Awaited<ReturnType<typeof getRespondentSurveysData>>["inProgress"][number];
type Completed = Awaited<ReturnType<typeof getRespondentSurveysData>>["completed"][number];

const columns: Column<Completed>[] = [
  { key: "date", header: "Дата", cell: (r) => r.date },
  { key: "title", header: "Название", cell: (r) => r.title, className: "max-w-[520px]" },
  { key: "reward", header: "Вознаграждение", cell: (r) => <span className="tabular-nums font-semibold text-brand">{r.reward}</span> },
  { key: "actions", header: "Действия", cell: () => <span className="text-sm font-semibold text-dash-muted">Жалоба позже</span> },
];

export default async function RespondentSurveysPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await requireRole("RESPONDENT");
  const params = (await searchParams) ?? {};
  const activeTab = params.tab === "completed" ? "completed" : "mine";
  const data = await getRespondentSurveysData(session.user.id);
  const gasan = 'gasan'

  return (
    <div>
      <PageHeader
        title="Мои опросы"
        subtitle="В рамках Этапа 2 показываем реальные завершённые ответы и текущее состояние участия."
        right={
          <React.Suspense
            fallback={
              <div className="h-11 w-full rounded-xl border border-dash-border bg-dash-card sm:w-[260px]" />
            }
          >
            <Tabs
              tabs={[
                { label: "В работе", value: "mine" },
                { label: "Завершённые", value: "completed" },
              ]}
              param="tab"
              defaultValue="mine"
            />
          </React.Suspense>
        }
      />

      {activeTab === "mine" ? (
        <div className="mt-8">
          <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
            <p className="text-sm font-semibold text-dash-heading font-body">В работе</p>
            <p className="mt-2 text-sm text-dash-muted font-body">
              Частичный прогресс по вопросам текущая схема БД пока не хранит, поэтому показываем только то, что реально сохранено.
            </p>

            {data.inProgress.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="Нет опросов в работе"
                  description="Когда появится сохранение промежуточного прогресса, незавершённые опросы будут отображаться здесь."
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {data.inProgress.map((s: InProgress) => (
                  <div key={s.id} className="rounded-2xl border border-dash-border bg-dash-bg p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-display text-xl text-dash-heading">{s.title}</p>
                        <p className="mt-2 text-sm text-dash-muted font-body">
                          Прогресс: <span className="text-dash-body">{s.progress}</span> ·{" "}
                          <span className="text-dash-body">{s.deadline}</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white">
                        Продолжить →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <p className="mb-4 text-sm font-semibold text-dash-heading font-body">
            Завершённые
          </p>
          {data.completed.length > 0 ? (
            <DataTable columns={columns} rows={data.completed} keyForRow={(r) => r.id + r.date} />
          ) : (
            <EmptyState title="Завершённых опросов пока нет" description="После отправки первого ответа завершённые исследования появятся в этом списке." />
          )}
        </div>
      )}
    </div>
  );
}
