import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTA() {
  return (
    <section className="bg-gray-900 py-32 px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display text-display-xl text-white mb-6">
            Готовы начать?
          </h2>
          <p className="text-lg text-gray-400 mb-12 leading-relaxed">
            Присоединяйтесь к тысячам пользователей, которые уже используют ПотокМнений
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg">Я хочу зарабатывать</Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Заказать исследование
            </Button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
