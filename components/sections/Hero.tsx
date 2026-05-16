"use client";

import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-4 pt-8 pb-16 sm:px-6 sm:pt-10 sm:pb-20 lg:px-8 lg:pt-12 lg:pb-24"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg img.png"
          alt=""
          fill
          className="object-cover object-right"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1">
            <RevealOnScroll>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-site-heading leading-tight">
                Маркетинговые
                <br />
                <span className="text-brand">исследования</span>
                <br />
                за{" "}
                <span
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
                <span className="font-semibold text-site-heading">
                  Платформа ПотокМнений
                </span>{" "}
                — это быстрый способ запустить исследование: от идеи до отчёта за
                один день.
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
                <Image
                  src="/laptop 1.png"
                  alt="Дашборд ПотокМнений"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* Stats Row */}
        <RevealOnScroll delay={200}>
          <div className="mt-12 lg:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: "chart",
                value: "800+",
                label: "проведённых исследований",
              },
              { icon: "target", value: "97%", label: "качество данных" },
              { icon: "integration", value: "15+", label: "интеграций с CRM" },
              { icon: "users", value: "25k+", label: "активных респондентов" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand shrink-0">
                  {stat.icon === "chart" && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  )}
                  {stat.icon === "target" && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  )}
                  {stat.icon === "integration" && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  )}
                  {stat.icon === "users" && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-bold text-xl text-site-heading">
                    {stat.value}
                  </p>
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
