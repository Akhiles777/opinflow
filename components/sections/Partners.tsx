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
    <section className="bg-gray-50 border-y border-gray-100 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <RevealOnScroll>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-300 text-center mb-10">
            Нам доверяют
          </p>
        </RevealOnScroll>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-gray-50 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-gray-50 to-transparent" />
          <div className="flex gap-16 animate-marquee w-max">
            {[...partners, ...partners].map((partner, index) => (
              <span
                key={`${partner}-${index}`}
                className="font-display text-base text-gray-300 hover:text-gray-600 transition-colors duration-300 cursor-default uppercase tracking-widest whitespace-nowrap"
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
