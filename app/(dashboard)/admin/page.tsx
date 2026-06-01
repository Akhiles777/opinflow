import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DashboardGlyph from "@/components/dashboard/DashboardGlyph";
import { formatRub, getAdminOverviewData } from "@/lib/dashboard-data";
import { requireRole } from "@/lib/auth-utils";

function eventMeta(text: string): { dot: string; label: string; detail: string } {
  if (text.startsWith("Новый пользователь")) {
    const detail = text.replace("Новый пользователь ", "");
    return { dot: "bg-violet-500", label: "Новый пользователь", detail };
  }
  if (text.startsWith("Списание")) {
    const parts = text.split(" · ");
    return { dot: "bg-red-400", label: parts[0] ?? text, detail: parts[1] ?? "" };
  }
  if (text.startsWith("Начисление")) {
    const parts = text.split(" · ");
    return { dot: "bg-emerald-400", label: parts[0] ?? text, detail: parts[1] ?? "" };
  }
  const parts = text.split(" · ");
  return { dot: "bg-sky-400", label: parts[0] ?? text, detail: parts[1] ?? "" };
}

export default async function AdminOverviewPage() {
  await requireRole("ADMIN");
  const data = await getAdminOverviewData();

  const stats = [
    {
      label: "Опросов на модерации",
      value: String(data.pendingModeration),
      icon: <DashboardGlyph name="moderation" className="h-5.5 w-5.5" />,
    },
    {
      label: "Новых пользователей",
      value: String(data.newUsers),
      icon: <DashboardGlyph name="users" className="h-5.5 w-5.5" />,
    },
    {
      label: "Оборот за месяц",
      value: formatRub(data.turnover),
      icon: <DashboardGlyph name="money" className="h-5.5 w-5.5" />,
    },
    {
      label: "Выплачено респондентам",
      value: formatRub(data.respondentPayouts),
      icon: <DashboardGlyph name="wallet" className="h-5.5 w-5.5" />,
    },
  ];

  return (
    <div>
      <PageHeader title="Обзор" subtitle="Сводка и последние события системы." />

      {/* Стат-карточки */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>

      {/* Последние события */}
      <div className="mt-6 rounded-[18px] border border-dash-border bg-dash-card p-6">
        <p className="mb-5 text-[16px] font-semibold text-dash-heading">Последние события</p>

        {data.events.length > 0 ? (
          <div className="divide-y divide-dash-border">
            {data.events.map((e) => {
              const { dot, label, detail } = eventMeta(e.text);
              return (
                <div
                  key={`${e.text}-${e.time}`}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                    <p className="truncate text-[15px] font-semibold text-dash-heading">
                      {label}
                    </p>
                    {detail && (
                      <p className="hidden truncate text-[15px] text-dash-muted sm:block">
                        {detail}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-[15px] tabular-nums text-dash-muted">{e.time}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[14px] border border-dash-border bg-dash-bg px-5 py-8 text-center">
            <p className="text-[14px] font-medium text-dash-heading">Событий пока нет</p>
            <p className="mt-1 text-[13px] text-dash-muted">
              Когда в системе появятся действия пользователей и транзакции, они будут показаны здесь.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
