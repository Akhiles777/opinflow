import Image from "next/image";
import PageHeader from "@/components/dashboard/PageHeader";
import SurveyCard from "@/components/dashboard/SurveyCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatRub, getRespondentOverviewData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

const STAT_ICONS = [
  "/cabinets/respondent/home-1.svg",
  "/cabinets/respondent/home-2.svg",
  "/cabinets/respondent/home-3.svg",
  "/cabinets/respondent/home-4.svg",
];

export default async function RespondentOverviewPage() {
  const session = await requireRole("RESPONDENT");
  const data = await getRespondentOverviewData(session.user.id);

  const stats = [
    { label: "Текущий баланс", value: formatRub(data.balance) },
    { label: "Опросов пройдено", value: String(data.completedCount) },
    { label: "Доступных опросов", value: String(data.availableCount) },
    { label: "Приглашено друзей", value: String(data.referralCount) },
  ];

  return (
    <div>
      <PageHeader
        title={`Добрый день, ${data.viewer?.name ?? "Пользователь"}`}
        subtitle="Сводка по балансу и доступным опросам."
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="rounded-[18px] border border-dash-border bg-dash-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#6D3AE2]">
              <Image
                src={STAT_ICONS[i]}
                width={20}
                height={20}
                alt=""
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <p className="font-display text-[28px] font-bold leading-none text-dash-heading tabular-nums">{s.value}</p>
            <p className="mt-1.5 text-[13px] font-medium text-dash-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-5 text-[17px] font-semibold text-dash-heading">Доступные опросы</h2>
        {data.surveys.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {data.surveys.map((survey) => {
              const s: any = survey;
              return (
              <SurveyCard
                key={survey.id}
                category={survey.category}
                title={survey.title}
                reward={typeof s.reward === "number" ? s.reward : s.reward}
                duration={s.duration}
                questions={s.questions}
                maxResponses={s.maxResponses}
                currentResponses={s.currentResponses}
                clientName={s.clientName}
                suitable={s.suitable ?? true}
                status={survey.status}
                link={`/respondent/survey/${survey.id}`}
              />
              );
            })}
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
