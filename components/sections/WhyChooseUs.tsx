"use client";

import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const benefits = [
  { icon: "/WhyChoose-icon/icons 2.svg", title: "Запуск опроса за 5 минут" },
  { icon: "/WhyChoose-icon/icons 3.svg", title: "От 1 000 ₽ за исследование" },
  { icon: "/WhyChoose-icon/icons 4.svg", title: "Таргетированная аудитория" },
  { icon: "/WhyChoose-icon/icons 5.svg", title: "ИИ-аналитика в реальном времени" },
  { icon: "/WhyChoose-icon/icons 6.svg", title: "97% верифицированных данных" },
  { icon: "/WhyChoose-icon/icons 7.svg", title: "Только проверенные респонденты" },
];

export default function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden bg-[#FCFBFF] dark:bg-[#1C0C4C] py-20 lg:py-28">
      {/* background glow */}
      <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#EFEBFF] dark:bg-[#6438D9]/20 opacity-70 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <h2 className="text-[44px] sm:text-[58px] lg:text-[78px] leading-[0.9] tracking-[-0.06em] font-semibold text-[#1C0C4C] dark:text-white mb-8 lg:mb-10">
            Почему выбирают нас
          </h2>
        </RevealOnScroll>

        {/* desktop layout — xl+ */}
        <div className="hidden xl:grid xl:grid-cols-[1fr_260px] gap-4">
          <div className="grid grid-cols-3 gap-4">
            {benefits.map((item, index) => (
              <RevealOnScroll key={index} delay={index * 50}>
                <div className="relative overflow-hidden h-[190px] rounded-[30px] border border-[#E9E3FA] dark:border-white/10 bg-white/45 dark:bg-white/6 backdrop-blur-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_42%)]" />
                  <div className="relative z-10 w-[54px] h-[54px] rounded-[18px] bg-gradient-to-br from-[#9A7CFF] to-[#6438D9] flex items-center justify-center shadow-[0_10px_30px_rgba(100,56,217,0.18)]">
                    <Image src={item.icon} alt={item.title} width={24} height={24} />
                  </div>
                  <h3 className="relative z-10 text-[20px] leading-[1.05] tracking-[-0.04em] font-semibold text-[#1C0C4C] dark:text-white max-w-[220px]">
                    {item.title}
                  </h3>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll delay={200}>
            <div className="relative overflow-hidden rounded-[30px] border border-[#E9E3FA] dark:border-white/10 bg-white/45 dark:bg-white/6 backdrop-blur-2xl min-h-[500px]">
              <Image
                src="/img_why_choose.svg"
                alt="Поток мнений"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-white/10 dark:bg-white/5" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_35%)]" />
            </div>
          </RevealOnScroll>
        </div>

        {/* mobile/tablet layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:hidden">
          {benefits.map((item, index) => (
            <RevealOnScroll key={index} delay={index * 50}>
              <div className="relative overflow-hidden min-h-[180px] rounded-[28px] border border-[#E9E3FA] dark:border-white/10 bg-white/45 dark:bg-white/6 backdrop-blur-2xl p-7 flex flex-col justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_42%)]" />
                <div className="relative z-10 w-[52px] h-[52px] rounded-[16px] bg-gradient-to-br from-[#9A7CFF] to-[#6438D9] flex items-center justify-center">
                  <Image src={item.icon} alt={item.title} width={22} height={22} />
                </div>
                <h3 className="relative z-10 text-[20px] leading-[1.05] tracking-[-0.04em] font-semibold text-[#1C0C4C] dark:text-white max-w-[220px]">
                  {item.title}
                </h3>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}