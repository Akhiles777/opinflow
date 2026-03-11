import * as React from "react";
import Button from "@/components/ui/Button";

const reports = [
  { title: "Доставка продуктов", date: "Сегодня", files: "PDF · XLSX" },
  { title: "Кофе и привычки", date: "5 дней назад", files: "PDF" },
];

export default function ClientAnalyticsPage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Аналитика
        </h1>
        <p className="mt-2 text-sm sm:text-base font-body text-white/40">
          Отчёты с графиками и ИИ-выводами. Здесь будет доступ к PDF/Excel на Этапе 4.
        </p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {reports.map((r) => (
            <div key={r.title} className="rounded-2xl border border-white/8 bg-surface-900 p-6 hover:border-brand/25 transition-colors">
              <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">{r.date}</p>
              <h3 className="mt-3 font-display text-xl text-white">{r.title}</h3>
              <p className="mt-2 text-sm font-body text-white/45">{r.files}</p>
              <div className="mt-5 flex gap-2">
                <Button variant="secondary" size="md">Открыть →</Button>
                <Button variant="ghost" size="md">Экспорт</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">ИИ-анализ</p>
          <p className="mt-3 text-sm font-body text-white/45 leading-relaxed">
            После завершения опроса нейросеть выделит темы в открытых ответах, тональность и ключевые инсайты.
          </p>
          <div className="mt-5">
            <Button variant="primary" size="md">Заказать отчёт →</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

