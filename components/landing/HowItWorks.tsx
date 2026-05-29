import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const steps = [
  {
    num: "01",
    icon: "📋",
    title: "Создайте опрос",
    desc: "Конструктор с 6 типами вопросов: текст, выбор, шкала, рейтинг, медиа. Логика ветвления и таргетинг аудитории.",
  },
  {
    num: "02",
    icon: "🎯",
    title: "Выберите аудиторию",
    desc: "Фильтры по полу, возрасту, городу, доходу и интересам. Только подходящие респонденты.",
  },
  {
    num: "03",
    icon: "📊",
    title: "Получите аналитику",
    desc: "ИИ анализирует открытые ответы, строит кросс-таблицы и облако слов. PDF отчёт одной кнопкой.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#F5F5F5] py-20 lg:py-28 px-4 lg:px-6">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-10">
        <RevealOnScroll>
          <div className="text-center mb-14 lg:mb-18">
            <h2 className="font-manrope text-[36px] sm:text-[50px] lg:text-[62px] font-[800] tracking-[-2px] text-[#1C0C4C] leading-[0.95]">
              Как запустить исследование
            </h2>
            <p className="mt-4 text-[16px] lg:text-[18px] text-[#6B5F9E] max-w-[520px] mx-auto leading-[1.6]">
              Три шага от идеи до готового отчёта
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* connector line desktop */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-px border-t-2 border-dashed border-[#6438D9]/20 pointer-events-none z-0" />

          {steps.map((step, i) => (
            <RevealOnScroll key={step.num} delay={i * 100}>
              <div className="relative z-10 rounded-[28px] bg-white border border-[#E8E2F5] p-7 lg:p-8 flex flex-col items-center text-center">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#6438D9]/10 text-[32px] mb-5">
                  {step.icon}
                </div>
                <div className="text-[13px] font-bold tracking-[0.1em] text-[#6438D9]/50 mb-2">{step.num}</div>
                <div className="text-[19px] font-semibold text-[#1C0C4C] mb-3 leading-[1.2]">{step.title}</div>
                <p className="text-[14px] lg:text-[15px] leading-[1.55] text-[#6B5F9E]">{step.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Laptop illustration */}
        <RevealOnScroll delay={200}>
          <div className="mt-14 flex justify-center">
            <div className="relative max-w-[800px] w-full">
              <div className="absolute inset-0 rounded-full bg-[#6438D9]/5 blur-[60px] pointer-events-none" />
              <Image src="/laptop-1.svg" alt="Платформа" width={800} height={540}
                style={{ width: "100%", height: "auto" }} className="object-contain relative z-10" />
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
