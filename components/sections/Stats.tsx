import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const stats = [
  { num: "25 000+", label: "активных респондентов" },
  { num: "800+", label: "проведённых исследований" },
  { num: "5 мин", label: "среднее время запуска" },
  { num: "97%", label: "качество данных" },
];

export default function Stats() {
  return (
    <section className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-gray-200">
        {stats.map((stat, index) => (
          <RevealOnScroll key={stat.num} delay={(index * 80) as 0 | 100 | 200 | 300}>
            <div className="py-14 px-10 hover:bg-white transition-colors duration-300">
              <p className="font-display text-4xl text-gray-900 mb-2">{stat.num}</p>
              <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
