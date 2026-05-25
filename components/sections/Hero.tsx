"use client";

import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  { icon: "/icons/profile-2user.svg", value: "800+", label: "исследований проведено", bg: "#6438D9" },
  { icon: "/icons/shield-tick.svg",   value: "97%",  label: "качество данных",         bg: "#B8D934" },
  { icon: "/icons/add-square.svg",    value: "15+",  label: "компаний уже с нами",     bg: "#6438D9" },
  { icon: "/icons/people.svg",        value: "25k",  label: "аудитория респондентов",  bg: "#B8D934" },
];

export default function Hero() {
  return (
    <section className="px-4 pt-4 lg:px-6 lg:pt-6 bg-white dark:bg-[#1C0C4C]">
      <div className="relative overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#EEE8FF_0%,#F0EAFF_50%,#F8F5FF_100%)] dark:bg-[#1A0748] min-h-[680px]">

        {/* Светлый фон */}
        <div className="absolute inset-0 dark:hidden">
          <Image src="/bg-img.svg" alt="" fill priority className="object-cover opacity-[0.07]" />
        </div>

        {/* Тёмный фон bg img-tem.svg — только dark */}
        <div className="absolute inset-0 hidden dark:block">
          <Image src="/bg%20img-tem.svg" alt="" fill priority className="object-cover" />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-white/15 dark:bg-[#1A0748]/35" />

        {/* Glow справа */}
        <div className="absolute right-[-120px] top-[80px] h-[700px] w-[700px] rounded-full bg-[#6438D9]/8 dark:bg-[#6438D9]/25 blur-3xl pointer-events-none" />
        {/* Glow слева */}
        <div className="absolute left-[-80px] top-[200px] h-[500px] w-[500px] rounded-full bg-[#7B4FF0]/6 dark:bg-[#7B4FF0]/15 blur-3xl pointer-events-none" />

        {/* Точки */}
        <div className="absolute right-[380px] top-[120px] w-[12px] h-[12px] rounded-full bg-[#6438D9]/40 dark:bg-[#D9F326]/80 pointer-events-none hidden lg:block" />
        <div className="absolute left-[420px] top-[280px] w-[18px] h-[18px] rounded-full bg-[#A78BFF]/25 dark:bg-[#A78BFF]/40 pointer-events-none hidden lg:block" />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-10 pb-10 lg:px-16 lg:pt-14">
          <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-[0.9fr_1.1fr]">

            {/* ЛЕВАЯ ЧАСТЬ */}
            <div className="max-w-[680px] lg:pt-4">
              <RevealOnScroll>
                <h1 className="font-manrope text-[52px] sm:text-[68px] xl:text-[78px] leading-[0.88] tracking-[-5px] font-[800] text-[#1C0C4C] dark:text-white">
                  Маркетинговые
                  <br />
                  <span className="text-[#6438D9] dark:text-[#A98BFF]">
                    исследования
                  </span>
                  <br />
                  <span className="relative inline-block">
                    <span className="absolute inset-x-[-4px] bottom-[6px] top-[28px] rounded-[24px] bg-[#D9F326]" />
                    <span className="relative z-10 font-light text-[#1C0C4C]">
                      за 5 минут,
                    </span>
                  </span>
                  <br />
                  <span className="font-[500] text-[#1C0C4C]/40 dark:text-white/90">
                    а не 5 недель
                  </span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={120}>
                <div className="mt-8">
                  <p className="text-[20px] leading-[1.45] text-[#4A3F6B] dark:text-white/95">
                    Платформа{" "}
                    <span className="font-semibold text-[#1C0C4C] dark:text-white">
                      ПотокМнений:
                    </span>
                  </p>
                  <ul className="mt-3 space-y-4">
                    {[
                      "Конструктор опросов",
                      "Аудитория 25 000 респондентов",
                      "ИИ-аналитика результатов",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-[19px] text-[#3D3462] dark:text-white/95">
                        <span className="flex-shrink-0 text-[#6438D9] dark:text-[#A78BFF] font-bold text-[16px]">✦</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={180}>
                <div className="mt-12 flex flex-wrap gap-4">
                  <Link
                    href="/register?role=CLIENT"
                    className="inline-flex items-center rounded-xl px-7 py-3.5 text-base font-medium bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)] text-[#1C0C4C] shadow-lg shadow-[#D9F326]/25 hover:shadow-[#D9F326]/40 transition-all duration-200"
                  >
                    ✦ Запустить опрос
                  </Link>
                  <Link
                    href="#demo"
                    className="inline-flex items-center rounded-xl px-7 py-3.5 text-base font-medium border border-[#C8BFEF] bg-white/70 text-[#2B1B67] dark:border-white/25 dark:bg-white/10 dark:text-white backdrop-blur-sm hover:bg-white dark:hover:bg-white/18 transition-all duration-200"
                  >
                    Заказать демо
                  </Link>
                </div>
              </RevealOnScroll>
            </div>

            {/* ПРАВАЯ ЧАСТЬ */}
            <div className="relative flex items-center justify-end lg:min-h-[620px]">
              <RevealOnScroll direction="right">
                <div className="relative w-full max-w-[820px]">
                  <div className="absolute right-[60px] top-[120px] h-[420px] w-[420px] rounded-full bg-[#6438D9]/8 dark:bg-[#6438D9]/20 blur-[90px] pointer-events-none" />

                  {/* НОУТБУК */}
                  <div className="relative z-10">
                    <Image
                      src="/laptop-1.svg"
                      alt="Dashboard"
                      width={1400}
                      height={1000}
                      priority
                      className="w-full h-auto object-contain drop-shadow-[0_40px_60px_rgba(100,56,217,0.18)] dark:drop-shadow-[0_40px_60px_rgba(100,56,217,0.35)]"
                    />
                  </div>

                  {/* CARD 1 — всегда белая */}
                  <div className="absolute left-[-30px] top-[120px] z-20 hidden sm:block rounded-[18px] border border-[#E4DEF7] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(100,56,217,0.10)] backdrop-blur-sm">
                    <p className="text-[11px] font-medium text-[#6E6884]">Узнаваемость бренда</p>
                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#1C0C4C]">72,1%</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#6438D9]">+6,3%</p>
                  </div>

                  {/* CARD 2 — всегда белая */}
                  <div className="absolute right-[-10px] top-[70px] z-20 hidden sm:block rounded-[18px] border border-[#E4DEF7] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(100,56,217,0.10)] backdrop-blur-sm">
                    <p className="text-[11px] font-medium text-[#6E6884]">Конверсия</p>
                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#1C0C4C]">14,8%</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#6438D9]">+2,1%</p>
                  </div>

                  {/* CARD 3 — всегда белая */}
                  <div className="absolute left-[40px] bottom-[110px] z-20 hidden sm:block rounded-[18px] border border-[#E4DEF7] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(100,56,217,0.10)] backdrop-blur-sm">
                    <p className="text-[11px] font-medium text-[#6E6884]">Источник соц. сети</p>
                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#1C0C4C]">42,7%</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#6438D9]">+5,4%</p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* СТАТИСТИКА СНИЗУ */}
          <RevealOnScroll delay={250}>
            <div className="mt-8 lg:mt-10 rounded-[24px] lg:rounded-[30px] border border-[#DDD5F0] dark:border-white/8 bg-white/75 dark:bg-white/5 backdrop-blur-xl overflow-hidden">
              <div className="grid grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DDD5F0] dark:divide-white/8">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 lg:gap-4 px-4 py-4 sm:px-6 lg:px-7 lg:py-6 min-w-0">
                    <div
                      className="flex shrink-0 items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-[16px] lg:rounded-[18px]"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <Image src={stat.icon} alt="" width={24} height={24} className="brightness-0 invert" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[24px] sm:text-[30px] lg:text-[40px] leading-none tracking-[-0.05em] font-extrabold text-[#6438D9] dark:text-[#D9F326]">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-[13px] sm:text-[14px] lg:text-[15px] leading-[1.35] text-[#6E6884] dark:text-white/85 max-w-[150px]">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>

        {/* Шар — светлый */}
        <div
          className="absolute bottom-[-60px] right-[-40px] w-[280px] h-[280px] rounded-full pointer-events-none hidden xl:block dark:hidden"
          style={{
            background: "radial-gradient(circle at 30% 30%, #C4B5FF, #9A7CFF)",
            boxShadow: "0 20px 60px rgba(100,56,217,0.18)",
          }}
        />
        {/* Шар — тёмный */}
        <div
          className="absolute bottom-[-60px] right-[-40px] w-[280px] h-[280px] rounded-full pointer-events-none xl:hidden dark:xl:block"
          style={{
            background: "radial-gradient(circle at 30% 30%, #A78BFF, #4C1D95)",
            boxShadow: "0 20px 80px rgba(100,56,217,0.6)",
          }}
        />
      </div>
    </section>
  );
}
