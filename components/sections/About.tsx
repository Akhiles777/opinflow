import * as React from "react";
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
  { num: "800+", label: "исследований" },
  { num: "5 мин", label: "запуск опроса" },
  { num: "97%", label: "качество ответов" },
];

export default function About() {
  return (
    <section
      id="about"
      className="bg-site-bg px-4 pt-20 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8 lg:pt-32 lg:pb-20"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center lg:grid-cols-2 lg:gap-16">

        {/* Left */}
        <div>
          <RevealOnScroll>
            <h2 className="mb-6 font-display text-heading text-site-heading">
              ПотокМнений — когда данные становятся доступными
            </h2>

            <p className="mb-8 text-sm leading-relaxed text-site-muted">
              Мы создаём платформу, где каждая сторона получает реальную ценность.
              ПотокМнений — это онлайн-платформа, которая объединяет бизнес и людей,
              готовых делиться своим мнением.
            </p>

            <p className="mb-8 text-sm leading-relaxed text-site-muted">
              Только реальные люди, реальные ответы и честная система вознаграждений.
              Мы создаём честную экосистему маркетинговых исследований.
            </p>
          </RevealOnScroll>

          <div className="divide-y divide-site-border">
            {principles.map((item) => (
              <RevealOnScroll key={item.title}>
                <div className="py-5">
                  <p className="mb-2 text-xl font-semibold text-site-heading">
                    {item.title}
                  </p>
                  <p className="text-sm leading-relaxed text-site-muted">
                    {item.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>

        {/* Right */}
        <RevealOnScroll direction="right">
          <div className="mt-12 lg:mt-0">
            <div className="relative aspect-[3/4] w-full max-h-[640px] overflow-hidden rounded-3xl">

              <img
                src="/image.png"
                alt="Человек проходит опрос на смартфоне"
                className="h-full w-full object-cover object-center"
              />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%)",
                }}
              />

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl p-3 text-center"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <p className="mb-1 font-body text-lg font-semibold leading-none text-white">
                        {stat.num}
                      </p>
                      <p className="text-[11px] leading-tight text-white/70">
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