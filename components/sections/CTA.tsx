import * as React from "react";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTA() {
  return (
    <section className="py-40 px-8 bg-surface-950 text-center relative overflow-hidden">
      <GlowOrb size={800} opacity={0.08} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display text-title text-white mb-6">Готовы начать?</h2>
          <p className="font-body text-white/35 text-lg mb-12">
            Выберите свою роль и присоединяйтесь к платформе
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="xl">Я хочу зарабатывать →</Button>
            <Button variant="secondary" size="xl">Я хочу заказать опрос →</Button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
