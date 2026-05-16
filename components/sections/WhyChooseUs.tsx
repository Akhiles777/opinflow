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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <RevealOnScroll key={benefit.title} delay={index * 80}>
              <div className="flex gap-4 p-6 bg-site-bg rounded-2xl border border-site-border hover:border-brand/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <Image
                    src={benefit.icon}
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-site-heading mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-site-muted">{benefit.description}</p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Dashboard Preview */}
        <RevealOnScroll delay={200}>
          <div className="mt-12 lg:mt-16 relative">
            <div className="rounded-2xl overflow-hidden border border-site-border bg-gradient-to-br from-site-bg to-white">
              <div className="relative aspect-[16/9] lg:aspect-[21/9]">
                <Image
                  src="/laptop 1.png"
                  alt="Дашборд ПотокМнений"
                  fill
                  className="object-contain p-4 lg:p-8"
                  sizes="100vw"
                />
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
