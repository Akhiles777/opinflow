import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import SectionLabel from "@/components/ui/SectionLabel";

const roles = [
  {
    title: "Респондент",
    description:
      "Баланс, история начислений, список доступных опросов и реферальная статистика.",
  },
  {
    title: "Заказчик",
    description:
      "Создание опросов, управление бюджетом, статистика в реальном времени и отчеты.",
  },
  {
    title: "Администратор",
    description:
      "Модерация опросов, управление пользователями, настройка комиссии и мониторинг.",
  },
];

export default function Cabinets() {
  return (
    <section className="bg-white border-b border-gray-100 py-32 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <RevealOnScroll>
          <SectionLabel>Кабинеты</SectionLabel>
          <h2 className="font-display text-display-xl text-gray-900">
            Роли и рабочие пространства
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 text-left">
          {roles.map((role) => (
            <RevealOnScroll key={role.title}>
              <div className="border border-gray-200 rounded-2xl p-8 hover:border-brand/30 hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="h-px w-0 group-hover:w-full bg-brand transition-all duration-500 mb-8" />
                <div className="w-11 h-11 bg-gray-100 group-hover:bg-brand-light rounded-xl flex items-center justify-center transition-colors duration-300 text-brand">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-gray-900 mt-6 mb-3">
                  {role.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                  {role.description}
                </p>
                <a className="text-sm font-semibold text-brand flex items-center gap-1.5 group-hover:gap-2.5 transition-all" href="#">
                  Подробнее
                  <span>→</span>
                </a>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
