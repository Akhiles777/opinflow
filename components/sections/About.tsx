import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const principles = [
  {
    title: "Честность",
    description:
      "Многоуровневая антифрод-система защищает от ботов и накруток. Вы платите только за реальных людей и получаете чистые данные.",
  },
  {
    title: "Скорость",
    description:
      "Запуск опроса занимает 5 минут, а ИИ-аналитика готовит отчёты мгновенно после сбора ответов.",
  },
  {
    title: "Доступность",
    description:
      "Исследования становятся бюджетными для малого бизнеса, а респонденты получают достойное вознаграждение.",
  },
];

const stats = [
  { num: "25 000+", label: "активных респондентов" },
  { num: "800+", label: "проведённых исследований" },
  { num: "5 минут", label: "время запуска опроса" },
  { num: "97%", label: "контроль качества" },
];

export default function About() {
  return (
    <section id="about" className="py-32 px-8 bg-site-bg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
        <div>
          <RevealOnScroll>
            <h2 className="font-display text-heading text-site-heading mb-6">
              О платформе ПотокМнений
            </h2>
            <p className="text-sm font-body text-site-muted leading-relaxed mb-8">
              ПотокМнений — это автоматизированная экосистема, которая соединяет заказчиков маркетинговых исследований и респондентов. Мы создаём прозрачный рынок данных, где каждая сторона получает выгоду.
            </p>
          </RevealOnScroll>

          <div className="divide-y divide-site-border">
            {principles.map((item) => (
              <RevealOnScroll key={item.title}>
                <div className="py-6">
                  <p className="text-sm font-semibold text-site-heading mb-2">{item.title}</p>
                  <p className="text-sm font-body text-site-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <Button variant="ghost" size="md" className="mt-6">
              Узнать больше о нас →
            </Button>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {stats.map((stat) => (
            <RevealOnScroll key={stat.label}>
              <div className="bg-site-card border border-site-border rounded-2xl p-8">
                <p className="font-body tabular-nums text-4xl text-brand font-semibold tracking-tight mb-2">
                  {stat.num}
                </p>
                <p className="text-sm font-body text-site-muted">{stat.label}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
