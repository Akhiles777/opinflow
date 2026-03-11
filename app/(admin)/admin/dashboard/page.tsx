import * as React from "react";
import Button from "@/components/ui/Button";

const cards = [
  { title: "Опросы на модерации", value: "14", hint: "в очереди сейчас" },
  { title: "Подозрительные прохождения", value: "3", hint: "за последние 24 часа" },
  { title: "Оборот", value: "128 400 ₽", hint: "за 7 дней" },
  { title: "Новые пользователи", value: "210", hint: "за 7 дней" },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
            Обзор
          </h1>
          <p className="mt-2 text-base font-body text-white/45 leading-relaxed">
            Модерация, пользователи и финансовый мониторинг. Сейчас это статический прототип.
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Button variant="secondary" size="md" href="/admin/moderation">
            Открыть модерацию →
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-white/8 bg-surface-900 p-6 hover:border-brand/20 transition-colors">
            <p className="text-sm font-body text-white/40 uppercase tracking-[0.2em]">{c.title}</p>
            <p className="mt-3 font-body tabular-nums text-3xl font-semibold tracking-tight text-white">{c.value}</p>
            <p className="mt-2 text-sm font-body text-white/40">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-base font-semibold text-white/90">Очередь модерации</p>
          <p className="mt-2 text-base font-body text-white/45 leading-relaxed">
            На Этапе 5 тут появится список опросов со статусом `PENDING` и действия “Одобрить/Отклонить”.
          </p>
          <div className="mt-5">
            <Button variant="primary" size="md" href="/admin/moderation">
              Перейти →
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-base font-semibold text-white/90">Финансовая сводка</p>
          <p className="mt-2 text-base font-body text-white/45 leading-relaxed">
            На Этапе 4 подключим реальные транзакции и комиссии. Тут будет график и экспорт.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="md" href="/admin/finance">
              Финансы →
            </Button>
            <Button variant="ghost" size="md">
              Экспорт
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
