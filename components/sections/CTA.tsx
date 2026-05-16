'use client'

import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTA() {
  return (
    <section 
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      style={{
        background: "linear-gradient(135deg, #6B4EFF 0%, #8B7AFF 50%, #A594FF 100%)",
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-10 left-[10%] w-24 h-24 opacity-20">
        <div 
          className="w-full h-full rounded-full animate-float"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
          }}
        />
      </div>
      <div className="absolute bottom-10 right-[15%] w-16 h-16 opacity-15">
        <div 
          className="w-full h-full rounded-full animate-float"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            animationDelay: "1s",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <RevealOnScroll>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Готовы начать
            <br />
            исследование?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Зарегистрируйтесь, создайте и запустите свой первый опрос уже за 5 минут!
          </p>

          <Button
            variant="secondary"
            size="xl"
            href="/register?role=CLIENT"
            className="!bg-white !text-brand hover:!bg-white/90 !border-white"
          >
            Регистрация
          </Button>
        </RevealOnScroll>
      </div>
    </section>
  );
}
