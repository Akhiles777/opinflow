"use client";

import Image from "next/image";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  {
    icon: "/icons/profile-2user.svg",
    value: "800+",
    label: "исследований проведено",
    bg: "#6438D9",
  },
  {
    icon: "/icons/shield-tick.svg",
    value: "97%",
    label: "качество данных",
    bg: "#B8D934",
  },
  {
    icon: "/icons/add-square.svg",
    value: "15+",
    label: "компаний уже с нами",
    bg: "#6438D9",
  },
  {
    icon: "/icons/people.svg",
    value: "25k",
    label: "аудитория респондентов",
    bg: "#B8D934",
  },
];

export default function Hero() {
  return (
    <section className="px-4 pt-4 lg:px-6 lg:pt-6 bg-[#F5F5F5]">
  <div className="relative overflow-hidden rounded-[40px] bg-[#EFEBFF] min-h-[680px]">

        {/* Фоновый паттерн */}
        <div className="absolute inset-0">
          <Image
            src="/bg-img.svg"
            alt=""
            fill
            priority
            className="object-cover opacity-35"
          />
        </div>

        {/* Белый оверлей */}
        <div className="absolute inset-0 bg-white/20" />

        {/* Фиолетовый glow справа */}
        <div className="absolute right-[-120px] top-[80px] h-[700px] w-[700px]
                        rounded-full bg-[#6438D9]/10 blur-3xl pointer-events-none" />

        
        {/* Маленькая жёлто-зелёная точка */}
        <div className="absolute right-[380px] top-[120px] w-[18px] h-[18px]
                        rounded-full bg-[#E5F667] pointer-events-none hidden lg:block" />

        {/* Маленькая розовая точка */}
        <div className="absolute left-[420px] top-[280px] w-[24px] h-[24px]
                        rounded-full bg-[#D4B0FF]/60 pointer-events-none hidden lg:block" />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-10 pb-10 lg:px-16 lg:pt-14">
          <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-[0.9fr_1.1fr]">

            {/* ЛЕВАЯ ЧАСТЬ */}
            <div className="max-w-[680px] lg:pt-4">
              <RevealOnScroll>
                <h1 className="
                  font-manrope
                  text-[56px]
                  sm:text-[68px]
                  xl:text-[78px]
                  leading-[0.88]
                  tracking-[-5px]
                  font-[800]
                  text-[#1C0C4C]
                ">
                  Маркетинговые
                  <br />
                  <span className="text-[#6438D9]">
                    исследования
                  </span>
                  <br />
                  {/* Выделение жёлтым фоном */}
                  <span className="relative inline-block">
                    <span className="absolute inset-x-[-4px] bottom-[6px] top-[28px]
                                     rounded-[24px] bg-[#E5F667]" />
                    <span className="relative z-10 font-light">
                      за 5 минут,
                    </span>
                  </span>
                  <br />
                  <span className="font-[500] text-[#8E88A8]">
                    а не 5 недель
                  </span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={120}>
                <div className="mt-8">
                  <p className="text-[20px] leading-[1.45] text-[#797691]">
                    Платформа{" "}
                    <span className="font-semibold text-[#1C0C4C]">
                      ПотокМнений:
                    </span>
                  </p>
                  <ul className="mt-3 space-y-4">
                    {[
                      "Конструктор опросов",
                      "Аудитория 25 000 респондентов",
                      "ИИ-аналитика результатов",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-[19px] text-[#797691]"
                      >
                        {/* Плюс-иконка как в Figma */}
                        <span className="flex-shrink-0 text-[#6438D9] font-bold text-[16px]">
                          ✦
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={180}>
                <div className="mt-12 flex flex-wrap gap-4">
                  <Button variant="primary" size="lg" href="/register?role=CLIENT">
                    ✦ Запустить опрос
                  </Button>
                  <Button variant="secondary" size="lg" href="#demo">
                    Заказать демо
                  </Button>
                </div>
              </RevealOnScroll>
            </div>

            {/* ПРАВАЯ ЧАСТЬ */}
            <div className="relative flex items-center justify-end lg:min-h-[620px]">
              <RevealOnScroll direction="right">
                <div className="relative w-full max-w-[820px]">

                  {/* subtle glow */}
                  <div
                    className="
                      absolute
                      right-[60px]
                      top-[120px]
                      h-[420px]
                      w-[420px]
                      rounded-full
                      bg-[#6438D9]/8
                      blur-[90px]
                      pointer-events-none
                    "
                  />

                  {/* NOTEBOOK */}
                  <div className="relative z-10">
                    <Image
                      src="/laptop-1.svg"
                      alt="Dashboard"
                      width={1400}
                      height={1000}
                      priority
                      className="
                        w-full
                        h-auto
                        object-contain
                        drop-shadow-[0_40px_60px_rgba(28,12,76,0.14)]
                      "
                    />
                  </div>

                  {/* CARD 1 */}
                  <div
                    className="
                      absolute
                      left-[-30px]
                      top-[120px]
                      z-20
                      hidden
                      rounded-[18px]
                      border
                      border-[#ECE8FF]
                      bg-white/95
                      px-4
                      py-3
                      shadow-[0_10px_30px_rgba(28,12,76,0.08)]
                      backdrop-blur-sm
                      sm:block
                    "
                  >
                    <p className="text-[11px] font-medium text-[#797691]">
                      Узнаваемость бренда
                    </p>

                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#1C0C4C]">
                      72,1%
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-[#6438D9]">
                      +6,3%
                    </p>
                  </div>

                  {/* CARD 2 */}
                  <div
                    className="
                      absolute
                      right-[-10px]
                      top-[70px]
                      z-20
                      hidden
                      rounded-[18px]
                      border
                      border-[#ECE8FF]
                      bg-white/95
                      px-4
                      py-3
                      shadow-[0_10px_30px_rgba(28,12,76,0.08)]
                      backdrop-blur-sm
                      sm:block
                    "
                  >
                    <p className="text-[11px] font-medium text-[#797691]">
                      Конверсия
                    </p>

                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#1C0C4C]">
                      14,8%
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-[#B8D934]">
                      +2,1%
                    </p>
                  </div>

                  {/* CARD 3 */}
                  <div
                    className="
                      absolute
                      left-[40px]
                      bottom-[110px]
                      z-20
                      hidden
                      rounded-[18px]
                      border
                      border-[#ECE8FF]
                      bg-white/95
                      px-4
                      py-3
                      shadow-[0_10px_30px_rgba(28,12,76,0.08)]
                      backdrop-blur-sm
                      sm:block
                    "
                  >
                    <p className="text-[11px] font-medium text-[#797691]">
                      Источник соц. сети
                    </p>

                    <p className="mt-1 text-[28px] leading-none font-extrabold text-[#1C0C4C]">
                      42,7%
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-[#6438D9]">
                      +5,4%
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* СТАТИСТИКА СНИЗУ */}
          <RevealOnScroll delay={250}>
            <div className="mt-10 rounded-[28px] border border-[#DAD4F3]
                            bg-white/60 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-y-6 px-6 py-6 md:grid-cols-4 md:px-10 md:py-8">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-4">
                    {/* Иконка */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center
                                 justify-center rounded-2xl"
                      style={{ backgroundColor: stat.bg }}
                    >
                      {/* Fallback если иконка не загрузится */}
                      <Image
                        src={stat.icon}
                        alt=""
                        width={26}
                        height={26}
                        className="brightness-0 invert"
                        onError={(e) => {
                          // Если иконка не загрузилась — скрыть
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>

                    <div>
                      <div
                        className="text-[38px] leading-none font-bold"
                        style={{ color: stat.bg === "#6438D9" ? "#6438D9" : "#6438D9" }}
                      >
                        {stat.value}
                      </div>
                      <div className="mt-1 max-w-[130px] text-[15px]
                                      leading-[1.3] text-[#1C0C4C]">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>

        {/* Большой шар снизу справа — внутри секции */}
        <div
          className="absolute bottom-[-60px] right-[-40px] w-[280px] h-[280px]
                     rounded-full pointer-events-none hidden xl:block"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #A78BFF, #4C1D95)',
            boxShadow: '0 20px 80px rgba(100,56,217,0.5)',
          }}
        />

      </div>
    </section>
  );
}