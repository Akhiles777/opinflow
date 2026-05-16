import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const audiences = [
  {
    id: "01",
    title: "МСБ и стартапы",
    subtitle: "— быстрые тесты гипотез",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
    highlighted: true,
  },
  {
    id: "02",
    title: "Маркетологи",
    subtitle: "— оценка кампаний и рекламы",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
  },
  {
    id: "03",
    title: "Product-менеджеры",
    subtitle: "— исследование продукта",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
  },
  {
    id: "04",
    title: "Менеджеры маркетплейсов",
    subtitle: "— исследование карточек и стратегии",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
  },
  {
    id: "05",
    title: "Крупный бизнес",
    subtitle: "— white-label решения",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
  },
];

export default function WhoItsFor() {
  return (
    <section className="bg-site-bg px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" id="business">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left side - Title */}
          <RevealOnScroll>
            <div className="lg:sticky lg:top-24">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-site-heading leading-tight">
                Кому подойдёт
                <br />
                <span className="text-brand">ПотокМнений</span>
              </h2>
            </div>
          </RevealOnScroll>

          {/* Right side - Highlighted card */}
          <RevealOnScroll delay={100}>
            <div className="bg-white rounded-2xl border border-brand/20 p-6 lg:p-8 shadow-sm">
              <span className="text-sm font-semibold text-brand">01</span>
              <h3 className="mt-3 font-display text-xl sm:text-2xl font-semibold text-site-heading">
                МСБ и стартапы <span className="text-brand">— быстрые тесты гипотез</span>
              </h3>
              <p className="mt-4 text-site-muted leading-relaxed">
                Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, 
                получайте ответы от реальных людей, анализируйте данные с помощью ИИ.
              </p>
            </div>
          </RevealOnScroll>
        </div>

        {/* Grid of other audiences */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {audiences.slice(1).map((audience, index) => (
            <RevealOnScroll key={audience.id} delay={(index + 2) * 80}>
              <div className="bg-white rounded-2xl border border-site-border p-6 hover:border-brand/20 hover:shadow-sm transition-all duration-300">
                <span className="text-sm font-semibold text-site-muted">{audience.id}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-site-heading">
                  {audience.title} <span className="text-brand">{audience.subtitle}</span>
                </h3>
                <p className="mt-3 text-sm text-site-muted leading-relaxed">
                  {audience.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
