import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

const iconClass = "w-5 h-5";

const features = [
  {
    title: "Умная лента",
    description:
      "Система подбирает задания по возрасту, городу, доходу и интересам.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass}>
        <path d="M4 6h16" />
        <path d="M4 12h10" />
        <path d="M4 18h7" />
      </svg>
    ),
  },
  {
    title: "Мгновенные выплаты",
    description:
      "Выводите деньги на карту, электронный кошелек или телефон.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass}>
        <path d="M12 3v18" />
        <path d="M7 8l5-5 5 5" />
      </svg>
    ),
  },
  {
    title: "Реферальная программа",
    description:
      "Приглашайте друзей и получайте бонусы с их опросов.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass}>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M3 20c1-4 6-6 9-4" />
        <path d="M12 16c3-2 7 0 8 4" />
      </svg>
    ),
  },
  {
    title: "Всегда с вами",
    description:
      "Проходите опросы с компьютера и смартфона. Прогресс сохраняется.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={iconClass}>
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M10 7h4" />
        <path d="M10 11h4" />
      </svg>
    ),
  },
];

export default function ForRespondents() {
  return (
    <section className="bg-white py-32 px-6 border-b border-gray-100">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <div className="max-w-2xl mb-20">
            <SectionLabel>Для респондентов</SectionLabel>
            <h2 className="font-display text-display-xl text-gray-900 mb-5">
              Зарабатывайте,<br />делясь мнением
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Проходите опросы, которые подходят именно вам, и получайте деньги на карту.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
          {features.map((feature, index) => (
            <RevealOnScroll delay={(index * 60) as 0 | 100 | 200 | 300} key={feature.title}>
              <div className="bg-white p-10 hover:bg-gray-50 transition-colors group">
                <div className="text-brand">{feature.icon}</div>
                <h3 className="font-display text-xl text-gray-900 mt-5 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                  {feature.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll delay={300}>
          <div className="mt-16">
            <Button variant="dark" size="lg">Начать зарабатывать</Button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
