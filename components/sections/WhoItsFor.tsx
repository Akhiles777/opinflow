import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const leftColumnAudiences = [
  {
    id: "02",
    title: "Маркетологи",
    subtitle: "— оценка кампаний и рекламы",
    description:
      "Измеряйте эффективность рекламы до, во время и после запуска. Узнавайте, что цепляет аудиторию, и оптимизируйте бюджет в реальном времени.",
  },
  {
    id: "04",
    title: "Менеджеры маркетплейсов",
    subtitle: "— исследования карточки и триггеров",
    description:
      "Карточка, которая продаёт сама. Проверяйте гипотезы по контенту и цене, понимайте боли покупателей и обгоняйте конкурентов.",
  },
];

const rightColumnAudiences = [
  {
    id: "01",
    title: "МСБ и стартапы",
    subtitle: "— быстрые тесты гипотез",
    description:
      "Проверьте идею до запуска, а не после. Запускайте опросы за 5 минут и получайте обратную связь от реальной аудитории.",
  },
  {
    id: "03",
    title: "Product-менеджеры",
    subtitle: "— исследования продукта",
    description:
      "Продукт, который любят, создается с обратной связью. Быстро проверяйте гипотезы и принимайте решения на основе данных от реальных пользователей.",
  },
  {
    id: "05",
    title: "Крупный бизнес",
    subtitle: "— white-label решение",
    description:
      "Ваш бренд — наша технология. Разворачивайте платформу опросов под ключ и масштабируйте исследования внутри компании.",
  },
];

function GlassCard({
  audience,
}: {
  audience: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
  };
}) {
  return (
    <div
      className={
      "group relative overflow-hidden rounded-[34px] border border-white/30 bg-[rgba(255,255,255,0.18)] p-9 lg:p-11 backdrop-blur-2xl backdrop-saturate-180 shadow-[0_8px_32px_rgba(31,38,135,0.10)] transition-all duration-500 hover:bg-[rgba(255,255,255,0.24)] hover:border-white/40 hover:-translate-y-1"
      }
    >
      {/* top light */}
      <div
        className={
          "pointer-events-none absolute inset-0 rounded-[34px] bg-linear-to-b from-white/30 via-white/10 to-white/3"
        }
      />

      {/* inner glow */}
      <div
        className={
          "pointer-events-none absolute inset-px rounded-[33px] bg-linear-to-br from-white/20 via-transparent to-transparent"
        }
      />

      {/* border highlight */}
      <div
        className={
          "pointer-events-none absolute inset-0 rounded-[34px] ring-1 ring-inset ring-white/20"
        }
      />

      {/* reflection */}
      <div
        className={
          "pointer-events-none absolute -top-30 -right-15 h-55 w-55 rounded-full bg-white/20 blur-[60px]"
        }
      />

      {/* content */}
      <div className="relative z-10">
  <span className="text-[15px] font-bold tracking-[0.08em] text-[#8E88A8]">
          {audience.id}
        </span>

  <h3 className="mt-4 font-manrope text-[30px] leading-[1.1] tracking-[-1px] font-bold text-[#241152]">
          {audience.title} <span className="text-[#6438D9]">{audience.subtitle}</span>
        </h3>

  <p className="mt-5 max-w-135 text-[18px] leading-[1.6] font-[450] text-[#6E6A86]">
          {audience.description}
        </p>
      </div>
    </div>
  );
}

export default function WhoItsFor() {
  return (
    <section
      className={
        "relative overflow-hidden bg-[#F5F5F5] px-4 pt-12 pb-20 sm:px-6 lg:px-6 lg:pt-16 lg:pb-24"
      }
      id="business"
    >
      {/* ambient purple glow */}
  <div className="pointer-events-none absolute left-[20%] top-[20%] h-125 w-125 rounded-full bg-[#6438D9]/10 blur-[120px]" />

      {/* ambient lime glow */}
  <div className="pointer-events-none absolute right-[10%] bottom-[10%] h-105 w-105 rounded-full bg-[#E5F667]/10 blur-[120px]" />

      {/* center glow */}
  <div className="pointer-events-none absolute left-1/2 top-10 h-175 w-175 -translate-x-1/2 rounded-full bg-[#6438D9]/8 blur-[140px]" />

  <div className="relative z-10 mx-auto max-w-360">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">

          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <RevealOnScroll>
              <div className="lg:sticky lg:top-12">
                <h2 className="font-manrope text-[44px] sm:text-[56px] lg:text-[64px] lg:ml-15 tracking-[-3px] leading-[0.95] font-extrabold text-[#1C0C4C]">
                  Кому подойдёт
                  <br />

                  <span className="text-[#6438D9]">ПотокМнений</span>
                </h2>
              </div>
            </RevealOnScroll>

            <div className="space-y-8">
              {leftColumnAudiences.map((audience, index) => (
                <RevealOnScroll key={audience.id} delay={index * 80}>
                  <GlassCard audience={audience} />
                </RevealOnScroll>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8 lg:pt-16">
            {rightColumnAudiences.map((audience, index) => (
              <RevealOnScroll key={audience.id} delay={(index + 2) * 80}>
                <GlassCard audience={audience} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}