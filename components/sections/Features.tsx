import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const features = [
  {
    title: "Конструктор опросов",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
    image: "/features/constructor.png",
  },
  {
    title: "База респондентов",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
    image: "/features/respondents.png",
  },
  {
    title: "ИИ-аналитика",
    description:
      "Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, получайте ответы от реальных людей, анализируйте данные с помощью ИИ.",
    image: "/features/analytics.png",
  },
];

export default function Features() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" id="features">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-site-heading">
              <span className="text-brand">ПотокМнений</span> — это маркетплейс
              <br className="hidden sm:block" />
              данных для вашего бизнеса
            </h2>
            <p className="mt-4 text-base sm:text-lg text-site-muted max-w-3xl mx-auto">
              Мы объединяем бизнес и аудиторию в единой платформе. Создавайте опросы, 
              получайте ответы от реальных людей, анализируйте данные с помощью ИИ.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <RevealOnScroll key={feature.title} delay={index * 100}>
              <div className="bg-site-bg rounded-2xl overflow-hidden border border-site-border hover:border-brand/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                {/* Image placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-brand/5 to-brand/10 p-4 flex items-center justify-center">
                  <div className="w-full h-full rounded-lg bg-white/50 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 p-3">
                      {feature.title === "Конструктор опросов" && (
                        <div className="space-y-2">
                          <div className="h-3 bg-brand/20 rounded w-3/4" />
                          <div className="h-8 bg-gray-100 rounded" />
                          <div className="h-3 bg-brand/20 rounded w-1/2" />
                          <div className="h-8 bg-gray-100 rounded" />
                          <div className="h-6 bg-brand rounded w-1/3 mt-4" />
                        </div>
                      )}
                      {feature.title === "База респондентов" && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-brand/20 rounded-full" />
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded w-1/2 mb-1" />
                              <div className="h-2 bg-gray-100 rounded w-3/4" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full" />
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded w-1/2 mb-1" />
                              <div className="h-2 bg-gray-100 rounded w-3/4" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full" />
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded w-1/2 mb-1" />
                              <div className="h-2 bg-gray-100 rounded w-3/4" />
                            </div>
                          </div>
                        </div>
                      )}
                      {feature.title === "ИИ-аналитика" && (
                        <div className="space-y-2">
                          <div className="flex items-end gap-1 h-16">
                            {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
                              <div 
                                key={i}
                                className="flex-1 rounded-t bg-brand/30"
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                          <div className="h-2 bg-gray-200 rounded w-full" />
                          <div className="h-2 bg-gray-100 rounded w-3/4" />
                        </div>
                      )}
                    </div>
                  </div>
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
