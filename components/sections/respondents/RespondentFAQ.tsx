"use client";
import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const faqs = [
  { q: "Как быстро я получу выплату?", a: "После прохождения опроса вознаграждение зачисляется на баланс автоматически. Вывод на карту или телефон занимает до 24 часов." },
  { q: "Сколько времени занимает один опрос?", a: "От 3 до 15 минут. Точное время указано в карточке каждого опроса до начала прохождения." },
  { q: "Можно ли проходить опросы с нескольких устройств?", a: "Да, платформа работает на любом устройстве через браузер — телефон, планшет или компьютер. Ничего устанавливать не нужно." },
  { q: "Как вы защищаете мои данные?", a: "Все данные хранятся на защищённых серверах в России в соответствии с 152-ФЗ. Личные данные не передаются третьим лицам и не используются в рекламных целях." },
  { q: "Есть ли минимальная сумма для вывода?", a: "Минимальная сумма для вывода составляет 500 ₽. Запрашивать выплату можно в любое время без ограничений по частоте." },
];

export default function RespondentFAQ() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(1);

  return (
    <section className="bg-white px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-6">
        <RevealOnScroll>
          <h2 className="font-manrope text-center text-[32px] sm:text-[44px] lg:text-[58px] leading-[0.95] tracking-[-0.04em] font-extrabold text-[#1C0C4C] mb-10 lg:mb-14">
            Частые вопросы
          </h2>
        </RevealOnScroll>

        <div className="mx-auto max-w-[800px] flex flex-col">
          {faqs.map((faq, index) => {
            const active = activeIndex === index;
            return (
              <div key={faq.q} className="border-b border-black/[0.08] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(active ? null : index)}
                  className="w-full flex items-center justify-between gap-4 py-5 sm:py-6 text-left"
                >
                  <span className="text-[17px] sm:text-[19px] lg:text-[21px] leading-snug font-medium text-[#1C0C4C]">
                    {faq.q}
                  </span>
                  <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-200 ${active ? "border-[#6438D9] bg-[#6438D9] text-white" : "border-[#D4CBF0] bg-white text-[#6438D9]"}`}>
                    <span className={`text-[18px] leading-none transition-transform duration-200 ${active ? "rotate-45" : ""}`}>+</span>
                  </div>
                </button>
                <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${active ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="pb-5 text-[15px] lg:text-[16px] leading-[1.6] text-[#6B5F9E]">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
