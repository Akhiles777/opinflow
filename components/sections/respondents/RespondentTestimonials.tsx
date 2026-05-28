"use client";
import { useState } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const testimonials = [
  { text: "Прошла уже 12 опросов, вывел 1 340 ₽ на СБП. Всё честно, без задержек!", name: "Анна", meta: "28 лет, Екатеринбург", initials: "АН" },
  { text: "Удобно, что опросы приходят по интересам. Не трачу время на неподходящие.", name: "Дмитрий", meta: "34 года, Казань", initials: "ДМ" },
  { text: "Реферальная программа огонь! Пригласил друга, получил бонус", name: "Мария", meta: "22 года, Новосибирск", initials: "МА" },
];

function ArrowBtn({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4CBF0] bg-white text-[#2C1A67] transition-all hover:border-[#B49DFF] hover:bg-[#F3EEFF]">
      <span className="text-[20px] leading-none select-none">{dir === "prev" ? "‹" : "›"}</span>
    </button>
  );
}

export default function RespondentTestimonials() {
  const [start, setStart] = useState(0);
  const visible = [0, 1, 2].map(o => testimonials[(start + o) % testimonials.length]);

  return (
    <section className="bg-[#FAFBFF] px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-6">
        <RevealOnScroll>
          <div className="flex items-center justify-between gap-6 mb-10 lg:mb-14">
            <h2 className="font-manrope text-[32px] sm:text-[44px] lg:text-[58px] leading-[0.95] tracking-[-0.04em] font-extrabold text-[#1C0C4C]">
              Что говорят наши<br />респонденты
            </h2>
            <div className="flex items-center gap-3 shrink-0">
              <ArrowBtn dir="prev" onClick={() => setStart(s => (s === 0 ? testimonials.length - 1 : s - 1))} />
              <ArrowBtn dir="next" onClick={() => setStart(s => (s + 1) % testimonials.length)} />
            </div>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
          {visible.map((item, i) => (
            <RevealOnScroll key={`${item.name}-${i}`} delay={i * 80}>
              <div className="rounded-[24px] border border-[#E4DEF7] bg-white p-6 lg:p-8 flex flex-col h-full min-h-[200px]">
                <div className="mb-2 text-[#6438D9] text-[28px] font-serif leading-none">&ldquo;</div>
                <p className="text-[15px] lg:text-[16px] leading-[1.65] text-[#35236B] flex-1">{item.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6438D9] text-[13px] font-bold text-white">
                    {item.initials}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#1C0C4C]">{item.name}</div>
                    <div className="text-[13px] text-[#9B8FC9]">{item.meta}</div>
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
