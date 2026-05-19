"use client";

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
  },
];

function CheckIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-[#2F1D69] flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-white" />
    </div>
  );
}

function PlanCard({ plan }: any) {
  return (
    <div
      className="
        relative
        overflow-hidden

        rounded-[34px]

        border
        border-white/30

        bg-white/70
        backdrop-blur-2xl

        p-5

        shadow-[0_10px_50px_rgba(0,0,0,0.06)]

        transition-all
        duration-300

        hover:-translate-y-1
      "
    >
      {/* glass overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_45%)]" />

      {/* top block */}
      <div
        className={`
          relative
          z-10

          rounded-[24px]

          p-7

          min-h-[120px]

          overflow-hidden

          ${
            plan.name === "Enterprise"
              ? "bg-[linear-gradient(135deg,#6438D9_0%,#7B4FF0_60%,#D9F326_100%)]"
              : plan.name === "Pro"
              ? "bg-[linear-gradient(180deg,#FFFFFF_0%,#F3EDFF_100%)]"
              : "bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F3FF_60%,#D9F326_140%)]"
          }
        `}
      >
        {/* glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_45%)]" />

        <div className="relative z-10">
          <h3
            className={`
              text-[28px]
              leading-none
              tracking-[-0.04em]
              font-semibold

              ${
                plan.name === "Enterprise"
                  ? "text-white"
                  : "text-[#1C0C4C]"
              }
            `}
          >
            {plan.name}
          </h3>

          <p
            className={`
              mt-3
              text-[18px]
              leading-[1.1]

              ${
                plan.name === "Enterprise"
                  ? "text-white/80"
                  : "text-[#3A2B73]"
              }
            `}
          >
            {plan.subtitle}
          </p>
        </div>
      </div>

      {/* features */}
      <div className="relative z-10 mt-7 flex flex-col gap-4">
        {plan.features.map((item: string, i: number) => (
          <div key={i} className="flex items-center gap-3">
            <CheckIcon />

            <span
              className="
                text-[20px]
                leading-[1.15]
                tracking-[-0.03em]
                text-[#2A185F]
                font-medium
              "
            >
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* button */}
      <button
        className={`
          relative
          z-10

          mt-10

          h-[58px]
          w-full

          rounded-[18px]

          text-[20px]
          font-medium

          transition-all
          duration-300

          ${
            plan.button === "violet"
              ? "bg-[#6438D9] text-white"
              : plan.button === "mix"
              ? "bg-[linear-gradient(90deg,#6438D9_0%,#7B4FF0_60%,#D9F326_100%)] text-white"
              : "bg-[linear-gradient(90deg,#D9F326_0%,#E5F667_100%)] text-[#1C0C4C]"
          }
        `}
      >
        ✦ Выбрать тариф
      </button>
    </div>
  );
}

export default function Pricing() {
  return (
    <section
      className="
        relative
        overflow-hidden

        py-20
        lg:py-28

        px-4
        sm:px-6
        lg:px-8
      "
    >
      {/* background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#DCCEFF_0%,#7B4FF0_45%,#9A78F5_100%)]" />

      {/* curved lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-[200px] left-[10%] w-[900px] h-[900px] rounded-full border border-white/30" />

        <div className="absolute top-[10%] right-[-250px] w-[800px] h-[800px] rounded-full border border-white/20" />

        <div className="absolute bottom-[-350px] left-[20%] w-[900px] h-[900px] rounded-full border border-white/20" />
      </div>

      {/* glass overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        {/* title */}
        <div className="flex justify-center mb-14 lg:mb-16">
          <h2
            className="
              max-w-[700px]

              text-center

              text-[42px]
              sm:text-[56px]
              lg:text-[72px]

              leading-[0.9]
              tracking-[-0.06em]

              font-semibold

              text-white
            "
          >
            Прозрачные тарифы
            <br />
            для любых задач
          </h2>
        </div>

        {/* cards */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3

            gap-6
          "
        >
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}