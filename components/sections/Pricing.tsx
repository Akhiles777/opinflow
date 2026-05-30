"use client";

import Link from "next/link";

const plans = [
  {
    name: "Basic",
    subtitle: "20% комиссия площадки",
    features: [
      "Все возможности площадки",
      "Углубленная ИИ-аналитика",
      "Доступ к базе респондентов",
    ],
    button: "green",
    href: "/register?role=CLIENT&plan=basic",
  },
  {
    name: "Pro",
    subtitle: "Подключить аналитика компании",
    features: [
      "Углубленная аналитика",
      "Анализ рынка",
      "Поиск инсайтов",
      "Запуск опроса под ключ",
    ],
    button: "violet",
    href: "/register?role=CLIENT&plan=pro",
  },
  {
    name: "Enterprise",
    subtitle: "Индивидуально",
    features: [
      "API",
      "White-label",
      "Личный менеджер",
    ],
    button: "mix",
    href: "/#contacts",
  },
];

function CheckIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-[#2F1D69] dark:bg-white/20 flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-white" />
    </div>
  );
}

function PlanCard({ plan }: { plan: typeof plans[number] }) {
  const topBg =
    plan.name === "Enterprise"
      ? "bg-[linear-gradient(135deg,#6438D9_0%,#7B4FF0_60%,#D9F326_100%)]"
      : plan.name === "Pro"
      ? "bg-[linear-gradient(180deg,#FFFFFF_0%,#F3EDFF_100%)] dark:bg-[linear-gradient(180deg,#2A1862_0%,#3D22A0_100%)]"
      : "bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F3FF_60%,#D9F326_140%)] dark:bg-[linear-gradient(135deg,#1E1050_0%,#2A1862_60%,#D9F326_140%)]";

  const nameColor =
    plan.name === "Enterprise" ? "text-white" : "text-[#1C0C4C] dark:text-white";

  const subtitleColor =
    plan.name === "Enterprise" ? "text-white/80" : "text-[#3A2B73] dark:text-white/65";

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/30 dark:border-white/15 bg-white/70 dark:bg-white/10 backdrop-blur-2xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_50px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      {/* glass overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_45%)]" />

      {/* top header */}
      <div className={`relative z-10 rounded-[24px] p-7 min-h-[120px] overflow-hidden ${topBg}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_45%)]" />
        <div className="relative z-10">
          <h3 className={`text-[28px] leading-none tracking-[-0.04em] font-semibold ${nameColor}`}>
            {plan.name}
          </h3>
          <p className={`mt-3 text-[18px] leading-[1.1] ${subtitleColor}`}>
            {plan.subtitle}
          </p>
        </div>
      </div>

      {/* features */}
      <div className="relative z-10 mt-7 flex flex-col gap-4 flex-1">
        {plan.features.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <CheckIcon />
            <span className="text-[20px] leading-[1.15] tracking-[-0.03em] text-[#2A185F] dark:text-white/85 font-medium">
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* button */}
      <Link
        href={plan.href}
        className={`relative z-10 mt-10 h-[58px] w-full rounded-[18px] text-[20px] font-medium transition-all duration-300 hover:scale-[1.01] ${
          plan.button === "violet"
            ? "bg-[#6438D9] text-white"
            : plan.button === "mix"
            ? "bg-[linear-gradient(90deg,#6438D9_0%,#7B4FF0_60%,#D9F326_100%)] text-white"
            : "bg-[linear-gradient(90deg,#D9F326_0%,#E5F667_100%)] text-[#1C0C4C]"
        } inline-flex items-center justify-center`}
      >
        ✦ Выбрать тариф
      </Link>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      {/* background gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#DCCEFF_0%,#7B4FF0_45%,#9A78F5_100%)]" />

      {/* decorative rings */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-[200px] left-[10%] w-[900px] h-[900px] rounded-full border border-white/30" />
        <div className="absolute top-[10%] right-[-250px] w-[800px] h-[800px] rounded-full border border-white/20" />
        <div className="absolute bottom-[-350px] left-[20%] w-[900px] h-[900px] rounded-full border border-white/20" />
      </div>

      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        <div className="flex justify-center mb-14 lg:mb-16">
          <h2 className="max-w-[700px] text-center text-[42px] sm:text-[56px] lg:text-[72px] leading-[0.9] tracking-[-0.06em] font-semibold text-white">
            Прозрачные тарифы
            <br />
            для любых задач
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
