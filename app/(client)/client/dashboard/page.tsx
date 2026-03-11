import * as React from "react";
import Button from "@/components/ui/Button";

const surveys = [
  { title: "Оцените качество сервиса доставки", status: "ACTIVE", progress: "64/200", budget: "12 800 ₽" },
  { title: "Потребление кофе и выбор бренда", status: "PENDING", progress: "0/150", budget: "8 250 ₽" },
  { title: "Мобильные банки: доверие", status: "PAUSED", progress: "18/120", budget: "4 500 ₽" },
];

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Активен", cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" },
    PENDING: { label: "На модерации", cls: "border-brand/25 bg-brand/10 text-brand-light" },
    PAUSED: { label: "Пауза", cls: "border-white/15 bg-white/5 text-white/70" },
  };
  const item = map[status] ?? { label: status, cls: "border-white/15 bg-white/5 text-white/70" };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold font-body ${item.cls}`}>
      {item.label}
    </span>
  );
}

export default function ClientDashboardPage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
      <div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
              Опросы
            </h1>
            <p className="mt-2 text-sm sm:text-base font-body text-white/40">
              Создавайте исследования, управляйте статусами и отслеживайте прогресс.
            </p>
          </div>
          <div className="shrink-0">
            <Button variant="primary" size="md">
              Создать опрос
            </Button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/8 bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-sm font-semibold text-white/80">Мои опросы</p>
            <p className="text-xs font-body text-white/35">Статично, без данных</p>
          </div>

          <div className="divide-y divide-white/5">
            {surveys.map((s) => (
              <div key={s.title} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">{s.title}</p>
                  <p className="text-xs font-body text-white/35 mt-1">
                    Ответов: <span className="text-white/55">{s.progress}</span> · Бюджет:{" "}
                    <span className="text-white/55 font-body tabular-nums">{s.budget}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={s.status} />
                  <Button variant="secondary" size="md">
                    Открыть →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">
            Баланс
          </p>
          <p className="mt-3 font-body tabular-nums text-4xl font-semibold tracking-tight text-white">
            38 500 ₽
          </p>
          <p className="mt-2 text-sm font-body text-white/40">
            Используется для запуска опросов и оплаты отчётов.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="primary" size="md" href="/client/wallet">
              Пополнить
            </Button>
            <Button variant="secondary" size="md">
              История
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">
            Быстрые действия
          </p>
          <div className="mt-4 grid gap-2">
            <Button variant="secondary" size="md">
              Заказать экспертное заключение →
            </Button>
            <Button variant="ghost" size="md">
              Документация →
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

