import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  { num: "25 000+", label: "активных респондентов" },
  { num: "800+", label: "исследований" },
  { num: "5 минут", label: "запуск" },
  { num: "97%", label: "качество" },
];

export default function About() {
  return (
    <section id="about" className="bg-surface-900 py-24 border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {stats.map((stat) => (
            <RevealOnScroll key={stat.num}>
              <div className="px-8 py-12 group hover:bg-surface-800 transition-colors">
                <p className="font-display text-5xl font-extrabold text-white tracking-tight mb-3">
                  <span className="bg-gradient-to-br from-brand-400 to-brand-600 bg-clip-text text-transparent">
                    {stat.num}
                  </span>
                </p>
                <p className="text-sm text-white/35 font-medium">{stat.label}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
