import * as React from "react";
import { Wallet, ListChecks, ClipboardList, UserPlus } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import SurveyCard from "@/components/dashboard/SurveyCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatRub, getRespondentOverviewData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

export default async function RespondentOverviewPage() {
  const session = await requireRole("RESPONDENT");
  const data = await getRespondentOverviewData(session.user.id);

  const stats = [
    {
      label: "Текущий баланс",
      value: formatRub(data.balance),
      trend: data.earnedToday > 0 ? `+${formatRub(data.earnedToday)} сегодня` : "Сегодня начислений не было",
      trendUp: data.earnedToday > 0,
      icon: <Wallet className="w-5 h-5" />,
    },
    { label: "Опросов пройдено", value: String(data.completedCount), icon: <ListChecks className="w-5 h-5" /> },
    { label: "Доступных опросов", value: String(data.availableCount), icon: <ClipboardList className="w-5 h-5" /> },
    { label: "Приглашено друзей", value: String(data.referralCount), icon: <UserPlus className="w-5 h-5" /> },
  ];

  return (
    <div>
      <PageHeader
        title={`Добрый день, ${data.viewer?.name ?? "Пользователь"} 👋`}
        subtitle="Сводка по балансу и доступным опросам."
      />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            trend={s.trend}
            trendUp={s.trendUp}
          />
        ))}
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          Доступные опросы
        </p>
        {data.surveys.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {data.surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                category={survey.category}
                title={survey.title}
                status={survey.status}
                meta={survey.meta}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Пока нет доступных опросов"
            description="Загляните позже — как только заказчики запустят новые исследования, они появятся здесь."
          />
        )}
      </div>
    </div>
  );
}
