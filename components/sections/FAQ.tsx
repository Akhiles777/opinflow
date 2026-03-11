"use client";

import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const faqs = [
  {
    q: "Как начать зарабатывать на опросах?",
    a: "Зарегистрируйтесь как респондент, заполните профиль — и вам сразу станут доступны опросы. Выбирайте подходящие, проходите и выводите деньги.",
  },
  {
    q: "Сколько можно заработать?",
    a: "Стоимость одного опроса — от 20 до 500 рублей. В среднем активные пользователи зарабатывают 3 000–5 000 рублей в месяц.",
  },
  {
    q: "Какие гарантии качества данных для заказчика?",
    a: "Антифрод-система: проверка по IP, device fingerprint, скорость прохождения и контрольные вопросы. Подозрительные ответы отклоняются — деньги не списываются.",
  },
  {
    q: "Можно ли заказать опрос для малого бизнеса?",
    a: "Да, минимальный бюджет — от 1 000 рублей. Конструктор интуитивен, отчёт формируется автоматически — аналитик не нужен.",
  },
  {
    q: "Как связаться с поддержкой?",
    a: "Напишите на support@potokmneny.ru или воспользуйтесь формой обратной связи в разделе «Контакты».",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <section className="py-32 px-8 bg-surface-950 border-b border-white/5" id="faq">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-20">
        <div className="sticky top-24 self-start">
          <RevealOnScroll>
            <p className="text-xs font-semibold font-body text-brand-light uppercase tracking-[0.2em] mb-4">
              FAQ
            </p>
            <h2 className="font-display text-heading text-white/90 mb-6">
              Ответы на частые вопросы
            </h2>
            <p className="text-sm font-body text-white/55 leading-relaxed">
              Напишите в поддержку, если не нашли нужный ответ.
            </p>
            <a
              href="mailto:support@potokmneny.ru"
              className="inline-flex items-center gap-2 text-sm font-body text-brand-light hover:text-white transition-colors mt-4"
            >
              support@potokmneny.ru
              <span>→</span>
            </a>
          </RevealOnScroll>
        </div>

        <div>
          {faqs.map((faq, index) => {
            const active = index === activeIndex;
            return (
              <RevealOnScroll key={faq.q} delay={index * 60}>
                <div
                  className={[
                    "rounded-2xl border px-6 transition-colors",
                    active ? "bg-surface-800 border-brand/20" : "bg-surface-900 border-white/8",
                    index === 0 ? "mt-0" : "mt-4",
                  ].join(" ")}
                >
                  <button
                    className="w-full flex justify-between items-center py-6 text-left"
                    onClick={() =>
                      setActiveIndex(active ? null : index)
                    }
                    type="button"
                  >
                    <span
                      className={[
                        "text-base font-semibold font-body transition-colors",
                        active ? "text-white/90" : "text-white/80 hover:text-white",
                      ].join(" ")}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`text-brand-light text-2xl font-light transition-transform duration-300 ${
                        active ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-350 ${
                      active ? "max-h-48 pb-6" : "max-h-0"
                    }`}
                  >
                    <p className="text-sm font-body text-white/60 leading-relaxed">
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
