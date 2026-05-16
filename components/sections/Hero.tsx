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
          quality={100}
          sizes="100vw"
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
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                  quality={100}
                  sizes="(max-width: 1024px) 100vw, 50vw"
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
                icon: "/icons/add-square.svg",
                value: "800+",
                label: "проведённых исследований",
              },
              { icon: "/icons/shield-tick.svg", value: "97%", label: "качество данных" },
              { icon: "/icons/profile-2user.svg", value: "15+", label: "интеграций с CRM" },
              { icon: "/icons/people.svg", value: "25k+", label: "активных респондентов" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/80 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Image
                    src={stat.icon}
                    alt=""
                    width={24}
                    height={24}
                    className="w-5 h-5"
                  />
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
