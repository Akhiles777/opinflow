import * as React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const surveys = [
  {
    title: "Оцените качество сервиса доставки",
    reward: "120 ₽",
    meta: "~5 минут · 8 вопросов",
    tag: "Потребительский опрос",
  },
  {
    title: "Выбор бренда кофе: привычки и триггеры",
    reward: "220 ₽",
    meta: "~9 минут · 12 вопросов",
    tag: "Категорийный опрос",
  },
  {
    title: "Мобильные банки: удобство и доверие",
    reward: "150 ₽",
    meta: "~6 минут · 10 вопросов",
    tag: "Финтех",
  },
];

function SurveyCard({ item }: { item: (typeof surveys)[number] }) {
  return (
    <div className="group rounded-2xl border border-white/8 bg-surface-900 p-6 hover:border-brand/25 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">
            {item.tag}
          </p>
          <h3 className="mt-3 font-display text-xl text-white">
            {item.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-sm font-semibold text-brand-light">
          +{item.reward}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm font-body text-white/45">{item.meta}</p>
        <Button variant="secondary" size="md">
          Открыть →
        </Button>
      </div>
    </div>
  );
}

export default function RespondentDashboardPage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
      <div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
              Лента опросов
            </h1>
            <p className="mt-2 text-sm sm:text-base font-body text-white/40">
              Подборка заданий под ваш профиль. Выбирайте, проходите, получайте выплаты.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="md">
              История
            </Button>
            <Button variant="primary" size="md">
              Заполнить профиль
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Input placeholder="Поиск по опросам" />
          <Button variant="secondary" size="md" className="sm:shrink-0">
            Фильтры
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {surveys.map((s) => (
            <SurveyCard key={s.title} item={s} />
          ))}
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">
            Баланс
          </p>
          <p className="mt-3 font-body tabular-nums text-4xl font-semibold tracking-tight text-white">
            1 240 ₽
          </p>
          <p className="mt-2 text-sm font-body text-white/40">
            Доступно для вывода от 100 ₽.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="primary" size="md" href="/respondent/wallet">
              Вывести
            </Button>
            <Button variant="secondary" size="md" href="/respondent/wallet">
              История
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-surface-900 p-6">
          <p className="text-xs font-body text-white/35 uppercase tracking-[0.2em]">
            Рефералы
          </p>
          <p className="mt-3 text-sm font-body text-white/45 leading-relaxed">
            Приглашайте друзей и получайте бонусы с их опросов. Вставим сюда вашу реф-ссылку на Этапе 2.
          </p>
          <div className="mt-5">
            <Button variant="secondary" size="md">
              Открыть программу →
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

