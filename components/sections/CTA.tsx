import * as React from "react";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTA() {
  return (
   
    <section className="relative overflow-hidden bg-site-bg px-4 pt-10 pb-14 text-center sm:px-6 sm:pt-12 sm:pb-16 lg:px-8 lg:pt-16 lg:pb-24">
      
      <GlowOrb size={800} opacity={0.08} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <RevealOnScroll>
          <h2 className="mb-5 font-display text-title text-site-heading">
            Запустите исследование или
            <br />
            начните проходить опросы уже сегодня
          </h2>
          <p className="mb-8 text-lg font-body text-site-muted sm:mb-10">
            Реальные люди, реальные ответы и честная система вознаграждений — всё в одном сервисе.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Button variant="primary" size="lg" className="sm:px-9 sm:py-4 sm:text-lg sm:font-semibold">Я хочу зарабатывать →</Button>
            <Button variant="secondary" size="lg" className="sm:px-9 sm:py-4 sm:text-lg sm:font-semibold">Я хочу заказать опрос →</Button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
