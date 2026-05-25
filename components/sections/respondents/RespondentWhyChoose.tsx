"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";

const features = [
  {
    num: "01",
    icon: "💳",
    title: "Честные выплаты",
    desc: "Цена указана заранее, никаких сюрпризов",
  },
  {
    num: "02",
    icon: "⚡",
    title: "Быстро и удобно",
    desc: "Опросы занимают 3–15 минут. Проходи в любое время",
  },
  {
    num: "03",
    icon: "🎯",
    title: "Только релевантные опросы",
    desc: "Получай предложения, которые подходят твоему возрасту, городу и интересам",
  },
  {
    num: "04",
    icon: "🛡️",
    title: "Безопасность данных",
    desc: "Твоя анонимность защищена. Мы не передаём личные данные третьим лицам",
  },
  {
    num: "05",
    icon: "🎁",
    title: "Бонусы за активность",
    desc: "Реферальная программа, ежедневные квесты и повышенные ставки для профи",
  },
  {
    num: "06",
    icon: "📊",
    title: "Прозрачная статистика",
    desc: "Следи за заработком, пройденными опросами и рейтингом в личном кабинете",
  },
];

export default function RespondentWhyChoose() {
  return (
    <section className="bg-[#F7F5FF] px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px]">

        {/* Большой контейнер */}
        <div className="rounded-[36px] border border-[#E0D9F7] bg-white px-6 sm:px-8 lg:px-12 py-12 lg:py-14">

          <RevealOnScroll>
            <h2 className="text-[32px] sm:text-[44px] lg:text-[56px] leading-[0.95] tracking-[-0.05em] font-semibold text-[#1C0C4C] mb-10 lg:mb-12">
              Почему респонденты
              <br />
              выбирают{" "}
              <span className="text-[#6438D9]">ПотокМнений</span>
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {features.map((f, i) => (
              <RevealOnScroll key={f.num} delay={i * 60}>
                <div className="rounded-[24px] border border-[#E4DEF7] bg-[#FCFBFF] p-5 lg:p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-bold tracking-[0.1em] text-[#6438D9]/50">
                      {f.num}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F3EEFF] text-[18px]">
                      {f.icon}
                    </div>
                  </div>
                  <div className="text-[17px] font-semibold text-[#1C0C4C] mb-2">
                    {f.title}
                  </div>
                  <p className="text-[14px] leading-[1.55] text-[#797691]">{f.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
