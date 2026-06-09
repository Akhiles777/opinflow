"use client";

import Image from "next/image";
import Link from "next/link";

const surveys = [
  {
    title: "Оценка нового дизайна упаковки сока",
    time: "7 минут",
    pay: "85 ₽",
    audience: "Женщины 18–35 лет",
    image: "/Respondent/img_res2.svg",
  },
  {
    title: "Отношение к электромобилям в РФ",
    time: "12 минут",
    pay: "150 ₽",
    audience: "Автовладельцы",
    image: "/Respondent/img_res3.svg",
  },
  {
    title: "Предпочтения в доставке еды",
    time: "5 минут",
    pay: "45 ₽",
    audience: "Все респонденты",
    image: "/Respondent/img_res4.svg",
  },
  {
    title: "Удобство мобильного приложения банка",
    time: "10 минут",
    pay: "120 ₽",
    audience: "Пользователи смартфонов",
    image: "/Respondent/img_res5.svg",
  },
];

const balls = [
  { top: "12px",  left: "20px",  size: 16, color: "#7B5ED4", opacity: 0.75 },
  { top: "44px",  right: "36px", size: 11, color: "#C8FF00", opacity: 1 },
  { top: "30%",   left: "10%",   size: 9,  color: "#9575D4", opacity: 0.55 },
  { bottom: "36px", left: "22%", size: 17, color: "#6B4EC0", opacity: 0.45 },
  { bottom: "20px", right: "20%",size: 13, color: "#C8FF00", opacity: 0.85 },
  { top: "22%",   right: "16%",  size: 8,  color: "#C8FF00", opacity: 0.9 },
  { bottom: "18%", right: "6%",  size: 20, color: "#8B6FD4", opacity: 0.35 },
  { top: "55%",   left: "38%",   size: 10, color: "#7B5ED4", opacity: 0.5 },
];

export default function RespondentSurveys() {
  return (
    <section className="bg-white dark:bg-[#160840] py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">

        {/* Шапка */}
        <div className="flex items-start justify-between gap-6 mb-10 lg:mb-12">
          <h2
            className="font-manrope font-[800] text-[#1D0B57] dark:text-white leading-[1.0] tracking-[-0.04em]"
            style={{ fontSize: "clamp(32px, 4vw, 54px)" }}
          >
            Какие опросы ты<br />будешь проходить
          </h2>

<Link
  href="/respondent/feed"
  className="flex-shrink-0  inline-flex items-center gap-3 rounded-full bg-[#6438D9] px-5 py-[11px] text-[15px] font-[600] text-white transition-all hover:bg-[#5530C4] hover:scale-[1.02]"
>
  Все доступные опросы
  <Image src="/Respondent/icon/arrow-circle-right.svg" alt="" width={24} height={24} />
</Link>
        </div>

        {/* 2×2 сетка */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          {surveys.map((survey) => (
            <div
              key={survey.title}
              className="group rounded-[20px] overflow-hidden border border-[#EBE5F5] dark:border-white/8 transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(100,56,217,0.10)] cursor-pointer"
            >
              {/* ===== ВЕРХ — лавандовый с картинкой на весь блок ===== */}
              <div
                className="relative w-full overflow-hidden bg-[#EAE3FF] dark:bg-[#2D1A7A]"
                style={{ height: "280px" }}
              >
                {/* Декоративные шары */}
                {balls.map((b, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      top: b.top,
                      left: b.left,
                      right: (b as any).right,
                      bottom: (b as any).bottom,
                      width: b.size,
                      height: b.size,
                      background: b.color,
                      opacity: b.opacity,
                    }}
                  />
                ))}

                {/* Центральное свечение */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.22) 0%, transparent 60%)",
                  }}
                />

                {/* Иллюстрация — на весь блок, object-cover */}
                <Image
                  src={survey.image}
                  alt={survey.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>

              {/* ===== НИЗ — белый с текстом ===== */}
              <div className="bg-white dark:bg-[#1F0E5C] px-6 py-5">

                {/* Заголовок */}
                <h3 className="text-[18px] lg:text-[20px] font-[700] text-[#1D0B57] dark:text-white leading-[1.25] mb-5">
                  {survey.title}
                </h3>

                {/* Статы горизонтально */}
                <div className="flex flex-wrap items-start gap-x-6 gap-y-3">

                  <div className="flex flex-col gap-[6px]">
                    <div className="flex items-center gap-[7px]">
                      <Image src="/Respondent/icon/clock.svg" alt="" width={18} height={18} />
                      <span className="text-[14px] text-[#9585C8] dark:text-white/45 font-[500]">Время прохождения</span>
                    </div>
                    <span className="text-[17px] font-[700] text-[#1D0B57] dark:text-white">{survey.time}</span>
                  </div>

                  <div className="flex flex-col gap-[6px]">
                    <div className="flex items-center gap-[7px]">
                      <Image src="/Respondent/icon/moneys.svg" alt="" width={18} height={18} />
                      <span className="text-[14px] text-[#9585C8] dark:text-white/45 font-[500]">Оплата</span>
                    </div>
                    <span className="text-[17px] font-[700] text-[#1D0B57] dark:text-white">{survey.pay}</span>
                  </div>

                  <div className="flex flex-col gap-[6px]">
                    <div className="flex items-center gap-[7px]">
                      <Image src="/Respondent/icon/profile.svg" alt="" width={18} height={18} />
                      <span className="text-[14px] text-[#9585C8] dark:text-white/45 font-[500]">Респонденты</span>
                    </div>
                    <span className="text-[17px] font-[700] text-[#1D0B57] dark:text-white">{survey.audience}</span>
                  </div>

                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
