import Image from "next/image";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import DeleteSurveyButton from "@/components/dashboard/DeleteSurveyButton";
import { formatRub, getClientOverviewData, mapSurveyStatus } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";
import TurnkeyOrderModal from "@/components/dashboard/TurnkeyOrderModal";

const STAT_ICONS = [
  "/cabinets/client/Icons_money 24px.svg",
  "/cabinets/client/document-text.svg",
  "/cabinets/client/Icons_vsego 24px.svg",
  "/cabinets/client/search-status.svg",
];
const STAT_LABELS = ["Баланс", "Активных опросов", "Всего ответов", "На модерации"];

export default async function ClientOverviewPage() {
  const session = await requireRole("CLIENT");
  const data = await getClientOverviewData(session.user.id);

  const statValues = [
    formatRub(data.balance),
    String(data.activeCount),
    String(data.totalResponses),
    String(data.moderationCount),
  ];

  return (
    <div>
      <PageHeader
        title="Обзор"
        subtitle="Сводка по опросам и эффективности кампаний."
        right={
          
          <div className="flex  sm:justify-between">
            <div className="mr-5"> <TurnkeyOrderModal /> </div>
            <a
            href="/client/surveys/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7244F5] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.45)] transition-all hover:bg-[#6238DC] hover:shadow-[0_6px_18px_rgba(114,68,245,0.6)]"
          >
            <Image src="/icons/add-square.svg" width={18} height={18} alt="" />
            Создать опрос

          </a>
             </div>   

        }
      />

          <div >
           
          </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_LABELS.map((label, i) => (
          <div key={label} className="rounded-[18px] border border-dash-border bg-dash-card p-5">
            <div className="mb-4 flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#6D3AE2]">
              <Image
                src={STAT_ICONS[i]}
                width={20}
                height={20}
                alt=""
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
            <p className="font-display text-[28px] font-bold leading-none text-dash-heading tabular-nums">
              {statValues[i]}
            </p>
            <p className="mt-1.5 text-[13px] text-dash-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Surveys table */}
      <div className="mt-8 rounded-[18px] border border-dash-border bg-dash-card">
        <div className="border-b border-dash-border px-6 py-4">
          <h2 className="text-[17px] font-semibold text-dash-heading">Ваши опросы</h2>
        </div>
        {data.surveys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dash-border bg-dash-bg/40">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Название</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Ответов</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Статус</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border">
                {data.surveys.map((survey) => {
                  const status = mapSurveyStatus(survey.status);
                  return (
                    <tr key={survey.id} className="transition-colors hover:bg-dash-bg/30">
                      <td className="px-6 py-3 text-[15px] font-medium text-dash-body">{survey.title}</td>
                      <td className="px-6 py-3 text-[15px] tabular-nums text-dash-body">{survey.responses}</td>
                      <td className="px-6 py-3">
                        <Badge variant={status.v}>{status.t}</Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/client/surveys/${survey.id}`}
                            className="rounded-lg border border-[#DDD2FF] bg-[#EEE8FF] px-5 py-1.5 text-[13px] font-semibold text-[#6D3AE2] transition-colors hover:bg-[#E4D8FF]"
                          >
                            Открыть
                          </a>
                          <a
                            href={`/client/surveys/${survey.id}`}
                            className="rounded-lg border border-[#DDD2FF] bg-[#EEE8FF] px-5 py-1.5 text-[13px] font-semibold text-[#6D3AE2] transition-colors hover:bg-[#E4D8FF]"
                          >
                            Статистика
                          </a>
                          <DeleteSurveyButton surveyId={survey.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="Опросов пока нет"
              description="Создайте первый опрос, и здесь появится сводка по ответам и статусам."
            />
          </div>
        )}
      </div>
    </div>
  );
}
