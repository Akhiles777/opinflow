import * as React from "react";
import Button from "@/components/ui/Button";

const tx = [
  { title: "Вознаграждение за опрос", amount: "+120 ₽", meta: "Сегодня · COMPLETED" },
  { title: "Вознаграждение за опрос", amount: "+220 ₽", meta: "Вчера · COMPLETED" },
  { title: "Вывод средств", amount: "-500 ₽", meta: "3 дня назад · PENDING" },
];

export default function RespondentWalletPage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          Кошелёк
        </h1>
        <p className="mt-2 text-sm sm:text-base font-body text-white/40">
          Баланс, история начислений и вывод средств.
        </p>

        <div className="mt-8 rounded-2xl border border-white/8 bg-surface-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-sm font-semibold text-white/80">Транзакции</p>
          </div>
          <div className="divide-y divide-white/5">
            {tx.map((row) => (
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
            Доступно
          </p>
          <p className="mt-3 font-body tabular-nums text-4xl font-semibold tracking-tight text-white">
            1 240 ₽
          </p>
          <p className="mt-2 text-sm font-body text-white/40">
            Минимальная сумма вывода: 100 ₽.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="primary" size="md">
              Вывести средства
            </Button>
            <Button variant="secondary" size="md">
              Реквизиты
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">
            Примечание
          </p>
          <p className="mt-3 text-sm font-body text-white/45 leading-relaxed">
            На Этапе 4 подключим реальные выплаты через ЮKassa Payouts и статусы транзакций.
          </p>
        </div>
      </aside>
    </div>
  );
}

