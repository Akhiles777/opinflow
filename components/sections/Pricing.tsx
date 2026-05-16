"use client";

import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const plans = [
  {
    name: "Basic",
    price: "25% комиссии площадки",
    description: "Подходит для начала изучения",
    features: [
      "Базовая аналитика",
      "До 500 респондентов",
      "Стандартный конструктор",
      "Email-поддержка",
      "Доступ к базе респондентов",
    ],
    highlighted: false,
    ctaText: "Выбрать тариф",
  },
  {
    name: "Pro",
    price: "от 150 000 ₽",
    priceNote: "Подходит для начала изучения",
    description: "Подходит для растущего бизнеса",
    features: [
      "Всё из Basic +",
      "ИИ-аналитика",
      "Безлимит респондентов",
      "Запуск опросов под ключ",
      "Приоритетная поддержка",
    ],
    highlighted: true,
    ctaText: "Выбрать тариф",
  },
  {
    name: "Enterprise",
    price: "Индивидуально",
    description: "Для крупного бизнеса",
    features: [
      "Всё из Pro +",
      "White-label",
      "Выделенный менеджер",
      "SLA гарантии",
      "Интеграции API",
    ],
    highlighted: false,
    ctaText: "Выбрать тариф",
  },
];

export default function Pricing() {
  return (
    <section 
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      style={{
        background: "linear-gradient(135deg, #6B4EFF 0%, #8B7AFF 50%, #A594FF 100%)",
      }}
    >
      {/* Decorative spheres */}
      <div className="absolute top-10 right-[10%] w-32 h-32 opacity-30">
        <div 
          className="w-full h-full rounded-full animate-float"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
            boxShadow: "inset -8px -8px 20px rgba(0,0,0,0.1), inset 8px 8px 20px rgba(255,255,255,0.3)",
          }}
        />
      </div>
      <div className="absolute bottom-20 left-[5%] w-20 h-20 opacity-20">
        <div 
          className="w-full h-full rounded-full animate-float"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            animationDelay: "1s",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        <RevealOnScroll>
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Прозрачные тарифы
              <br />
              для любых задач
            </h2>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <RevealOnScroll key={plan.name} delay={index * 100}>
              <div 
                className={`rounded-2xl p-6 lg:p-8 h-full flex flex-col ${
                  plan.highlighted 
                    ? "bg-white shadow-xl" 
                    : "bg-white/10 backdrop-blur-sm border border-white/20"
                }`}
              >
                <div className="mb-6">
                  <h3 className={`font-display text-2xl font-bold mb-2 ${
                    plan.highlighted ? "text-site-heading" : "text-white"
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`text-lg font-semibold ${
                    plan.highlighted ? "text-brand" : "text-white/90"
                  }`}>
                    {plan.price}
                  </p>
                  <p className={`text-sm mt-1 ${
                    plan.highlighted ? "text-site-muted" : "text-white/70"
                  }`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg 
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          plan.highlighted ? "text-brand" : "text-white"
                        }`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm ${
                        plan.highlighted ? "text-site-body" : "text-white/90"
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.highlighted ? "primary" : "secondary"}
                  size="lg" 
                  href="/register?role=CLIENT"
                  className={`w-full justify-center ${
                    !plan.highlighted 
                      ? "!bg-white/20 !border-white/30 !text-white hover:!bg-white/30" 
                      : ""
                  }`}
                >
                  {plan.ctaText}
                </Button>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
