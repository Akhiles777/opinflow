"use client";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const features = [
  { icon: "💳", title: "Честные выплаты", desc: "Цена указана заранее, никаких сюрпризов" },
  { icon: "⚡", title: "Быстро и удобно", desc: "Опросы занимают 3–15 минут. Проходи в любое время" },
  { icon: "🎯", title: "Только релевантные опросы", desc: "Получай предложения, которые подходят твоему возрасту, городу и интересам" },
  { icon: "🛡️", title: "Безопасность данных", desc: "Твоя анонимность защищена. Мы не передаём личные данные третьим лицам" },
  { icon: "🎁", title: "Бонусы за активность", desc: "Реферальная программа, ежедневные квесты и повышенные ставки для профи" },
  { icon: "📊", title: "Прозрачная статистика", desc: "Следи за заработком, пройденными опросами и рейтингом в личном кабинете" },
];

export default function RespondentWhyChoose() {
  return (
    <section className="bg-white px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-6">
        <div className="rounded-[36px] bg-[#F3F0FF] px-6 sm:px-10 lg:px-14 py-12 lg:py-16">
          <RevealOnScroll>
            <h2 className="font-manrope text-[32px] sm:text-[44px] lg:text-[58px] leading-[0.95] tracking-[-0.04em] font-extrabold text-[#1C0C4C] mb-10 lg:mb-14">
              Почему респонденты выбирают{" "}
              <span className="text-[#6438D9]">ПотокМнений</span>
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {features.map((f, i) => (
              <RevealOnScroll key={f.title} delay={i * 60}>
                <div className="rounded-[24px] bg-white p-5 lg:p-6 h-full flex flex-col">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EFEBFF] text-[22px]">
                    {f.icon}
                  </div>
                  <div className="text-[17px] font-semibold text-[#1C0C4C] mb-2">{f.title}</div>
                  <p className="text-[14px] leading-[1.6] text-[#6B5F9E]">{f.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
