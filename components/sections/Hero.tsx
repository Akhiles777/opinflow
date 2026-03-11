import * as React from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function Hero() {
  return (
    <section id="top" className="bg-white pt-28 pb-20 px-6 border-b border-gray-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-20 items-center">
        <div>
          <RevealOnScroll>
            <Badge>Платформа маркетинговых исследований</Badge>
          </RevealOnScroll>
          <RevealOnScroll delay={100}>
            <h1 className="font-display text-display-2xl text-gray-900 mt-6 mb-6">
              Исследуйте рынок.<br />
              Зарабатывайте<br />
              <span className="text-brand">на мнениях.</span>
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <p className="text-lg text-gray-500 leading-relaxed max-w-md mb-10">
              ПотокМнений объединяет респондентов, готовых делиться мнением, и компании, которым нужны честные данные.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="dark" size="lg">
                Начать зарабатывать
              </Button>
              <Button variant="outline" size="lg">
                Заказать исследование
              </Button>
            </div>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={200}>
          <div className="animate-float">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Опрос · Потребительский
                </span>
                <span className="text-xs font-bold text-brand bg-brand-light px-2.5 py-1 rounded-full">
                  +120 ₽
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-5 leading-snug">
                Оцените качество сервиса<br />доставки продуктов
              </p>
              <div className="w-full bg-gray-100 h-1 rounded-full">
                <div className="bg-brand w-2/3 h-full rounded-full" />
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-xs text-gray-400">~5 минут</span>
                <span className="text-xs text-gray-400">8 вопросов</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Начислено 350 ₽</p>
                <p className="text-xs text-gray-400 mt-0.5">2 минуты назад</p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
