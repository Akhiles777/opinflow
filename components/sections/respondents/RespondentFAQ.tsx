"use client";

import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const faqs = [
  {
    q: "Как быстро я получу выплату?",
    a: "После прохождения опроса вознаграждение зачисляется на баланс автоматически. Вывод на карту или телефон занимает до 24 часов.",
  },
  {
    q: "Сколько времени занимает один опрос?",
    a: "От 3 до 15 минут. Точное время указано в карточке каждого опроса до начала прохождения.",
  },
  {
    q: "Можно ли проходить опросы с нескольких устройств?",
    a: "Да, платформа работает на любом устройстве через браузер — телефон, планшет или компьютер. Ничего устанавливать не нужно.",
  },
  {
    q: "Как вы защищаете мои данные?",
    a: "Все данные хранятся на защищённых серверах в России в соответствии с 152-ФЗ. Личные данные не передаются третьим лицам и не используются в рекламных целях.",
  },
  {
    q: "Есть ли минимальная сумма для вывода?",
    a: "Минимальная сумма для вывода составляет 500 ₽. Запрашивать выплату можно в любое время без ограничений по частоте.",
  },
];

function Arrow({ active }: { active: boolean }) {
  return (
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-full border transition-colors duration-200 shrink-0 ${
        active
          ? "border-[#6438D9] text-[#6438D9] bg-white dark:bg-white/15 dark:border-[#9B7FFF] dark:text-[#9B7FFF]"
          : "border-[#DAD4F3] text-[#1C0C4C] bg-white/70 dark:border-white/20 dark:text-white/50 dark:bg-white/5"
      }`}
    >
      <svg
        className={`transition-transform duration-200 ease-out ${active ? "rotate-180" : ""}`}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M8 10L12 14L16 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function RespondentFAQ() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(1);

  return (
    <section className="bg-[#FCFBFF] dark:bg-[#1A0A4A] px-4 py-12 lg:py-16">
      <div className="mx-auto max-w-[1780px] rounded-[28px] border border-[#DDD6F6] dark:border-white/10 bg-[#FCFBFF] dark:bg-[#1A0A4A] px-5 sm:px-7 lg:px-10 py-8 lg:py-10">
        <RevealOnScroll>
          <h2 className="text-center font-manrope text-[28px] sm:text-[36px] lg:text-[44px] leading-[0.95] tracking-[-0.04em] font-extrabold text-[#24115D] dark:text-white mb-6 lg:mb-8">
            Частые вопросы
          </h2>
        </RevealOnScroll>

        <div className="max-w-[1420px] mx-auto flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const active = activeIndex === index;
            return (
              <div key={faq.q}>
                <div
                  className={`rounded-[18px] border overflow-hidden transition-colors duration-300 ease-out ${
                    active
                      ? "border-[#D8D0F4] bg-[#F3EEFF] dark:border-white/20 dark:bg-white/10"
                      : "border-[#DDD6F6] bg-white/90 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(active ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 lg:px-6 py-4 text-left"
                  >
                    <span className="text-[15px] sm:text-[17px] lg:text-[19px] leading-snug tracking-[-0.03em] font-medium text-[#24115D] dark:text-white">
                      {faq.q}
                    </span>
                    <Arrow active={active} />
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                      active ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-4 sm:px-5 lg:px-6 pb-4">
                      <div className="rounded-[14px] border border-[#E2DCF7] dark:border-white/10 bg-white dark:bg-white/8 px-4 py-3 text-[14px] lg:text-[15px] leading-[1.5] text-[#4A3B7A] dark:text-white/65">
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
