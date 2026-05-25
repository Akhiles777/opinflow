"use client";

import { useState } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const testimonials = [
  {
    text: "Прошла уже 12 опросов, вывел 1 340 ₽ на СБП. Всё честно, без задержек!",
    name: "Анна",
    meta: "28 лет, Екатеринбург",
    initials: "АН",
    color: "#6438D9",
  },
  {
    text: "Удобно, что опросы приходят по интересам. Не трачу время на неподходящие.",
    name: "Дмитрий",
    meta: "34 года, Казань",
    initials: "ДМ",
    color: "#6438D9",
  },
  {
    text: "Реферальная программа огонь! Пригласил друга, получил бонус",
    name: "Мария",
    meta: "22 года, Новосибирск",
    initials: "МА",
    color: "#6438D9",
  },
];

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8CEF5] bg-white text-[#2C1A67] transition-all hover:border-[#B9ACEC] hover:bg-[#F7F4FF]"
    >
      <span className="text-[18px] leading-none">{direction === "prev" ? "‹" : "›"}</span>
    </button>
  );
}

export default function RespondentTestimonials() {
  const [start, setStart] = useState(0);

  const visible = [0, 1, 2].map((offset) => testimonials[(start + offset) % testimonials.length]);

  return (
    <section className="bg-white px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px]">
        <RevealOnScroll>
          <div className="flex items-center justify-between gap-6 mb-10 lg:mb-12">
            <h2 className="text-[32px] sm:text-[44px] lg:text-[56px] leading-[0.95] tracking-[-0.05em] font-semibold text-[#1C0C4C]">
              Что говорят наши
              <br />
              респонденты
            </h2>
            <div className="flex items-center gap-3 shrink-0">
              <ArrowButton direction="prev" onClick={() => setStart((s) => (s === 0 ? testimonials.length - 1 : s - 1))} />
              <ArrowButton direction="next" onClick={() => setStart((s) => (s + 1) % testimonials.length)} />
            </div>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
          {visible.map((item, i) => (
            <RevealOnScroll key={`${item.name}-${i}`} delay={i * 80}>
              <div className="rounded-[28px] border border-[#E4DEF7] bg-[#FCFBFF] p-6 lg:p-7 flex flex-col h-full min-h-[200px]">
                <p className="text-[15px] lg:text-[16px] leading-[1.6] text-[#35236B] flex-1">
                  &laquo;{item.text}&raquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#1C0C4C]">{item.name}</div>
                    <div className="text-[13px] text-[#797691]">{item.meta}</div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
