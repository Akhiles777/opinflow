"use client";

import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-4 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-20 lg:px-8 lg:pt-12 lg:pb-24"
      style={{
        background: "linear-gradient(135deg, #F8F6FF 0%, #EDE8FF 30%, #F0EAFF 60%, #F5F3FF 100%)",
      }}
    >
      {/* Decorative 3D Spheres */}
      <div className="absolute top-20 right-[10%] w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 opacity-80">
        <div 
          className="w-full h-full rounded-full animate-float"
          style={{
            background: "linear-gradient(145deg, #E8E0FF 0%, #D4C8FF 50%, #C0B0FF 100%)",
            boxShadow: "inset -8px -8px 20px rgba(107, 78, 255, 0.2), inset 8px 8px 20px rgba(255,255,255,0.8), 0 20px 40px rgba(107, 78, 255, 0.15)",
          }}
        />
      </div>
      <div className="absolute bottom-32 right-[5%] w-12 h-12 sm:w-16 sm:h-16 opacity-60">
        <div 
          className="w-full h-full rounded-full animate-float"
          style={{
            background: "linear-gradient(145deg, #F0EAFF 0%, #E0D4FF 100%)",
            boxShadow: "inset -4px -4px 10px rgba(107, 78, 255, 0.15), inset 4px 4px 10px rgba(255,255,255,0.9)",
            animationDelay: "1s",
          }}
        />
      </div>
      <div className="absolute top-40 left-[5%] w-8 h-8 sm:w-10 sm:h-10 opacity-50">
        <div 
          className="w-full h-full rounded-full animate-float"
          style={{
            background: "linear-gradient(145deg, #EBE4FF 0%, #D8CCFF 100%)",
            boxShadow: "inset -3px -3px 8px rgba(107, 78, 255, 0.1), inset 3px 3px 8px rgba(255,255,255,0.9)",
            animationDelay: "2s",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <RevealOnScroll>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-site-heading leading-tight">
                Маркетинговые
                <br />
                <span className="text-brand">исследования</span>
                <br />
                за <span 
                  className="relative inline-block px-3 py-1 rounded-lg"
                  style={{
                    background: "linear-gradient(90deg, #FFD700 0%, #FFE44D 100%)",
                  }}
                >
                  5 минут,
                </span>
                <br />
                а не 5 недель
              </h1>
            </RevealOnScroll>

            <RevealOnScroll delay={80}>
              <p className="mt-6 text-base sm:text-lg text-site-muted leading-relaxed max-w-lg">
                <span className="font-semibold text-site-heading">Платформа ПотокМнений</span> — это быстрый способ 
                запустить исследование: от идеи до отчёта за один день.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={120}>
              <ul className="mt-4 space-y-2 text-sm text-site-muted">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  Аудитория 25 000 респондентов
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  Встроенная ИИ-аналитика
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  Таргетинг по демографии и интересам
                </li>
              </ul>
            </RevealOnScroll>

            <RevealOnScroll delay={160}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="primary" size="lg" href="/register?role=CLIENT">
                  Зарегистрироваться
                </Button>
                <Button variant="secondary" size="lg" href="#demo">
                  Заказать демо
                </Button>
              </div>
            </RevealOnScroll>
          </div>

          {/* Right - Laptop Mockup */}
          <div className="order-1 lg:order-2">
            <RevealOnScroll direction="right">
              <div className="relative">
                <div 
                  className="rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: "linear-gradient(180deg, #F8F6FF 0%, #FFFFFF 100%)",
                    boxShadow: "0 25px 50px -12px rgba(107, 78, 255, 0.25), 0 0 0 1px rgba(107, 78, 255, 0.05)",
                  }}
                >
                  <div className="aspect-[16/10] relative bg-gradient-to-br from-white to-gray-50 p-4">
                    {/* Browser Chrome */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-md ml-4" />
                    </div>
                    {/* Dashboard Mockup */}
                    <div className="bg-white rounded-lg border border-gray-200 h-full p-4 overflow-hidden">
                      <div className="flex gap-4">
                        {/* Sidebar */}
                        <div className="w-12 bg-gray-50 rounded-lg p-2 space-y-3">
                          <div className="w-8 h-8 bg-brand/20 rounded-lg" />
                          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                        </div>
                        {/* Main Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1 h-20 bg-gradient-to-r from-brand/10 to-brand/5 rounded-lg p-3">
                              <div className="w-16 h-2 bg-brand/30 rounded mb-2" />
                              <div className="w-12 h-4 bg-brand/50 rounded" />
                            </div>
                            <div className="flex-1 h-20 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg p-3">
                              <div className="w-16 h-2 bg-accent/40 rounded mb-2" />
                              <div className="w-12 h-4 bg-accent/60 rounded" />
                            </div>
                            <div className="flex-1 h-20 bg-gradient-to-r from-green-100 to-green-50 rounded-lg p-3">
                              <div className="w-16 h-2 bg-green-300 rounded mb-2" />
                              <div className="w-12 h-4 bg-green-400 rounded" />
                            </div>
                          </div>
                          {/* Chart Area */}
                          <div className="h-32 bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between mb-4">
                              <div className="w-24 h-2 bg-gray-200 rounded" />
                              <div className="flex gap-2">
                                <div className="w-12 h-4 bg-brand/20 rounded" />
                                <div className="w-12 h-4 bg-gray-200 rounded" />
                              </div>
                            </div>
                            <div className="flex items-end gap-2 h-16">
                              {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 90].map((h, i) => (
                                <div 
                                  key={i} 
                                  className="flex-1 rounded-t"
                                  style={{
                                    height: `${h}%`,
                                    background: i % 2 === 0 ? '#6B4EFF' : '#E0D8FF',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* Stats Row */}
        <RevealOnScroll delay={200}>
          <div className="mt-12 lg:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: "chart", value: "800+", label: "проведённых исследований" },
              { icon: "target", value: "97%", label: "качество данных" },
              { icon: "integration", value: "15+", label: "интеграций с CRM" },
              { icon: "users", value: "25k+", label: "активных респондентов" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand shrink-0">
                  {stat.icon === "chart" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {stat.icon === "target" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  )}
                  {stat.icon === "integration" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  )}
                  {stat.icon === "users" && (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-bold text-xl text-site-heading">{stat.value}</p>
                  <p className="text-xs text-site-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
