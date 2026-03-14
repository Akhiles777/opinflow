import * as React from "react";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const roles = [
  {
    title: "Респондент",
    description:
      "Всё для заработка: баланс, история начислений, список доступных опросов и реферальная статистика. Вывод средств в один клик.",
    href: "/respondent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22c2-5 14-5 16 0" />
      </svg>
    ),
  },
  {
    title: "Заказчик",
    description:
      "Создание опросов, управление бюджетом, просмотр статистики в реальном времени и готовые отчёты. Встроенный конструктор и доступ к экспертам.",
    href: "/client",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="14" rx="3" />
        <path d="M7 8h10" />
        <path d="M7 12h6" />
      </svg>
    ),
    featured: true,
  },
  {
    title: "Администратор",
    description:
      "Модерация опросов, управление пользователями, настройка комиссии, обработка жалоб и финансовый мониторинг — всё в одной панели.",
    href: "/admin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
      </svg>
    ),
  },
];

export default function Cabinets() {
  return (
    <section className="py-24 px-8 bg-site-bg">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display text-heading text-site-heading text-center mb-16">
            Удобные кабинеты для каждой роли
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <RevealOnScroll key={role.title}>
              <div
                className={[
                  "bg-site-card border border-site-border rounded-2xl p-8",
                  "hover:border-brand/25 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group",
                  role.featured ? "border-brand/20" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="w-11 h-11 bg-brand/10 rounded-xl flex items-center justify-center text-brand-light">
                  {role.icon}
                </div>
                <h3 className="font-display text-xl text-site-heading mt-6 mb-3">
                  {role.title}
                </h3>
                <p className="text-sm font-body text-site-muted leading-relaxed mb-8">
                  {role.description}
                </p>
                <Button variant="ghost" size="md" href={role.href}>
                  Подробнее →
                </Button>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
