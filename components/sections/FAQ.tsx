"use client";

import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const faqs = [
  {
    q: "Как быстро я получу ответы?",
    a: "В среднем первые ответы приходят в течение часа после запуска опроса. Полный сбор данных занимает от нескольких часов до пары дней в зависимости от объёма выборки.",
  },
  {
    q: "Какое качество данных вы гарантируете?",
    a: "Мы гарантируем 97% верифицированных ответов благодаря многоуровневой системе контрольных вопросов, анализа поведения и ИИ-фильтров, которые отсеивают ботов и недобросовестных респондентов.",
  },
  {
    q: "Можно ли выгрузить данные?",
    a: "Да, вы можете экспортировать все данные в форматах CSV, Excel или JSON. Также доступна интеграция с популярными аналитическими системами через API.",
  },
  {
    q: "Как происходит оплата?",
    a: "Оплата производится по факту собранных ответов. Вы пополняете баланс и платите только за реальные верифицированные ответы. Минимальный бюджет — от 1 000 рублей.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(1);

  return (
    <section className="bg-site-bg px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" id="faq">
      <div className="max-w-3xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-site-heading text-center mb-12 lg:mb-16">
            Частые вопросы
          </h2>
        </RevealOnScroll>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const active = index === activeIndex;
            return (
              <RevealOnScroll key={faq.q} delay={index * 60}>
                <div
                  className={[
                    "rounded-2xl border transition-all duration-300",
                    active 
                      ? "bg-white border-brand/20 shadow-sm" 
                      : "bg-white border-site-border hover:border-brand/10",
                  ].join(" ")}
                >
                  <button
                    className="w-full flex justify-between items-center px-6 py-5 text-left"
                    onClick={() => setActiveIndex(active ? null : index)}
                    type="button"
                  >
                    <span
                      className={[
                        "text-base font-semibold transition-colors",
                        active ? "text-site-heading" : "text-site-body hover:text-site-heading",
                      ].join(" ")}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`text-brand text-2xl font-light transition-transform duration-300 ml-4 ${
                        active ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      active ? "max-h-48 pb-5 px-6" : "max-h-0"
                    }`}
                  >
                    <p className="text-sm text-site-muted leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
