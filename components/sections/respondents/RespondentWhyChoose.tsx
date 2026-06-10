"use client";

import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const features = [
  {
    icon: "/Respondent/icon/icons-2.svg",
    title: "Честные выплаты",
    desc: "Цена указана заранее — никаких сюрпризов",
  },
  {
    icon: "/Respondent/icon/icons-3.svg",
    title: "Быстро и удобно",
    desc: "Опросы занимают 3–15 минут. Проходи в любое время",
  },
  {
    icon: "/Respondent/icon/icon-4.svg",
    title: "Только релевантные опросы",
    desc: "Получай предложения, которые подходят твоему возрасту, городу и интересам",
  },
  {
    icon: "/Respondent/icon/icons-5.svg",
    title: "Безопасность данных",
    desc: "Твоя анонимность защищена. Мы не передаём личные данные третьим лицам",
  },
  {
    icon: "/Respondent/icon/icons-6.svg",
    title: "Бонусы за активность",
    desc: "Реферальная программа, ежедневные квесты и повышенные ставки для профи",
  },
  {
    icon: "/Respondent/icon/icons-7.svg",
    title: "Прозрачная статистика",
    desc: "Следи за заработком, пройденными опросами и рейтингом в личном кабинете",
  },
];

export default function RespondentWhyChoose() {
  return (
    <section className="bg-white dark:bg-[#160840] px-3 py-3 lg:px-5 lg:py-5">
      <div
        className="relative overflow-hidden mx-auto max-w-[1600px] rounded-[36px] py-16 lg:py-24 bg-[rgba(237,232,255,0.45)] dark:bg-[#1A0A4A] dark:border-white/10"
        style={{
          border: "1.5px solid rgba(255, 255, 255, 0.75)",
          boxShadow: "0 0 0 1px rgba(200,185,255,0.15), 0 4px 40px rgba(140,100,255,0.06)",
        }}
      >
        {/* Glow blobs */}
        <div className="absolute top-[-80px] left-[10%] w-[400px] h-[400px] rounded-full bg-[#C4B0FF]/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[5%] w-[350px] h-[350px] rounded-full bg-[#B49DFF]/15 blur-[90px] pointer-events-none" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#9B7FFF]/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-16">

        <RevealOnScroll>
          <h2 className="font-manrope text-[34px] sm:text-[46px] lg:text-[56px] leading-[0.95] tracking-[-0.04em] font-extrabold text-[#1C0C4C] dark:text-white mb-10 lg:mb-14">
            Почему респонденты выбирают{" "}
            <br className="hidden sm:block" />
            <span className="text-[#6438D9]">ПотокМнений</span>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {features.map((f, i) => (
            <RevealOnScroll key={f.title} delay={i * 70}>
              <div
                className="flex flex-col h-full rounded-[28px] p-6 lg:p-7 transition-transform duration-300 hover:-translate-y-[3px] bg-white/12 dark:bg-white/6 [border:1.5px_solid_rgba(255,255,255,0.88)] dark:border-white/10 backdrop-blur-[20px]"
                style={{
                  boxShadow: "0 8px 32px rgba(100, 56, 217, 0.07), inset 0 1px 0 rgba(255,255,255,1)",
                }}
              >
                <div
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] mb-6"
                  style={{
                    background: "linear-gradient(145deg, #7C50E8, #5A30C4)",
                    boxShadow: "0 4px 14px rgba(100, 56, 217, 0.30)",
                  }}
                >
                  <Image src={f.icon} alt="" width={22} height={22} />
                </div>

                <div className="text-[17px] lg:text-[18px] font-[650] text-[#1C0C4C] dark:text-white mb-2 leading-[1.25]">
                  {f.title}
                </div>

                <p className="text-[14px] lg:text-[15px] leading-[1.6] text-[#6B5F8A] dark:text-white/55">
                  {f.desc}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
