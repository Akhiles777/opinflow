"use client";

import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

const faqs = [
  {
    question: "Как начать зарабатывать на опросах?",
    answer:
      "Зарегистрируйтесь как респондент, заполните профиль — и вам сразу станут доступны опросы.",
  },
  {
    question: "Сколько можно заработать?",
    answer:
      "Стоимость опроса — от 20 до 500 рублей. В среднем активные пользователи зарабатывают 3000–5000 рублей в месяц.",
  },
  {
    question: "Какие гарантии качества для заказчика?",
    answer:
      "Антифрод: IP, device fingerprint, контроль скорости и контрольные вопросы.",
  },
  {
    question: "Можно ли заказать опрос для малого бизнеса?",
    answer:
      "Да, минимальный бюджет начинается от 1000 рублей. Отчет формируется автоматически.",
  },
  {
    question: "Как связаться с поддержкой?",
    answer:
      "Напишите на support@potokmneny.ru или воспользуйтесь формой обратной связи.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <section id="faq" className="bg-white border-b border-gray-100 py-32 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-24">
        <div className="sticky top-24 self-start">
          <RevealOnScroll>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="font-display text-display-lg text-gray-900 mt-4 mb-6">
              Частые<br />вопросы
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Остались вопросы?<br />
              <a href="mailto:support@potokmneny.ru" className="text-brand hover:underline font-medium">
                Напишите нам →
              </a>
            </p>
          </RevealOnScroll>
        </div>

        <div>
          {faqs.map((faq, index) => {
            const active = activeIndex === index;
            return (
              <RevealOnScroll key={faq.question} delay={(index * 50) as 0 | 100 | 200 | 300}>
                <div className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => setActiveIndex(active ? null : index)}
                    className="w-full flex justify-between items-center py-7 text-left group"
                    type="button"
                  >
                    <span
                      className={`text-base font-medium transition-colors duration-200 ${
                        active ? "text-brand" : "text-gray-900 group-hover:text-brand"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span
                      className={`text-gray-300 text-2xl font-light ml-8 flex-shrink-0 transition-transform duration-300 ${
                        active ? "rotate-45 text-brand" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-400 ease-in-out ${
                      active ? "max-h-40 pb-7" : "max-h-0"
                    }`}
                  >
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {faq.answer}
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
