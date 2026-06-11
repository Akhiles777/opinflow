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
    <section id="top" className="px-4 pt-4 lg:px-6 lg:pt-6 bg-white dark:bg-[#1C0C4C]">
      <div className="relative overflow-hidden rounded-[40px] bg-[#EEEAFF] dark:bg-[#1A0748] min-h-[640px] lg:min-h-[700px]">

        {/* Фоновый паттерн светлый */}
        <div className="absolute inset-0 dark:hidden pointer-events-none">
          <Image src="/bg-img.svg" alt="" fill priority className="object-cover opacity-[0.06]" />
        </div>

        {/* Фоновый паттерн тёмный */}
        <div className="absolute inset-0 hidden dark:block pointer-events-none">
          <Image src="/bg%20img-tem.svg" alt="" fill priority className="object-cover" />
        </div>

        {/* Оверлей */}
        <div className="absolute inset-0 bg-white/10 dark:bg-[#1A0748]/30 pointer-events-none" />

        {/* Большой светлый круг справа за ноутбуком */}
        <div
          className="absolute right-[-100px] top-[-80px] w-[700px] h-[700px] rounded-full pointer-events-none dark:hidden"
          style={{ background: "radial-gradient(circle at 40% 40%, #DDD5FF 0%, #EDE9FF 50%, transparent 75%)" }}
        />

        {/* Glow пятна */}
        <div className="absolute right-[-80px] top-[60px] h-[600px] w-[600px] rounded-full bg-[#6438D9]/8 dark:bg-[#6438D9]/20 blur-3xl pointer-events-none" />
        <div className="absolute left-[-60px] top-[180px] h-[400px] w-[400px] rounded-full bg-[#7B4FF0]/5 dark:bg-[#7B4FF0]/15 blur-3xl pointer-events-none" />

        {/* Декоративные точки */}
        <div className="absolute right-[36%] top-[14px] w-[13px] h-[13px] rounded-full bg-[#C8FF00] pointer-events-none hidden lg:block" />
        <div className="absolute left-[44%] top-[55%] w-[10px] h-[10px] rounded-full bg-[#A78BFF]/40 pointer-events-none hidden lg:block" />

        {/* Декоративные шары */}
        {/* Маленький фиолетовый — левее ноутбука */}
        <div
          className="absolute left-[44%] top-[38%] w-[48px] h-[48px] rounded-full pointer-events-none hidden xl:block"
          style={{ background: "radial-gradient(circle at 35% 30%, #B49DFF, #7B5CF6)", boxShadow: "0 8px 24px rgba(100,56,217,0.30)" }}
        />
        {/* Средний фиолетовый — под ноутбуком справа */}
        <div
          className="absolute right-[-20px] bottom-[80px] w-[160px] h-[160px] rounded-full pointer-events-none hidden xl:block"
          style={{ background: "radial-gradient(circle at 35% 30%, #C4B5FF, #7B5CF6)", boxShadow: "0 16px 48px rgba(100,56,217,0.25)" }}
        />
        {/* Большой фиолетовый — правый нижний угол */}
        <div
          className="absolute right-[-60px] bottom-[-80px] w-[260px] h-[260px] rounded-full pointer-events-none hidden xl:block"
          style={{ background: "radial-gradient(circle at 30% 30%, #A78BFF, #4C1D95)", boxShadow: "0 20px 80px rgba(100,56,217,0.45)" }}
        />
        {/* Маленький жёлтый — правый верхний */}
        <div
          className="absolute right-[8%] top-[6%] w-[18px] h-[18px] rounded-full pointer-events-none hidden xl:block"
          style={{ background: "#C8FF00" }}
        />
        {/* Маленький жёлтый — правее центра */}
        <div
          className="absolute right-[22%] top-[18%] w-[12px] h-[12px] rounded-full pointer-events-none hidden xl:block"
          style={{ background: "#D9F326" }}
        />

        {/* Основной контент */}
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-10 pb-6 lg:px-16 lg:pt-14">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">

            {/* ЛЕВАЯ ЧАСТЬ */}
            <div className="max-w-[560px]">
              <RevealOnScroll>
                <h1 className="font-manrope text-[46px] sm:text-[60px] xl:text-[72px] leading-[0.9] tracking-[-4px] font-[800] text-[#1C0C4C] dark:text-white">
                  Маркетинговые
                  <br />
                  <span className="text-[#6438D9] dark:text-[#A98BFF]">исследования</span>
                  <br />
                  <span className="relative inline-block">
                    {/* Жёлтый хайлайт под текстом */}
                    <span className="absolute inset-x-[-4px] bottom-[4px] top-[24px] rounded-[16px] bg-[#D9F326]" />
                    <span className="relative z-10 font-[400] text-[#1C0C4C] dark:text-[#1C0C4C]">за 5 минут,</span>
                  </span>
                  <br />
                  <span className="font-[500] text-[#1C0C4C]/40 dark:text-white/80">а не 5 недель</span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={100}>
                <div className="mt-8">
                  <p className="text-[18px] leading-[1.5] text-[#4A3F6B] dark:text-white/80">
                    Платформа{" "}
                    <span className="font-semibold text-[#1C0C4C] dark:text-white">ПотокМнений:</span>
                  </p>
                  <ul className="mt-3 space-y-3">
                    {[
                      "Конструктор опросов",
                      "Аудитория 25 000 респондентов",
                      "ИИ-аналитика результатов",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-[17px] text-[#3D3462] dark:text-white/90">
                        <span className="text-[#6438D9] dark:text-[#A78BFF] font-bold text-[14px] flex-shrink-0">✦</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={160}>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/register?role=CLIENT"
                    className="inline-flex items-center gap-2 rounded-[14px] px-7 py-3.5 text-[16px] font-[600] bg-[#6438D9] text-white shadow-[0_8px_24px_rgba(100,56,217,0.35)] hover:bg-[#5530C4] hover:shadow-[0_8px_32px_rgba(100,56,217,0.45)] transition-all duration-200"
                  >
                    ✦ Запустить опрос
                  </Link>
                  <Link
                    href="/register?role=CLIENT"
                    className="inline-flex items-center rounded-[14px] px-7 py-3.5 text-[16px] font-[600] border border-[#C8BFEF] bg-white/70 text-[#2B1B67] dark:border-white/25 dark:bg-white/10 dark:text-white backdrop-blur-sm hover:bg-white dark:hover:bg-white/18 transition-all duration-200"
                  >
                    Заказать демо
                  </Link>
                </div>
              </RevealOnScroll>
            </div>

            {/* ПРАВАЯ ЧАСТЬ — ноутбук с плавающими карточками */}
            <div className="relative flex items-center justify-center lg:justify-end">
              <RevealOnScroll direction="right" className="relative w-full">

                {/* Ноутбук */}
                <div className="relative z-10 w-full">
                  <Image
                    src="/laptop-1.svg"
                    alt="Платформа ПотокМнений"
                    width={900}
                    height={680}
                    priority
                    className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(28,12,76,0.15)]"
                  />
                </div>

                {/* Плавающая карточка — Узнаваемость бренда (верх слева) */}
                <div className="absolute left-[-20px] top-[10%] z-20 hidden sm:block rounded-[16px] border border-[#E4DEF7] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(100,56,217,0.12)]">
                  <p className="text-[11px] font-medium text-[#6E6884]">Узнаваемость бренда</p>
                  <p className="mt-1 text-[24px] leading-none font-extrabold text-[#1C0C4C]">72,1%</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#6438D9]">+6,3%</p>
                </div>

                {/* Плавающая карточка — Конверсия (верх справа) */}
                <div className="absolute right-[-10px] top-[4%] z-20 hidden sm:block rounded-[16px] border border-[#E4DEF7] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(100,56,217,0.12)]">
                  <p className="text-[11px] font-medium text-[#6E6884]">Конверсия</p>
                  <p className="mt-1 text-[24px] leading-none font-extrabold text-[#1C0C4C]">14,8%</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#6438D9]">+2,1%</p>
                </div>

                {/* Плавающая карточка — Источник (низ слева) */}
                <div className="absolute left-[0px] bottom-[18%] z-20 hidden sm:block rounded-[16px] border border-[#E4DEF7] bg-white px-4 py-3 shadow-[0_12px_32px_rgba(100,56,217,0.12)]">
                  <p className="text-[11px] font-medium text-[#6E6884]">Источник: соц. сети</p>
                  <p className="mt-1 text-[24px] leading-none font-extrabold text-[#1C0C4C]">42,7%</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#6438D9]">+5,4%</p>
                </div>

              </RevealOnScroll>
            </div>
          </div>

          {/* СТАТИСТИКА СНИЗУ */}
          <RevealOnScroll delay={220}>
            <div className="mt-8 rounded-[24px] border border-[#DDD5F0] dark:border-white/8 bg-white/75 dark:bg-white/5 backdrop-blur-xl overflow-hidden">
              <div className="grid grid-cols-2 xl:grid-cols-4 divide-y xl:divide-y-0 xl:divide-x divide-[#DDD5F0] dark:divide-white/8">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 lg:gap-4 px-5 py-4 lg:px-7 lg:py-5 min-w-0">
                    <div
                      className="flex shrink-0 items-center justify-center w-11 h-11 lg:w-13 lg:h-13 rounded-[14px] lg:rounded-[16px]"
                      style={{ backgroundColor: stat.bg }}
                    >
                      <Image src={stat.icon} alt="" width={22} height={22} className="brightness-0 invert" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[22px] sm:text-[28px] lg:text-[36px] leading-none tracking-[-0.04em] font-extrabold text-[#6438D9] dark:text-[#D9F326]">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-[12px] sm:text-[13px] lg:text-[14px] leading-[1.3] text-[#6E6884] dark:text-white/80">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}