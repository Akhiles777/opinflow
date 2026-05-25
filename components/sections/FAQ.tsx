"use client";

import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const faqs = [
  {
    q: "Как быстро я получу ответы?",
    a: "В среднем первые ответы приходят в течение часа после запуска опроса.",
  },
  {
    q: "Какое качество данных вы гарантируете?",
    a: "Мы гарантируем 97% верифицированных ответов благодаря многоступенчатой системе защиты.",
  },
  {
    q: "Можно ли выгрузить данные?",
    a: "Да, доступен экспорт в CSV, Excel и JSON.",
  },
  {
    q: "Как происходит оплата?",
    a: "Вы оплачиваете только реальные верифицированные ответы.",
  },
];

function Arrow({ active }: { active: boolean }) {
  return (
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors duration-200 ${
        active
          ? "border-[#6438D9] text-[#6438D9] bg-white dark:border-[#A98BFF] dark:text-[#A98BFF] dark:bg-white/15"
          : "border-[#DAD4F3] text-[#1C0C4C] bg-white/70 dark:border-white/20 dark:text-white dark:bg-white/10"
      }`}
    >
      <svg
        className={`transition-transform duration-200 ease-out ${active ? "rotate-180" : ""}`}
        width="14" height="14" viewBox="0 0 24 24" fill="none"
      >
        <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function FAQ() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(1);

  return (
    <section className="bg-[#FCFBFF] dark:bg-[#1C0C4C] px-4 py-16 lg:py-24" id="faq">
      <div className="max-w-[1780px] mx-auto rounded-[36px] border border-[#DDD6F6] dark:border-white/10 bg-[#FCFBFF] dark:bg-white/5 px-5 sm:px-8 lg:px-12 py-12 lg:py-16">
        <RevealOnScroll>
          <h2 className="text-center text-[34px] sm:text-[48px] lg:text-[64px] leading-[0.95] tracking-[-0.05em] font-semibold text-[#24115D] dark:text-white mb-8 lg:mb-10">
            Частые вопросы
          </h2>
        </RevealOnScroll>

        <div className="max-w-[1420px] mx-auto flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const active = activeIndex === index;
            return (
              <div key={faq.q}>
                <div
                  className={`rounded-[24px] border overflow-hidden transition-colors duration-300 ease-out ${
                    active
                      ? "border-[#D8D0F4] bg-[#F3EEFF] dark:border-[#6438D9]/50 dark:bg-white/10"
                      : "border-[#DDD6F6] bg-white/90 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(active ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 lg:px-7 py-5 text-left"
                  >
                    <span className="text-[18px] sm:text-[22px] lg:text-[26px] leading-snug tracking-[-0.04em] font-medium text-[#24115D] dark:text-white">
                      {faq.q}
                    </span>
                    <Arrow active={active} />
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                      active ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 sm:px-6 lg:px-7 pb-5">
                      <div className="rounded-[18px] border border-[#E2DCF7] dark:border-white/10 bg-white dark:bg-white/8 px-5 py-4 text-[15px] lg:text-[16px] leading-[1.45] text-[#4A3B7A] dark:text-white/90">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
