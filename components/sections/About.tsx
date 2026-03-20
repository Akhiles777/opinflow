import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const principles = [
  {
    title: "Прозрачность",
    description:
      "Честные условия участия, понятная система выплат и отсутствие скрытых комиссий.",
  },
  {
    title: "Технологичность",
    description:
      "Искусственный интеллект ускоряет анализ данных и повышает качество исследований.",
  },
  {
    title: "Защита от накруток",
    description:
      "Антифрод-система и модерация защищают опросы от ботов и недостоверных ответов.",
  },
  {
    title: "Быстрая аналитика",
    description:
      "Результаты опросов автоматически превращаются в понятные отчёты, графики и выводы.",
  },
  {
    title: "Удобство",
    description:
      "Интерфейс создан так, чтобы пользоваться им могли и компании, и обычные пользователи без специальных знаний.",
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
    <section id="about" className="bg-site-bg px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-start">
        <div>
          <RevealOnScroll>
            <h2 className="font-display text-heading text-site-heading mb-6">
              ПотокМнений — когда данные становятся доступными
            </h2>
            <p className="text-sm font-body text-site-muted leading-relaxed mb-8">
              Мы создаём платформу, где каждая сторона получает реальную ценность. ПотокМнений — это онлайн-платформа, которая объединяет бизнес и людей, готовых делиться своим мнением.
            </p>
            <p className="text-sm font-body text-site-muted leading-relaxed mb-8">
              Только реальные люди, реальные ответы и честная система вознаграждений. Мы создаём честную экосистему маркетинговых исследований, где бизнес получает реальные инсайты, а люди — возможность зарабатывать на своём мнении.
            </p>
          </RevealOnScroll>

          <div className="divide-y divide-site-border">
            {principles.map((item) => (
              <RevealOnScroll key={item.title}>
                <div className="py-6">
                  <p className="text-xl font-semibold text-site-heading mb-2">{item.title}</p>
                  <p className="text-sm font-body text-site-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <Button variant="ghost" size='md' className="mt-6">
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
