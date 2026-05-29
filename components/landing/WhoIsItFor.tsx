import RevealOnScroll from "@/components/ui/RevealOnScroll";

const cards = [
  { num: "01", title: "Маркетологи", desc: "Тестируйте гипотезы и получайте данные от реальной аудитории за часы, а не недели. Запускайте опросы за 5 минут." },
  { num: "02", title: "МСБ и стартапы", desc: "Изучайте рынок без дорогих агентств. Запустите первое исследование за 5 минут и получите данные от реальной аудитории." },
  { num: "03", title: "Product-менеджеры", desc: "Валидируйте фичи и собирайте обратную связь от целевой аудитории до разработки." },
  { num: "04", title: "Крупный бизнес", desc: "Регулярные исследования удовлетворённости, NPS, тестирование концепций. Масштабируйте данные без масштабирования затрат." },
];

export default function WhoIsItFor() {
  return (
    <section className="bg-[#F5F5F5] py-20 lg:py-28 px-4 lg:px-6">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-10">
        <RevealOnScroll>
          <h2 className="font-manrope text-[36px] sm:text-[50px] lg:text-[62px] font-[800] tracking-[-2px] text-[#1C0C4C] leading-[0.95] mb-12 lg:mb-14">
            Кому подойдёт ПотокМнений
          </h2>
        </RevealOnScroll>

        <div className="rounded-[32px] bg-[#EFEBFF] p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {cards.map((c, i) => (
              <RevealOnScroll key={c.num} delay={i * 70}>
                <div className="rounded-[20px] bg-white p-6 lg:p-7 h-full flex flex-col">
                  <div className="text-[12px] font-bold tracking-[0.1em] text-[#6438D9]/40 mb-3">{c.num}</div>
                  <div className="text-[19px] font-semibold text-[#1C0C4C] mb-2">{c.title}</div>
                  <p className="text-[14px] lg:text-[15px] leading-[1.6] text-[#6B5F9E]">{c.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
