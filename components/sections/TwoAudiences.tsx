import * as React from "react";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const respondentBenefits = [
  "Опросы, которые подходят именно вам — по возрасту, городу и интересам",
  "Простые анкеты — большинство опросов занимает всего несколько минут",
  "Честные выплаты — вы получаете деньги за каждый завершённый опрос",
  "Работает на любом устройстве — проходите опросы когда вам удобно",
  "Бонусы за друзей — приглашайте знакомых и получайте дополнительные вознаграждения",
];

const businessBenefits = [
  "Конструктор опросов — логические ветвления, изображения, видео и разные типы вопросов",
  "Точный подбор респондентов — возраст, город, интересы и социальные параметры",
  "ИИ-аналитика — графики, ключевые темы, облако слов и анализ тональности",
  "Быстрый запуск исследований — создайте опрос за несколько минут",
  "Прозрачная система оплаты — вы платите только за реальные ответы",
];

const analyticsRows = [
  { label: "Очень доволен", pct: 75 },
  { label: "Доволен", pct: 52 },
  { label: "Нейтрально", pct: 38 },
  { label: "Недоволен", pct: 14 },
];

export default function TwoAudiences() {
  return (
    <section className="bg-site-bg px-4 py-8 sm:px-6 lg:px-8" aria-label="Для респондентов и бизнеса">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-2">
        <RevealOnScroll direction="left">
          <div className="group relative min-h-0 overflow-hidden rounded-3xl border border-site-border bg-site-card p-6 transition-all duration-500 hover:border-brand/25 sm:min-h-[500px] sm:p-10">
            <span id="respondents" className="absolute -top-20" aria-hidden="true" />
            <GlowOrb
              size={300}
              opacity={0}
              className="bottom-0 left-0 group-hover:opacity-15 transition-opacity duration-700"
            />

            <span className="text-xs font-semibold font-body text-site-muted uppercase tracking-[0.2em]">
              Респондентам
            </span>
            <h2 className="font-display text-title text-site-heading mt-4 mb-5">
              Зарабатывайте,<br />делясь мнением
            </h2>
            <p className="font-body text-site-muted text-base leading-relaxed max-w-xs mb-8">
              Ваше мнение действительно важно — и может приносить дополнительный доход. На платформе ПотокМнений вы можете проходить онлайн-опросы от брендов и получать вознаграждение за ответы.
            </p>

            <ul className="space-y-4 mb-10">
              {respondentBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-body text-site-body">
                  <span className="w-1 h-1 rounded-full bg-brand-light mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Button variant="primary" size="lg">Начать зарабатывать →</Button>

            <div className="mt-8 w-full max-w-52 rounded-2xl border border-site-border bg-site-card p-5 shadow-card animate-float sm:absolute sm:right-8 sm:bottom-8 sm:mt-0">
              <p className="text-xs font-body text-site-muted mb-1">Мой баланс</p>
              <p className="font-body tabular-nums text-2xl text-site-heading font-semibold tracking-tight">1 240 ₽</p>
              <div className="mt-3 pt-3 border-t border-site-border">
                <p className="text-xs font-body text-site-muted">Последнее начисление</p>
                <p className="text-sm font-semibold text-brand-light mt-0.5">+350 ₽</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll direction="right">
          <div className="group relative min-h-0 overflow-hidden rounded-3xl border border-site-border bg-site-card p-6 transition-all duration-500 hover:border-brand/25 sm:min-h-[500px] sm:p-10">
            <span id="business" className="absolute -top-20" aria-hidden="true" />
            <GlowOrb
              size={300}
              opacity={0}
              color="#7C3AED"
              className="bottom-0 right-0 group-hover:opacity-15 transition-opacity duration-700"
            />

            <span className="text-xs font-semibold font-body text-site-muted uppercase tracking-[0.2em]">
              Бизнесу
            </span>
            <h2 className="font-display text-title text-site-heading mt-4 mb-5">
              Получайте ответы<br />от нужной аудитории
            </h2>
            <p className="font-body text-site-muted text-base leading-relaxed max-w-xs mb-8">
              Маркетинговые исследования часто занимают недели и требуют больших бюджетов. ПотокМнений делает этот процесс быстрым и доступным. Вы создаёте опрос, выбираете нужную аудиторию и получаете готовые результаты с аналитикой.
            </p>

            <ul className="space-y-4 mb-10">
              {businessBenefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-body text-site-body">
                  <span className="w-1 h-1 rounded-full bg-brand-light mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="text-sm font-body text-site-muted leading-relaxed max-w-md mb-10">
              Подходит для маркетинговых исследований, тестирования продуктов, анализа рекламы, изучения потребительских привычек и HR-опросов.
            </p>

            <Button variant="secondary" size="lg">Заказать исследование →</Button>

            <div className="mt-8 w-full max-w-52 rounded-2xl border border-site-border bg-site-card p-5 shadow-card sm:absolute sm:right-8 sm:bottom-8 sm:mt-0">
              <p className="text-xs font-body text-site-muted mb-4">Результаты опроса</p>
              {analyticsRows.map((row) => (
                <div key={row.label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-body text-site-muted">{row.label}</span>
                    <span className="text-xs font-body text-site-muted">{row.pct}%</span>
                  </div>
                  <div className="bg-site-border rounded-full h-1">
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
