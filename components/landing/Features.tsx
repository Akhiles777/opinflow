import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const cards = [
  { icon: "/WhyChoose-icon/icons 2.svg", title: "Конструктор опросов", desc: "6 типов вопросов, drag-and-drop порядок, логика ветвления, таргетинг по 5 параметрам" },
  { icon: "/WhyChoose-icon/icons 3.svg", title: "База респондентов", desc: "25 000+ верифицированных участников. Антифрод система с 5 проверками каждого ответа" },
  { icon: "/WhyChoose-icon/icons 4.svg", title: "ИИ-аналитика", desc: "Анализ тональности, кросс-таблицы, облако слов, сводный отчёт. Экспорт в PDF." },
];

export default function Features() {
  return (
    <section className="bg-white py-20 lg:py-28 px-4 lg:px-6">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-10">
        <RevealOnScroll>
          <h2 className="font-manrope text-[36px] sm:text-[50px] lg:text-[62px] font-[800] tracking-[-2px] text-[#1C0C4C] leading-[0.95] mb-3">
            ПотокМнений — маркетплейс<br className="hidden lg:block" /> данных для вашего бизнеса
          </h2>
          <p className="text-[16px] lg:text-[18px] text-[#6B5F9E] max-w-[560px] leading-[1.6] mb-12 lg:mb-16">
            Всё необходимое для качественных маркетинговых исследований в одном месте
          </p>
        </RevealOnScroll>

        <div className="rounded-[32px] bg-[#F3F0FF] px-6 sm:px-10 lg:px-12 py-10 lg:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
            {cards.map((c, i) => (
              <RevealOnScroll key={c.title} delay={i * 80}>
                <div className="rounded-[20px] bg-white p-6 lg:p-7 h-full flex flex-col">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EFEBFF]">
                    <Image src={c.icon} alt="" width={28} height={28} />
                  </div>
                  <div className="text-[18px] font-semibold text-[#1C0C4C] mb-2">{c.title}</div>
                  <p className="text-[14px] leading-[1.6] text-[#6B5F9E]">{c.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
