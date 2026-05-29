"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  { num: "800+", label: "исследований проведено" },
  { num: "25 000+", label: "респондентов" },
  { num: "15+", label: "компаний уже с нами" },
];

const pills = ["Ритейл", "FMCG", "Финтех", "EdTech", "Медиа", "E-commerce"];

const testimonials = [
  {
    text: "Запустили исследование за день вместо обычных двух недель. Данные точные, аналитика понятная.",
    initials: "ГЕ",
    name: "Галина Елизавета",
    role: "Маркетолог",
  },
  {
    text: "Антифрод реально работает — качество ответов на высоте. Получили чистую выборку с первого запуска.",
    initials: "ДМ",
    name: "Дмитрий Михайлов",
    role: "Product Manager",
  },
  {
    text: "Провели NPS-исследование на 300 респондентов. Результаты за 2 дня, PDF-отчёт — в один клик.",
    initials: "ЕВ",
    name: "Елена Василенко",
    role: "Директор по маркетингу",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-[#F8F6FF] dark:bg-[#1C0C4C] px-4 py-16 lg:py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1350px]">

        <RevealOnScroll>
          <h2 className="text-[44px] font-semibold leading-[0.9] tracking-[-0.07em] text-[#24115D] dark:text-white sm:text-[58px] lg:text-[72px] mb-12 lg:mb-14">
            Нам доверяют
          </h2>
        </RevealOnScroll>

        <div className="flex flex-col lg:flex-row gap-12 items-start">

          {/* LEFT — stats + pills */}
          <div className="lg:w-[40%] flex-shrink-0">
            <RevealOnScroll>
              <div className="flex flex-col gap-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="font-manrope text-[52px] sm:text-[64px] font-[800] tracking-[-3px] leading-none text-[#6438D9] dark:text-[#A98BFF]">
                      {s.num}
                    </div>
                    <div className="mt-1 text-[16px] text-[#6B5F9E] dark:text-white/60">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={80}>
              <div className="mt-8 flex flex-wrap gap-2">
                {pills.map((p) => (
                  <span
                    key={p}
                    className="bg-[#F3F0FF] dark:bg-white/10 text-[#6438D9] dark:text-[#A98BFF] rounded-full px-4 py-2 text-[14px] font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </RevealOnScroll>
          </div>

          {/* RIGHT — testimonial cards */}
          <div className="lg:w-[60%] flex flex-col gap-4">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={t.name} direction="right" delay={i * 80}>
                <div className="bg-white dark:bg-white/6 dark:border dark:border-white/10 rounded-[20px] p-6 border border-[#F0EBF8]">
                  <p className="text-[15px] lg:text-[16px] leading-[1.65] text-[#35236B] dark:text-white/80">
                    «{t.text}»
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#6438D9] text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-[#1C0C4C] dark:text-white">
                        {t.name}
                      </div>
                      <div className="text-[13px] text-[#9B8FC9] dark:text-white/50">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
