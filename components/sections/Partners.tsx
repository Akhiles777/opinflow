import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const partners = [
  "Яндекс",
  "Ozon",
  "Сбер",
  "МТС",
  "Билайн",
  "Райффайзенбанк",
  "HeadHunter",
  "Лента",
];

export default function Partners() {
  return (
    <section className="py-20 px-8 bg-surface-900 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <p className="text-xs font-semibold font-body uppercase tracking-[0.3em] text-white/15 text-center mb-14">
            Нам доверяют ведущие компании
          </p>
        </RevealOnScroll>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-surface-900 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-surface-900 to-transparent" />
          <div className="flex gap-16 animate-marquee w-max">
            {[...partners, ...partners].map((partner, index) => (
              <span
                key={`${partner}-${index}`}
                className="font-display text-sm font-bold uppercase tracking-[0.25em] text-white/15 hover:text-white/50 transition-colors cursor-default whitespace-nowrap"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
