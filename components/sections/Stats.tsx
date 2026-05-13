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
    <section className="bg-site-section">
      <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-site-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">

        {stats.map((stat, index) => (
          <RevealOnScroll key={stat.label} delay={index * 80}>
            <div className="h-full transition-colors duration-300 hover:bg-site-card">
              <div className="h-full px-6 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">

                <p className="mb-2 font-body tabular-nums text-4xl font-semibold tracking-tight text-site-heading sm:text-5xl">
                  {stat.num}
                </p>

                <p className="text-sm font-body text-site-muted">
                  {stat.label}
                </p>

              </div>
            </div>
          </RevealOnScroll>
        ))}

      </div>
    </section>
  );
}