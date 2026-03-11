import * as React from "react";
import Button from "@/components/ui/Button";

const rows = [
  { title: "Пополнения заказчиков", amount: "96 000 ₽", meta: "за 7 дней" },
  { title: "Начисления респондентам", amount: "58 400 ₽", meta: "за 7 дней" },
  { title: "Комиссия платформы", amount: "12 800 ₽", meta: "за 7 дней" },
];

export default function AdminFinancePage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Финансы
        </h1>
        <p className="mt-2 text-base font-body text-white/45 leading-relaxed">
          Статистика и комиссии. Реальные цифры подключим после интеграции платежей.
        </p>

        <div className="mt-8 rounded-2xl border border-white/8 bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-base font-semibold text-white/90">Сводка</p>
          </div>
          <div className="divide-y divide-white/5">
            {rows.map((r) => (
              <div key={r.title} className="px-6 py-5 flex items-start justify-between gap-6">
                <div>
                  <p className="text-base font-semibold text-white/90">{r.title}</p>
                  <p className="text-sm font-body text-white/40 mt-1">{r.meta}</p>
                </div>
                <p className="font-body tabular-nums text-base font-semibold text-white">{r.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-sm font-body text-white/40 uppercase tracking-[0.2em]">Комиссия</p>
          <p className="mt-3 text-base font-body text-white/45 leading-relaxed">
            На Этапе 5 админ сможет менять комиссию платформы и видеть влияние на прибыль.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" size="md">Изменить</Button>
            <Button variant="ghost" size="md">История</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
