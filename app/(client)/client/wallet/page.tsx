import * as React from "react";
import Button from "@/components/ui/Button";

const items = [
  { title: "Пополнение", amount: "+10 000 ₽", meta: "Сегодня · COMPLETED" },
  { title: "Оплата опроса", amount: "-12 800 ₽", meta: "Вчера · COMPLETED" },
  { title: "Комиссия платформы", amount: "-1 280 ₽", meta: "Вчера · COMPLETED" },
];

export default function ClientWalletPage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Кошелёк
        </h1>
        <p className="mt-2 text-sm sm:text-base font-body text-white/40">
          Пополнение баланса и история платежей.
        </p>

        <div className="mt-8 rounded-2xl border border-white/8 bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-sm font-semibold text-white/80">Операции</p>
          </div>
          <div className="divide-y divide-white/5">
            {items.map((row) => (
              <div key={row.title + row.meta} className="px-6 py-5 flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-white/85">{row.title}</p>
                  <p className="text-xs font-body text-white/35 mt-1">{row.meta}</p>
                </div>
                <p className="font-body tabular-nums text-sm font-semibold text-white">
                  {row.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">
            Текущий баланс
          </p>
          <p className="mt-3 font-body tabular-nums text-4xl font-semibold tracking-tight text-white">
            38 500 ₽
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="primary" size="md">
              Пополнить через ЮKassa
            </Button>
          </div>
          <p className="mt-3 text-xs font-body text-white/35">
            Реальные платежи подключим на Этапе 4.
          </p>
        </div>
      </aside>
    </div>
  );
}

