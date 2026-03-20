import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  { num: "25 000+", label: "активных респондентов" },
  { num: "800+", label: "проведённых исследований" },
  { num: "5 минут", label: "среднее время запуска опроса" },
  { num: "97%", label: "респондентов проходят контроль качества" },
];

export default function Stats() {
  return (
    <section className="border-y border-site-border bg-site-section">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-site-border">
        {stats.map((stat, index) => (
          <RevealOnScroll key={stat.label} delay={index * 80}>
            <div className="px-6 py-10 transition-colors duration-300 hover:bg-site-card sm:px-8 sm:py-14 lg:px-10 lg:py-16">
              <p className="mb-2 font-body tabular-nums text-4xl font-semibold tracking-tight text-site-heading sm:text-5xl">
                {stat.num}
              </p>
              <p className="text-sm font-body text-site-muted">
                {stat.label}
              </p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
