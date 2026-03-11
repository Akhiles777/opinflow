import * as React from "react";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-surface-950 pt-24 pb-28 px-8 text-center">
      <GlowOrb size={700} opacity={0.1} className="top-0 left-1/2 -translate-x-1/2 -translate-y-1/4" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative max-w-4xl mx-auto">
        <RevealOnScroll>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand/25 bg-brand/8 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-pulse" />
            <span className="text-xs font-semibold font-body text-brand-light tracking-wide">
              Платформа маркетинговых исследований
            </span>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <h1 className="font-display text-hero text-white mb-6">
            Платформа маркетинговых<br />
            <span className="bg-gradient-to-r from-brand-light via-white to-brand-light bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
              исследований
            </span>
          </h1>
        </RevealOnScroll>

        <RevealOnScroll delay={160}>
          <p className="text-xl font-body text-white/40 leading-relaxed max-w-2xl mx-auto mb-4">
            Зарабатывайте на опросах или проводите исследования с ИИ-аналитикой за 1 день
          </p>
          <p className="text-base font-body text-white/25 leading-relaxed max-w-xl mx-auto mb-10">
            ПотокМнений объединяет респондентов, готовых делиться мнением, и компании, которым нужны честные данные. Умные алгоритмы, быстрые выплаты и автоматические отчёты на базе ИИ — всё в одном сервисе.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={240}>
          <div className="flex gap-4 justify-center mb-20">
            <Button variant="primary" size="lg">Начать зарабатывать</Button>
            <Button variant="secondary" size="lg">Заказать исследование</Button>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={320}>
          <div className="flex flex-col sm:flex-row justify-center gap-10 pt-10 border-t border-white/5">
            {[
              { value: "25 000+", label: "активных респондентов" },
              { value: "800+", label: "проведённых исследований" },
              { value: "97%", label: "качество данных" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-xs font-body text-white/25 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
