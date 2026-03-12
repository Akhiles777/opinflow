import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import Badge from "@/components/dashboard/Badge";

const stats = [
  { label: "Всего ответов", value: "64" },
  { label: "Конверсия входа", value: "73%" },
  { label: "Среднее время", value: "5:12" },
  { label: "Завершили", value: "58" },
];

export default async function ClientSurveyStatsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  return (
    <div>
      <PageHeader
        title={`Статистика опроса: ${id}`}
        subtitle="Графики и отчёты подключим на Этапе 4 (recharts + PDF)."
        right={
          <div className="flex flex-wrap gap-2">
            <Badge variant="active">Активен</Badge>
            <button type="button" className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors">
              Пауза
            </button>
            <button type="button" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Стоп
            </button>
          </div>
        }
      />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Динамика ответов</p>
          <p className="mt-2 text-sm text-dash-muted font-body">
            Здесь будет LineChart по дням.
          </p>
          <div className="mt-6 h-40 rounded-2xl border border-dash-border bg-dash-bg" />
        </div>

        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Демография</p>
          <p className="mt-2 text-sm text-dash-muted font-body">
            Здесь будут BarChart по полу и возрасту.
          </p>
          <div className="mt-6 h-40 rounded-2xl border border-dash-border bg-dash-bg" />
        </div>
      </div>

      <div className="mt-10 bg-dash-card border border-dash-border rounded-2xl p-6">
        <p className="text-sm font-semibold text-dash-heading font-body">Открытые ответы</p>
        <p className="mt-2 text-sm text-dash-muted font-body">
          Топ-ответы + кнопка ИИ-анализа (OpenRouter) появятся на Этапе 4.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
            ИИ-анализ →
          </button>
          <button type="button" className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors">
            Скачать отчёт (PDF)
          </button>
          <button type="button" className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors">
            Экспорт (Excel)
          </button>
        </div>
      </div>
    </div>
  );
}
