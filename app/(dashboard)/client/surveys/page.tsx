import Image from "next/image";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/dashboard/Badge";
import EmptyState from "@/components/dashboard/EmptyState";
import DeleteSurveyButton from "@/components/dashboard/DeleteSurveyButton";
import { formatRub, getClientSurveysData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

export default async function ClientSurveysPage() {
  const session = await requireRole("CLIENT");
  const rows = await getClientSurveysData(session.user.id);

  return (
    <div>
      <PageHeader
        title="Мои опросы"
        subtitle="Реальные опросы заказчика, статусы и количество ответов."
        right={
          <a
            href="/client/surveys/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7244F5] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.45)] transition-all hover:bg-[#6238DC] hover:shadow-[0_6px_18px_rgba(114,68,245,0.6)]"
          >
            <Image src="/icons/add-square.svg" width={18} height={18} alt="" />
            Создать опрос
          </a>
        }
      />

      <div className="mt-8 rounded-[18px] border border-dash-border bg-dash-card">
        <div className="border-b border-dash-border px-6 py-4">
          <h2 className="text-[17px] font-semibold text-dash-heading">Ваши опросы</h2>
        </div>
        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dash-border bg-dash-bg/40">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Название</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Прогресс</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Ответов</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Бюджет</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Статус</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-dash-muted">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-dash-bg/30">
                    <td className="max-w-65 px-6 py-3 text-[15px] font-medium text-dash-body">{row.title}</td>
                    <td className="px-6 py-3 text-[15px] tabular-nums text-dash-body">{row.progress}</td>
                    <td className="px-6 py-3 text-[15px] tabular-nums text-dash-body">{row.answers}</td>
                    <td className="px-6 py-3 text-[15px] tabular-nums font-semibold text-dash-body">
                      {row.budget === "—" ? "—" : formatRub(row.budget)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={row.status.v}>{row.status.t}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/client/surveys/${row.id}`}
                          className="rounded-lg border border-[#DDD2FF] bg-[#EEE8FF] px-5 py-1.5 text-[13px] font-semibold text-[#6D3AE2] transition-colors hover:bg-[#E4D8FF]"
                        >
                          Открыть
                        </a>
                        <a
                          href={`/client/surveys/${row.id}`}
                          className="rounded-lg border border-[#DDD2FF] bg-[#EEE8FF] px-5 py-1.5 text-[13px] font-semibold text-[#6D3AE2] transition-colors hover:bg-[#E4D8FF]"
                        >
                          Статистика
                        </a>
                        <DeleteSurveyButton surveyId={row.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState title="Опросов пока нет" description="Создайте первый опрос, и он появится в этом списке." />
          </div>
        )}
      </div>
    </div>
  );
}
