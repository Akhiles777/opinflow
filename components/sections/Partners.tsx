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
    <section className="bg-site-section border-y border-site-border px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <p className="text-xs font-semibold font-body uppercase tracking-[0.3em] text-site-muted text-center mb-14">
            Нам доверяют ведущие компании
          </p>
        </RevealOnScroll>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-16 sm:w-24 lg:w-32 bg-gradient-to-r from-site-section to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 sm:w-24 lg:w-32 bg-gradient-to-l from-site-section to-transparent" />
          <div className="flex gap-16 animate-marquee w-max">
            {[...partners, ...partners].map((partner, index) => (
              <span
                key={`${partner}-${index}`}
                className="font-display text-sm font-bold uppercase tracking-[0.25em] text-site-muted hover:text-site-heading transition-colors cursor-default whitespace-nowrap"
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
