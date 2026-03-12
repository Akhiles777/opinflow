import * as React from "react";
import { Wallet, ListChecks, ClipboardList, UserPlus } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import SurveyCard from "@/components/dashboard/SurveyCard";

const stats = [
  { label: "Текущий баланс", value: "1 240 ₽", trend: "+350 ₽ сегодня", trendUp: true, icon: <Wallet className="w-5 h-5" /> },
  { label: "Опросов пройдено", value: "24", trend: "+3 за неделю", trendUp: true, icon: <ListChecks className="w-5 h-5" /> },
  { label: "Доступных опросов", value: "8", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Приглашено друзей", value: "3", trend: "+1 реферал", trendUp: true, icon: <UserPlus className="w-5 h-5" /> },
];

const surveys = [
  {
    category: "Потребительский",
    title: "Оцените качество сервиса доставки",
    reward: 120,
    duration: 5,
    questions: 8,
    clientRating: 4.8,
    status: "available" as const,
  },
  {
    category: "Категория",
    title: "Выбор бренда кофе: привычки и триггеры",
    reward: 220,
    duration: 9,
    questions: 12,
    clientRating: 4.6,
    status: "in-progress" as const,
  },
  {
    category: "Финтех",
    title: "Мобильные банки: удобство и доверие",
    reward: 150,
    duration: 6,
    questions: 10,
    clientRating: 4.7,
    status: "available" as const,
  },
  {
    category: "Продукт",
    title: "Новый интерфейс: что мешает пользоваться чаще?",
    reward: 180,
    duration: 7,
    questions: 9,
    clientRating: 4.5,
    status: "completed" as const,
  },
];

export default function RespondentOverviewPage() {
  return (
    <div>
      <PageHeader
        title="Добрый день, Пользователь 👋"
        subtitle="Сводка по балансу и доступным опросам."
      />

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            trend={s.trend}
            trendUp={s.trendUp}
          />
        ))}
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold text-dash-heading mb-4 font-body">
          Доступные опросы
        </p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {surveys.map((s) => (
            <SurveyCard
              key={s.title}
              category={s.category}
              title={s.title}
              reward={s.reward}
              duration={s.duration}
              questions={s.questions}
              clientRating={s.clientRating}
              status={s.status}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

