import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";

const features = [
  {
    title: "Конструктор опросов",
    description:
      "Создайте опрос за 5 минут. Удобный конструктор, гибкая логика и интуитивный интерфейс — запускайте исследования здесь и сейчас.",
    image: "/img.svg",
  },
  {
    title: "База респондентов",
    description:
      "25 000+ проверенных респондентов из разных регионов и сфер. Таргетируйте аудиторию по полу, возрасту, интересам — получайте ответы от нужных людей.",
    image: "/img-2.svg",
  },
  {
    title: "ИИ-аналитика",
    description:
      "Превращаем тысячи ответов в понятные инсайты за секунды. ИИ находит паттерны, выделяет тренды и подсказывает решения — без сложных отчётов и таблиц.",
    image: "/img-3.svg",
  },
];

export default function Features() {
  return (
    <section
      className="bg-white dark:bg-[#1C0C4C] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      id="about"
    >
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-site-heading dark:text-white">
              <span className="text-brand dark:text-[#A98BFF]">ПотокМнений</span> — это маркетплейс
              <br className="hidden sm:block" />
              <span> данных</span> для вашего бизнеса
            </h2>
            <p className="mt-4 text-base sm:text-lg text-site-muted dark:text-white/85 max-w-3xl mx-auto">
              Мы объединяем бизнес и аудиторию в единой платформе. Создавайте
              опросы, получайте ответы от реальных людей, анализируйте данные с
              помощью ИИ.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <RevealOnScroll key={feature.title} delay={index * 100}>
              <div className="bg-site-bg dark:bg-white/6 dark:backdrop-blur-xl rounded-2xl overflow-hidden border border-site-border dark:border-white/10 hover:border-brand/30 dark:hover:border-[#A98BFF]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
                <div className="aspect-[4/3] relative bg-gradient-to-br from-brand/5 to-brand/10 dark:from-white/8 dark:to-white/5 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    quality={100}
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold text-site-heading dark:text-white mb-2 group-hover:text-brand dark:group-hover:text-[#A98BFF] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-site-muted dark:text-white/82 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
