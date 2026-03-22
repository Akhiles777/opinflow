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
  { num: "800+",    label: "исследований" },
  { num: "5 мин",   label: "запуск опроса" },
  { num: "97%",     label: "качество ответов" },
];

export default function About() {
  return (
    <section id="about" className="bg-site-bg px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 lg:gap-16 items-center">

        {/* Левая колонка */}
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
            <Button variant="ghost" size="md" className="mt-2">
              Узнать больше о нас →
            </Button>
          </RevealOnScroll>
        </div>

        {/* Правая колонка — изображение по центру, без sticky */}
        <RevealOnScroll direction="right">
          <div className="mt-12 lg:mt-0">
            <div className="relative rounded-3xl overflow-hidden w-full aspect-[3/4] max-h-[640px]">
              <img
                src="/image.png"
                alt="Человек проходит опрос на смартфоне"
                className="w-full h-full object-cover object-center"
              />

              {/* Градиент снизу */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%)" }}
              />

              {/* Статы поверх */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                    >
                      <p className="font-body tabular-nums text-lg font-semibold tracking-tight text-white leading-none mb-1">
                        {stat.num}
                      </p>
                      <p className="text-[11px] font-body text-white/70 leading-tight">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

      </div>
    </section>
  );
}