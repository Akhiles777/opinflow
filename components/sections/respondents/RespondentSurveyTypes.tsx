"use client";

import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const surveys = [
  {
    image: "/Respondent/img_res5.svg",
    title: "Оценка нового дизайна упаковки сока",
    time: "7 минут",
    pay: "85 ₽",
    audience: "Женщины 18–35 лет",
    bg: "#EDE8FF",
  },
  {
    image: "/Respondent/img_res4.svg",
    title: "Отношение к электромобилям в РФ",
    time: "12 минут",
    pay: "150 ₽",
    audience: "Автовладельцы",
    bg: "#EDE8FF",
  },
  {
    image: "/Respondent/img_res3.png",
    title: "Предпочтения в доставке еды",
    time: "5 минут",
    pay: "45 ₽",
    audience: "Все респонденты",
    bg: "#EDE8FF",
  },
  {
    image: "/Respondent/Слой9 1.svg",
    title: "Удобство мобильного приложения банка",
    time: "10 минут",
    pay: "120 ₽",
    audience: "Пользователи смартфонов",
    bg: "#EDE8FF",
  },
];

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="#9B8FC9" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="#9B8FC9" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="#9B8FC9" strokeWidth="1.8" />
      <path d="M12 7v10M9.5 9.5C9.5 8.4 10.6 7.5 12 7.5s2.5.9 2.5 2-.9 2-2.5 2-2.5.9-2.5 2 1.1 2.5 2.5 2.5 2.5-.9 2.5-2" stroke="#9B8FC9" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9B8FC9" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="#9B8FC9" strokeWidth="1.8" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#9B8FC9" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function RespondentSurveyTypes() {
  return (
    <section className="bg-white px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px]">

        {/* Header row */}
        <RevealOnScroll>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 lg:mb-12">
            <h2 className="text-[32px] sm:text-[44px] lg:text-[56px] leading-[0.95] tracking-[-0.05em] font-semibold text-[#1C0C4C]">
              Какие опросы ты
              <br />
              будешь проходить
            </h2>
            <Link
              href="/surveys"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#D9F326] px-5 py-2.5 text-[14px] font-semibold text-[#1C0C4C] transition-transform hover:scale-[1.02]"
            >
              Все доступные опросы
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H7M17 7v10" stroke="#1C0C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </RevealOnScroll>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {surveys.map((s, i) => (
            <RevealOnScroll key={s.title} delay={i * 80}>
              <div className="rounded-[28px] border border-[#E4DEF7] bg-white overflow-hidden flex flex-col transition-shadow hover:shadow-[0_8px_32px_rgba(100,56,217,0.10)]">

                {/* Image area */}
                <div
                  className="flex items-center justify-center h-[200px] sm:h-[220px]"
                  style={{ backgroundColor: s.bg }}
                >
                  <Image
                    src={s.image}
                    alt={s.title}
                    width={240}
                    height={180}
                    className="object-contain w-[200px] h-[160px]"
                  />
                </div>

                {/* Info area */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="text-[16px] font-semibold text-[#1C0C4C] leading-[1.3]">
                    {s.title}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon />
                      <span className="text-[13px] text-[#797691]">Время прохождения</span>
                      <span className="text-[13px] font-semibold text-[#1C0C4C]">{s.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CoinIcon />
                      <span className="text-[13px] text-[#797691]">Оплата</span>
                      <span className="text-[13px] font-semibold text-[#6438D9]">{s.pay}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <PeopleIcon />
                    <span className="text-[13px] text-[#797691]">Респонденты</span>
                    <span className="text-[13px] font-semibold text-[#1C0C4C]">{s.audience}</span>
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
