import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";

const features = [
  {
    title: "Конструктор опросов",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
    image: "/img-3.png",
  },
  {
    title: "База респондентов",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
    image: "/img-2.png",
  },
  {
    title: "ИИ-аналитика",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
    image: "/img.png",
  },
];

export default function Features() {
  return (
    <section
      className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      id="features"
    >
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-site-heading">
              <span className="text-brand">ПотокМнений</span> — это маркетплейс
              <br className="hidden sm:block" />
              данных для вашего бизнеса
            </h2>
            <p className="mt-4 text-base sm:text-lg text-site-muted max-w-3xl mx-auto">
              Мы объединяем бизнес и аудиторию в единой платформе. Создавайте
              опросы, получайте ответы от реальных людей, анализируйте данные с
              помощью ИИ.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <RevealOnScroll key={feature.title} delay={index * 100}>
              <div className="bg-site-bg rounded-2xl overflow-hidden border border-site-border hover:border-brand/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                {/* Feature Image */}
                <div className="aspect-[4/3] relative bg-gradient-to-br from-brand/5 to-brand/10 p-4">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold text-site-heading mb-2 group-hover:text-brand transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-site-muted leading-relaxed">
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
