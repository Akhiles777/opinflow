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
            <div className="py-16 px-10 hover:bg-site-card transition-colors duration-300">
              <p className="font-body tabular-nums text-5xl font-semibold text-site-heading tracking-tight mb-2">
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
