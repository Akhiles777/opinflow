import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

export default function ForBusiness() {
  return (
    <section id="business" className="bg-gray-50 border-y border-gray-100 py-32 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div>
          <RevealOnScroll>
            <SectionLabel>Для бизнеса</SectionLabel>
            <h2 className="font-display text-display-xl text-gray-900 mb-5">
              Исследования с ИИ-аналитикой
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Создавайте опросы любой сложности, нацеливайтесь на нужную аудиторию и получайте готовые отчеты с графиками и анализом открытых ответов.
            </p>
          </RevealOnScroll>

          <div className="mt-10">
            {[
              {
                title: "Гибкий конструктор",
                description:
                  "Вопросы, шкалы, матрицы, ранжирование, медиа до 50 МБ.",
              },
              {
                title: "Точный таргетинг",
                description:
                  "Пол, возраст, география, интересы и доход. Система покажет стоимость.",
              },
              {
                title: "ИИ-аналитика",
                description:
                  "Темы, тональность, облако слов и отчеты PDF/Excel в один клик.",
              },
              {
                title: "Экспертное заключение",
                description:
                  "Закажите углубленный анализ у профессионального маркетолога.",
              },
            ].map((feature) => (
              <RevealOnScroll key={feature.title}>
                <div className="flex gap-4 py-6 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-brand">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 12h16" />
                      <path d="M12 4v16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <RevealOnScroll delay={200}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-xs text-gray-400 ml-4 font-medium">
                Конструктор опросов
              </span>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-5 mb-4 border border-gray-100">
                <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-3">
                  Одиночный выбор
                </p>
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  Как часто вы пользуетесь нашим сервисом?
                </p>
                <div className="space-y-2">
                  {["Каждый день", "1-2 раза в неделю", "Редко"].map((option, index) => (
                    <div key={option} className="flex items-center gap-3">
                      <span
                        className={
                          index === 0
                            ? "w-4 h-4 rounded-full border-2 border-brand bg-brand"
                            : "w-4 h-4 rounded-full border-2 border-gray-200"
                        }
                      />
                      <span className="text-sm text-gray-600">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-brand-light rounded-xl border border-brand/10">
                <div>
                  <p className="text-xs font-semibold text-brand">Аудитория</p>
                  <p className="text-sm text-gray-700 mt-0.5">Женщины 25–45, Москва</p>
                </div>
                <span className="text-sm font-bold text-gray-900">≈ 2 490 ₽</span>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
