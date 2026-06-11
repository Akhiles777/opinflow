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
  const userId = session.user.id;

  const data = await getRespondentOverviewData(userId);

  const stats = [
    {
      label: "Текущий баланс",
      value: formatRub(data.balance),
      icon: STAT_ICONS[0],
    },
    {
      label: "Опросов пройдено",
      value: String(data.completedCount),
      icon: STAT_ICONS[1],
    },
    {
      label: "Доступных опросов",
      value: String(data.availableCount),
      icon: STAT_ICONS[2],
    },
    {
      label: "Приглашено друзей",
      value: String(data.referralsCount ?? 0),
      icon: STAT_ICONS[3],
    },
  ];

  return (
    <div className="space-y-9">
      <PageHeader
        title={`Добрый день, ${data.viewer?.name ?? "Пользователь"}`}
        subtitle="Сводка по балансу и доступным опросам."
      />

      {/* Статистика */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="
              rounded-[20px]
              border
              border-[#D9CEF8]
              bg-white
              p-5
              min-h-[154px]
              flex
              flex-col
            "
          >
            <div
              className="
                flex
                h-[44px]
                w-[44px]
                items-center
                justify-center
                rounded-[14px]
                bg-gradient-to-b
                from-[#9A79FF]
                to-[#6438D9]
              "
            >
              <div
                className="h-5 w-5 bg-white"
                style={{
                  WebkitMaskImage: `url('${item.icon}')`,
                  maskImage: `url('${item.icon}')`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </div>

            <div className="mt-auto">
              <div className="text-[24px] font-[700] text-[#24115E]">
                {item.value}
              </div>

              <div className="mt-1 text-[15px] text-[#8A83A7]">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Опросы */}
      <section>
        <h2 className="mb-5 text-[22px] font-[700] text-[#24115E]">
          Доступные опросы
        </h2>

        {data.surveys.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {data.surveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                category={survey.category}
                title={survey.title}
                reward={survey.reward}
                duration={survey.duration}
                questions={survey.questions}
                maxResponses={survey.maxResponses}
                currentResponses={survey.currentResponses}
                status={survey.status}
                meta={survey.meta}
                link={`/respondent/survey/${survey.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Пока нет доступных опросов"
            description="Загляните позже — новые исследования появятся здесь."
          />
        )}
      </section>
    </div>
  );
}