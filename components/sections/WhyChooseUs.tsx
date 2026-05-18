import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";

const benefits = [
  {
    icon: "/icons/add-square.svg",
    title: "Запуск опроса за 5 минут",
    description: "Быстрый конструктор с шаблонами",
  },
  {
    icon: "/icons/shield-tick.svg",
    title: "От 1 000 ₽ за исследование",
    description: "Прозрачное ценообразование",
  },
  {
    icon: "/icons/profile-2user.svg",
    title: "Таргетированная аудитория",
    description: "Фильтры по демографии и интересам",
  },
  {
    icon: "/icons/people.svg",
    title: "ИИ-аналитика в реальном времени",
    description: "Автоматические выводы и графики",
  },
  {
    icon: "/icons/shield-tick-1.svg",
    title: "97% верифицированных данных",
    description: "Антифрод-система и модерация",
  },
  {
    icon: "/icons/profile-2user.svg",
    title: "Только проверенные респонденты",
    description: "Контроль качества ответов",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-site-heading text-center mb-12 lg:mb-16">
            Почему выбирают нас
          </h2>
        </RevealOnScroll>

        <div>
          <RevealOnScroll>
            <div className="w-265.75 inline-flex justify-start items-center gap-5 flex-nowrap">
  <div className="w-80 h-44 p-7 bg-white rounded-[30px] outline-2 -outline-offset-2 outline-violet-200 inline-flex flex-col justify-between items-start overflow-hidden">
    <div className="size-12 relative rounded-2xl overflow-hidden flex items-center">
      <div className="w-12 h-12 flex items-center justify-center">
        <Image src="/WhyChoose-icon/icons 2.svg" alt="icon" width={48} height={48} className="object-contain" />
      </div>
    </div>
    <div className="self-stretch justify-center text-indigo-950 text-xl font-semibold font-['Manrope'] leading-6">Запуск опроса за 5 минут</div>
  </div>
  <div className="w-80 h-44 p-7 bg-white rounded-[30px] outline-2 -outline-offset-2 outline-violet-200 inline-flex flex-col justify-between items-start overflow-hidden">
    <div className="size-12 relative rounded-2xl overflow-hidden flex items-center">
      <div className="w-12 h-12 flex items-center justify-center">
        <Image src="/WhyChoose-icon/icons 3.svg" alt="icon" width={48} height={48} className="object-contain" />
      </div>
    </div>
    <div className="self-stretch justify-center text-indigo-950 text-xl font-semibold font-['Manrope'] leading-6">От 1 000 ₽ за исследование</div>
  </div>
  <div className="w-80 h-44 p-7 bg-white rounded-[30px] outline-2 -outline-offset-2 outline-violet-200 inline-flex flex-col justify-between items-start overflow-hidden">
    <div className="size-12 relative rounded-2xl overflow-hidden flex items-center">
      <div className="w-12 h-12 flex items-center justify-center">
        <Image src="/WhyChoose-icon/icons 4.svg" alt="icon" width={48} height={48} className="object-contain" />
      </div>
    </div>
    <div className="self-stretch justify-center text-indigo-950 text-xl font-semibold font-['Manrope'] leading-6">Таргетированная аудитория</div>
  </div>
  <div className="w-80 h-44 p-7 bg-white rounded-[30px] outline-2 -outline-offset-2 outline-violet-200 inline-flex flex-col justify-between items-start overflow-hidden">
    <div className="size-12 relative rounded-2xl overflow-hidden flex items-center">
      <div className="w-12 h-12 flex items-center justify-center">
        <Image src="/WhyChoose-icon/icons 5.svg" alt="icon" width={48} height={48} className="object-contain" />
      </div>
    </div>
    <div className="self-stretch justify-center text-indigo-950 text-xl font-semibold font-['Manrope'] leading-6">ИИ-аналитика в реальном времени</div>
  </div>
  <div className="w-80 h-44 p-7 bg-white rounded-[30px] outline-2 -outline-offset-2 outline-violet-200 inline-flex flex-col justify-between items-start overflow-hidden">
    <div className="size-12 relative rounded-2xl overflow-hidden flex items-center">
      <div className="w-12 h-12 flex items-center justify-center">
        <Image src="/WhyChoose-icon/icons 6.svg" alt="icon" width={48} height={48} className="object-contain" />
      </div>
    </div>
    <div className="self-stretch justify-center text-indigo-950 text-xl font-semibold font-['Manrope'] leading-6">97% верифицированных данных</div>
  </div>
  <div className="w-80 h-44 p-7 bg-white rounded-[30px] outline-2 -outline-offset-2 outline-violet-200 inline-flex flex-col justify-between items-start overflow-hidden">
    <div className="size-12 relative rounded-2xl overflow-hidden flex items-center">
      <div className="w-12 h-12 flex items-center justify-center">
        <Image src="/WhyChoose-icon/icons 7.svg" alt="icon" width={48} height={48} className="object-contain" />
      </div>
    </div>
    <div className="self-stretch justify-center text-indigo-950 text-xl font-semibold font-['Manrope'] leading-6">Только проверенные респонденты</div>
  </div>
  
  {/* Wholts column (right-most) */}
  <div className="w-49.25 h-94 p-7 bg-white rounded-[30px] outline-2 -outline-offset-2 outline-violet-200 inline-flex flex-col justify-center items-center overflow-hidden">
    <div className="relative w-full h-full flex items-center justify-center">
      <Image src="/Wholts.svg" alt="Wholts" width={197} height={376} className="object-contain" />
    </div>
  </div>
</div>
          </RevealOnScroll>
        </div>

        {/* Dashboard Preview */}
        <RevealOnScroll delay={200}>
          <div className="mt-12 lg:mt-16 relative">
            <div className="rounded-2xl overflow-hidden border border-site-border bg-linear-to-br from-site-bg to-white shadow-xl">
              <div className="relative aspect-video lg:aspect-21/9">
                <Image
                  src="/laptop 1.png"
                  alt="Дашборд ПотокМнений"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  quality={100}
                />
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
