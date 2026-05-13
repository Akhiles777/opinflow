"use client";

import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

type AudienceTab = "respondent" | "client";

const respondentBenefits = [
  "Опросы, которые подходят именно вам — по возрасту, городу и интересам",
  "Простые анкеты — большинство опросов занимает всего несколько минут",
  "Честные выплаты — вы получаете деньги за каждый завершённый опрос",
  "Работает на любом устройстве — проходите опросы когда вам удобно",
  "Бонусы за друзей — приглашайте знакомых и получайте дополнительные вознаграждения",
];

const businessBenefits = [
  "Конструктор опросов — логические ветвления, изображения, видео и разные типы вопросов",
  "Точный подбор респондентов — возраст, город, интересы и социальные параметры",
  "ИИ-аналитика — графики, ключевые темы, облако слов и анализ тональности",
  "Быстрый запуск исследований — создайте опрос за несколько минут",
  "Прозрачная система оплаты — вы платите только за реальные ответы",
];

const analyticsRows = [
  { label: "Очень доволен", pct: 75 },
  { label: "Доволен", pct: 52 },
  { label: "Нейтрально", pct: 38 },
  { label: "Недоволен", pct: 14 },
];

export default function TwoAudiences() {
  const [activeTab, setActiveTab] =
    React.useState<AudienceTab>("respondent");

  const [renderedTab, setRenderedTab] =
    React.useState<AudienceTab>("respondent");

  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    setIsVisible(false);
    setRenderedTab(activeTab);

    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  const isRespondent = renderedTab === "respondent";

  return (
    <section
      className="bg-site-bg px-4 py-14 sm:px-6 lg:px-8"
      aria-label="Для респондентов и бизнеса"
    >
      <RevealOnScroll direction="up">
        <div className="mx-auto max-w-7xl">

          {/* Tabs */}
          <div className="mb-14 flex justify-center">
            <div className="relative inline-grid grid-cols-2 rounded-2xl border border-site-border bg-site-card p-1 shadow-sm">
              <div
                aria-hidden="true"
                className={[
                  "absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-site-bg shadow-sm transition-all duration-300",
                  activeTab === "respondent"
                    ? "left-1"
                    : "left-[calc(50%+0.25rem)]",
                ].join(" ")}
              />

              <button
                type="button"
                onClick={() => setActiveTab("respondent")}
                className={[
                  "relative z-10 rounded-xl px-6 py-3 text-base transition-colors sm:px-8",
                  activeTab === "respondent"
                    ? "font-semibold text-site-heading"
                    : "font-medium text-site-muted hover:text-site-heading",
                ].join(" ")}
              >
                Респондентам
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("client")}
                className={[
                  "relative z-10 rounded-xl px-6 py-3 text-base transition-colors sm:px-8",
                  activeTab === "client"
                    ? "font-semibold text-site-heading"
                    : "font-medium text-site-muted hover:text-site-heading",
                ].join(" ")}
              >
                Бизнесу
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className={[
              "mx-auto max-w-6xl transition-all duration-300",
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0",
            ].join(" ")}
          >
            <div className="flex flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-center lg:gap-20">

              {/* Left */}
              <div className="order-1">
                <span
                  id={isRespondent ? "respondents" : "business"}
                  className="text-sm font-semibold uppercase tracking-[0.2em] text-site-muted"
                >
                  {isRespondent ? "Респондентам" : "Бизнесу"}
                </span>

                <h2 className="mt-5 font-display text-title text-site-heading">
                  {isRespondent ? (
                    <>
                      Зарабатывайте,
                      <br />
                      делясь мнением
                    </>
                  ) : (
                    <>
                      Получайте ответы
                      <br />
                      от нужной аудитории
                    </>
                  )}
                </h2>

                <p className="mt-6 max-w-xl text-lg leading-8 text-site-body">
                  {isRespondent
                    ? "Ваше мнение действительно важно — и может приносить дополнительный доход. На платформе ПотокМнений вы можете проходить онлайн-опросы от брендов и получать вознаграждение за ответы."
                    : "Маркетинговые исследования часто занимают недели и требуют больших бюджетов. ПотокМнений делает этот процесс быстрым и доступным. Вы создаёте опрос, выбираете нужную аудиторию и получаете готовые результаты с аналитикой."}
                </p>

                <ul className="mt-10 space-y-5">
                  {(isRespondent
                    ? respondentBenefits
                    : businessBenefits
                  ).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-4 text-base leading-8 text-site-body"
                    >
                      <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-brand-light" />
                      {item}
                    </li>
                  ))}
                </ul>

                {!isRespondent ? (
                  <p className="mt-10 max-w-xl text-base leading-8 text-site-muted">
                    Подходит для маркетинговых исследований,
                    тестирования продуктов, анализа рекламы,
                    изучения потребительских привычек и HR-опросов.
                  </p>
                ) : null}

                <div className="mt-12">
                  <Button
                    variant={isRespondent ? "primary" : "secondary"}
                    size="lg"
                    href={
                      isRespondent
                        ? "/register?role=RESPONDENT"
                        : "/register?role=CLIENT"
                    }
                  >
                    {isRespondent
                      ? "Начать зарабатывать →"
                      : "Заказать исследование →"}
                  </Button>
                </div>
              </div>

              {/* Right */}
              <div className="order-2">
                {isRespondent ? (
                  <div className="mx-auto w-full max-w-xl rounded-[28px] border border-site-border bg-site-card p-7 shadow-card">

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-site-muted">
                          Мой баланс
                        </p>

                        <p className="mt-3 font-display text-5xl text-site-heading">
                          1 240 ₽
                        </p>
                      </div>

                      <span className="rounded-xl bg-site-section px-4 py-2 text-sm font-semibold text-site-heading">
                        Вывести
                      </span>
                    </div>

                    <div className="mt-7 rounded-2xl border border-site-border bg-site-section p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-base text-site-body">
                          Опрос о сервисах доставки
                        </p>

                        <span className="text-base font-semibold text-brand-light">
                          +350 ₽
                        </span>
                      </div>

                      <div className="mt-4 h-2 rounded-full bg-site-border">
                        <div className="h-2 w-3/4 rounded-full bg-brand" />
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm text-site-muted">
                        <span>Пройдено сегодня</span>
                        <span>3 опроса</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-xl rounded-[28px] border border-site-border bg-site-card p-7 shadow-card">

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-site-muted">
                        Результаты опроса
                      </p>

                      <span className="rounded-xl bg-site-section px-4 py-2 text-sm font-semibold text-site-heading">
                        842 ответа
                      </span>
                    </div>

                    <div className="mt-7 space-y-5">
                      {analyticsRows.map((row) => (
                        <div key={row.label}>
                          <div className="mb-3 flex items-center justify-between text-base">
                            <span className="text-site-body">
                              {row.label}
                            </span>

                            <span className="font-semibold text-site-heading">
                              {row.pct}%
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-site-border">
                            <div
                              className="h-2 rounded-full bg-brand transition-all duration-300"
                              style={{ width: `${row.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7 rounded-2xl border border-site-border bg-site-section p-5">
                      <p className="text-sm uppercase tracking-[0.16em] text-site-muted">
                        AI Summary
                      </p>

                      <p className="mt-4 text-base leading-8 text-site-body">
                        Аудитория наиболее позитивно реагирует
                        на простую доставку, прозрачные цены
                        и понятные бонусы в приложении.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}