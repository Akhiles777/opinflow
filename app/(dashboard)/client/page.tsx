import * as React from "react";
import { TrendingUp, Wallet, BarChart3, Layers } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatRub, getClientOverviewData, mapSurveyStatus } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

type SurveyRow = {
  id: string;
  title: string;
  answered: number;
  status: ReturnType<typeof mapSurveyStatus>;
};

const columns: Column<SurveyRow>[] = [
  { key: "title", header: "Название", cell: (r) => r.title, className: "max-w-[320px] lg:max-w-[520px]" },
  {
    key: "answers",
    header: "Ответов",
    cell: (r) => <span className="tabular-nums font-semibold">{r.answered}</span>,
  },
  {
    key: "status",
    header: "Статус",
    cell: (r) => <Badge variant={r.status.v}>{r.status.t}</Badge>,
  },
  {
    key: "actions",
    header: "Действия",
    cell: (row) => (
      <div className="flex flex-wrap gap-3">
        <a href={`/client/surveys/${row.id}`} className="text-sm font-semibold text-brand hover:underline">
          Открыть
        </a>
      </div>
    ),
  },
];

export default async function ClientOverviewPage() {
  const session = await requireRole("CLIENT");
  const data = await getClientOverviewData(session.user.id);
  const stats = [
    { label: "Баланс", value: formatRub(data.balance), icon: <Wallet className="w-5 h-5" /> },
    { label: "Активных опросов", value: String(data.activeCount), icon: <Layers className="w-5 h-5" /> },
    {
      label: "Всего ответов",
      value: String(data.totalResponses),
      trend: data.totalResponses > 0 ? "Ответы собраны из реальных опросов" : "Пока нет ответов",
      trendUp: data.totalResponses > 0,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    { label: "На модерации", value: String(data.moderationCount), icon: <BarChart3 className="w-5 h-5" /> },
  ];
  const surveys: SurveyRow[] = data.surveys.map((survey) => ({
    id: survey.id,
    title: survey.title,
    answered: survey.responses,
    status: mapSurveyStatus(survey.status),
  }));

  return (
    <div>
      <PageHeader title="Обзор" subtitle="Сводка по опросам и эффективности кампаний." />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} trend={s.trend} trendUp={s.trendUp} />
        ))}
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          Ваши опросы
        </p>
        {surveys.length > 0 ? (
          <DataTable columns={columns} rows={surveys} keyForRow={(r) => r.id} />
        ) : (
          <EmptyState
            title="Опросов пока нет"
            description="Создайте первый опрос, и здесь появится сводка по ответам и статусам."
          />
        )}
      </div>
    </div>
  );
}
