import * as React from "react";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const respondentBenefits = [
  "Умная лента — опросы по возрасту, городу, доходу и интересам",
  "Выплаты от 100 ₽ на карту, кошелёк или телефон",
  "Реферальная программа с бонусами за друзей",
  "Прогресс сохраняется — возвращайтесь когда удобно",
];

const businessBenefits = [
  "Гибкий конструктор — 6 типов вопросов, медиа до 50 МБ",
  "Точный таргетинг по полу, возрасту, гео и интересам",
  "ИИ-аналитика: темы, тональность, PDF и Excel одним кликом",
  "Экспертное заключение от профессионального маркетолога",
];

const analyticsRows = [
  { label: "Очень доволен", pct: 75 },
  { label: "Доволен", pct: 52 },
  { label: "Нейтрально", pct: 38 },
  { label: "Недоволен", pct: 14 },
];

export default function TwoAudiences() {
  return (
    <section className="py-8 px-8 bg-surface-950">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevealOnScroll direction="left">
          <div className="relative rounded-3xl border border-white/8 bg-surface-900 overflow-hidden p-10 min-h-[500px] hover:border-white/14 transition-all duration-500 group">
            <GlowOrb
              size={300}
              opacity={0}
              className="bottom-0 left-0 group-hover:opacity-15 transition-opacity duration-700"
            />

            <span className="text-xs font-semibold font-body text-white/30 uppercase tracking-[0.2em]">
              Респондентам
            </span>
            <h2 className="font-display text-title text-white mt-4 mb-5">
              Зарабатывайте,<br />делясь мнением
            </h2>
            <p className="font-body text-white/40 text-base leading-relaxed max-w-xs mb-8">
              Проходите опросы, которые действительно вам подходят, и получайте деньги на карту
            </p>

            <ul className="space-y-4 mb-10">
              {respondentBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-body text-white/45">
                  <span className="w-1 h-1 rounded-full bg-brand-light mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Button variant="primary" size="lg">Начать зарабатывать →</Button>

            <div className="absolute bottom-8 right-8 w-52 bg-surface-800 border border-white/8 rounded-2xl p-5 shadow-card animate-float">
              <p className="text-xs font-body text-white/25 mb-1">Мой баланс</p>
              <p className="font-display text-2xl text-white font-bold">1 240 ₽</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs font-body text-white/25">Последнее начисление</p>
                <p className="text-sm font-semibold text-brand-light mt-0.5">+350 ₽</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll direction="right">
          <div className="relative rounded-3xl border border-white/8 bg-surface-900 overflow-hidden p-10 min-h-[500px] hover:border-white/14 transition-all duration-500 group">
            <GlowOrb
              size={300}
              opacity={0}
              color="#7C3AED"
              className="bottom-0 right-0 group-hover:opacity-15 transition-opacity duration-700"
            />

            <span className="text-xs font-semibold font-body text-white/30 uppercase tracking-[0.2em]">
              Бизнесу
            </span>
            <h2 className="font-display text-title text-white mt-4 mb-5">
              Проводите исследования<br />с помощью ИИ
            </h2>
            <p className="font-body text-white/40 text-base leading-relaxed max-w-xs mb-8">
              Создавайте опросы любой сложности, нацеливайтесь на нужную аудиторию и получайте готовые отчёты с графиками
            </p>

            <ul className="space-y-4 mb-10">
              {businessBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-body text-white/45">
                  <span className="w-1 h-1 rounded-full bg-brand-light mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Button variant="secondary" size="lg">Заказать исследование →</Button>

            <div className="absolute bottom-8 right-8 w-52 bg-surface-800 border border-white/8 rounded-2xl p-5 shadow-card">
              <p className="text-xs font-body text-white/25 mb-4">Результаты опроса</p>
              {analyticsRows.map((row) => (
                <div key={row.label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-body text-white/30">{row.label}</span>
                    <span className="text-xs font-body text-white/30">{row.pct}%</span>
                  </div>
                  <div className="bg-surface-700 rounded-full h-1">
                    <div className="bg-brand rounded-full h-1" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
