import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const benefits = [
  {
    icon: "rocket",
    title: "Запуск опроса за 5 минут",
    description: "Быстрый конструктор с шаблонами",
  },
  {
    icon: "money",
    title: "От 1 000 ₽ за исследование",
    description: "Прозрачное ценообразование",
  },
  {
    icon: "users",
    title: "Таргетированная аудитория",
    description: "Фильтры по демографии и интересам",
  },
  {
    icon: "ai",
    title: "ИИ-аналитика в реальном времени",
    description: "Автоматические выводы и графики",
  },
  {
    icon: "check",
    title: "97% верифицированных данных",
    description: "Антифрод-система и модерация",
  },
  {
    icon: "verified",
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
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
                  {benefit.icon === "rocket" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    </svg>
                  )}
                  {benefit.icon === "money" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {benefit.icon === "users" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  )}
                  {benefit.icon === "ai" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  )}
                  {benefit.icon === "check" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  )}
                  {benefit.icon === "verified" && (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-site-heading mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-site-muted">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Dashboard Preview */}
        <RevealOnScroll delay={200}>
          <div className="mt-12 lg:mt-16 relative">
            <div 
              className="rounded-2xl overflow-hidden border border-site-border"
              style={{
                background: "linear-gradient(135deg, #F8F6FF 0%, #FFFFFF 100%)",
              }}
            >
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-site-heading">
                      ПотокМнений
                    </h3>
                    <p className="text-sm text-site-muted">Панель аналитики</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-brand/10 text-brand text-sm rounded-lg font-medium">
                      Live
                    </div>
                  </div>
                </div>
                
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Всего ответов", value: "1,247" },
                    { label: "Сегодня", value: "+89" },
                    { label: "Конверсия", value: "94%" },
                    { label: "Ср. время", value: "4:32" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 border border-site-border">
                      <p className="text-xs text-site-muted mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-site-heading">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="bg-white rounded-xl p-4 border border-site-border">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-site-heading">Ответы по дням</p>
                    <div className="flex gap-2">
                      <span className="text-xs text-site-muted">Последние 7 дней</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {[45, 62, 55, 78, 65, 82, 70, 88, 75, 92, 68, 95, 80, 98].map((h, i) => (
                      <div 
                        key={i}
                        className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${h}%`,
                          background: i % 2 === 0 
                            ? 'linear-gradient(180deg, #6B4EFF 0%, #8B7AFF 100%)' 
                            : 'linear-gradient(180deg, #E0D8FF 0%, #EDE8FF 100%)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
