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
          ? "border-[#6438D9] text-[#6438D9] bg-white"
          : "border-[#DAD4F3] text-[#1C0C4C] bg-white/70"
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
    <section className="bg-[#FCFBFF] px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1780px] rounded-[36px] border border-[#DDD6F6] bg-[#FCFBFF] px-5 sm:px-8 lg:px-12 py-12 lg:py-16">
        <RevealOnScroll>
          <h2 className="text-center font-manrope text-[34px] sm:text-[48px] lg:text-[64px] leading-[0.95] tracking-[-0.05em] font-extrabold text-[#24115D] mb-8 lg:mb-10">
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
                      ? "border-[#D8D0F4] bg-[#F3EEFF]"
                      : "border-[#DDD6F6] bg-white/90"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(active ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 lg:px-7 py-5 text-left"
                  >
                    <span className="text-[18px] sm:text-[22px] lg:text-[26px] leading-snug tracking-[-0.04em] font-medium text-[#24115D]">
                      {faq.q}
                    </span>
                    <Arrow active={active} />
                  </button>

                  <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                      active ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 sm:px-6 lg:px-7 pb-5">
                      <div className="rounded-[18px] border border-[#E2DCF7] bg-white px-5 py-4 text-[15px] lg:text-[16px] leading-[1.5] text-[#4A3B7A]">
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
