"use client";

import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";

const steps = ["Основное", "Вопросы", "Аудитория", "Бюджет"] as const;
type Step = (typeof steps)[number];

function Stepper({ active }: { active: Step }) {
  return (
    <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, idx) => {
          const current = s === active;
          const done = steps.indexOf(active) > idx;
          return (
            <div key={s} className="flex items-center gap-3">
              <div
                className={[
                  "w-9 h-9 rounded-full flex items-center justify-center border text-sm font-semibold font-body",
                  current
                    ? "bg-brand border-brand text-white"
                    : done
                    ? "bg-brand/10 border-brand/30 text-brand"
                    : "bg-dash-bg border-dash-border text-dash-muted",
                ].join(" ")}
              >
                {done ? "✓" : idx + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-heading font-body">{s}</p>
                <p className="text-xs text-dash-muted font-body">Шаг {idx + 1} из 4</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-dash-muted font-body">{label}</span>
      {children}
    </label>
  );
}

export default function ClientSurveyCreatePage() {
  const [step, setStep] = React.useState<Step>("Основное");

  return (
    <div>
      <PageHeader
        title="Создать опрос"
        subtitle="Конструктор опросов. На Этапе 3 подключим сохранение, DnD и логику вопросов."
        right={
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl border border-dash-border bg-dash-bg px-5 py-3 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors"
            >
              Сохранить черновик
            </button>
            <button
              type="button"
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors"
            >
              Опубликовать
            </button>
          </div>
        }
      />

      <div className="mt-8">
        <Stepper active={step} />
      </div>

      <div className="mt-6 bg-dash-card border border-dash-border rounded-2xl p-6">
        <div className="flex flex-wrap gap-2">
          {steps.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={[
                "px-4 py-2 rounded-xl text-sm font-semibold font-body border transition-colors",
                s === step
                  ? "bg-brand/10 border-brand/30 text-brand"
                  : "bg-dash-bg border-dash-border text-dash-muted hover:text-dash-heading hover:bg-dash-card",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>

        {step === "Основное" ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Field label="Название опроса">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="Например: Доставка продуктов" />
            </Field>
            <Field label="Категория">
              <select className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body">
                <option>Потребительские</option>
                <option>HR</option>
                <option>Продукт</option>
                <option>Маркетинг</option>
                <option>Другое</option>
              </select>
            </Field>
            <Field label="Описание">
              <textarea className="min-h-[120px] rounded-xl border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-body" placeholder="Коротко: что вы хотите узнать" />
            </Field>
            <Field label="Время прохождения">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="~5 минут" />
            </Field>
          </div>
        ) : null}

        {step === "Вопросы" ? (
          <div className="mt-6 grid gap-4">
            {[
              { type: "Одиночный выбор", q: "Как часто вы пользуетесь нашим сервисом?" },
              { type: "Шкала Лайкерта", q: "Оцените удобство по шкале 1–5" },
            ].map((q, i) => (
              <div key={q.q} className="bg-dash-bg border border-dash-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand font-body mb-2">
                      {q.type}
                    </p>
                    <p className="text-sm font-semibold text-dash-heading font-body">{i + 1}. {q.q}</p>
                  </div>
                  <button type="button" className="text-sm font-semibold text-brand hover:underline">
                    Удалить
                  </button>
                </div>
                <div className="mt-4 grid gap-2">
                  <div className="flex items-center gap-2 text-sm text-dash-muted font-body">
                    <span className="w-4 h-4 rounded-full border border-dash-border bg-dash-card" />
                    Вариант ответа
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dash-muted font-body">
                    <span className="w-4 h-4 rounded-full border border-dash-border bg-dash-card" />
                    Вариант ответа
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-4 rounded-xl border-2 border-dashed border-dash-border bg-dash-card px-4 py-2 text-sm font-semibold text-dash-muted hover:text-dash-heading hover:border-brand/40 hover:bg-brand/5 transition-colors"
                >
                  Добавить вариант
                </button>
              </div>
            ))}

            <button
              type="button"
              className="rounded-2xl border-2 border-dashed border-dash-border bg-dash-bg p-6 text-sm font-semibold text-dash-muted hover:text-dash-heading hover:border-brand/40 hover:bg-brand/5 transition-colors"
            >
              + Добавить вопрос
            </button>
          </div>
        ) : null}

        {step === "Аудитория" ? (
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Пол">
                <div className="flex gap-2">
                  {["Все", "Мужской", "Женский"].map((v) => (
                    <button key={v} type="button" className="flex-1 h-11 rounded-xl border border-dash-border bg-dash-bg text-sm font-semibold text-dash-muted hover:text-dash-heading hover:bg-dash-card transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Возраст">
                <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="18–45" />
              </Field>
              <Field label="Города">
                <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="Москва, СПб" />
              </Field>
              <Field label="Интересы">
                <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="Технологии, еда" />
              </Field>
            </div>

            <div className="rounded-2xl bg-dash-sidebar text-white p-6 h-fit">
              <p className="text-sm text-white/40 font-body">Виджет расчёта</p>
              <p className="mt-4 text-sm text-white/80 font-body">Расчётный охват: ~2 400 чел.</p>
              <p className="mt-2 text-sm text-white/80 font-body">Прогноз сбора: 3–5 дней</p>
              <p className="mt-4 text-xs text-white/35 font-body">Обновим на Этапе 3.</p>
            </div>
          </div>
        ) : null}

        {step === "Бюджет" ? (
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Количество респондентов">
                <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" defaultValue="200" />
              </Field>
              <Field label="Вознаграждение за одного (мин 20 ₽)">
                <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" defaultValue="120" />
              </Field>
              <Field label="Дата запуска">
                <input type="date" className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" />
              </Field>
              <Field label="Авто-остановка">
                <label className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 flex items-center gap-2 text-sm text-dash-body font-body">
                  <input type="checkbox" className="accent-brand" />
                  Остановить при достижении лимита
                </label>
              </Field>
            </div>

            <div className="rounded-2xl bg-dash-sidebar text-white p-6 h-fit">
              <p className="text-sm text-white/40 font-body mb-4">Итого</p>
              <div className="grid gap-2 text-sm font-body text-white/80">
                <div className="flex justify-between">
                  <span>Вознаграждения</span>
                  <span className="tabular-nums">200 × 120 = 24 000 ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>Комиссия (15%)</span>
                  <span className="tabular-nums">3 600 ₽</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Итого к оплате</span>
                  <span className="tabular-nums">27 600 ₽</span>
                </div>
              </div>
              <button type="button" className="mt-6 w-full rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
                Опубликовать опрос
              </button>
              <button type="button" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-6 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                Сохранить черновик
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

