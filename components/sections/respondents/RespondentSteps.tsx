"use client";

import Image from "next/image";

const steps = [
  {
    num: "01",
    title: "Зарегистрируйся\nза 1 минуту",
    desc: "Укажи имя, почту и создай пароль",
    lime: false,
  },
  {
    num: "02",
    title: "Заполни\nинформацию о себе",
    desc: "Никаких сложных анкет",
    lime: false,
  },
  {
    num: "03",
    title: "Проходи опросы в\nудобное время",
    desc: "Получай уведомления о новых опросах, которые подходят твоему профилю",
    lime: false,
  },
  {
    num: "04",
    title: "Получай деньги на\nсчёт",
    desc: "Выводи заработанное на карту, телефон или электронный кошелёк",
    lime: true,
  },
];

export default function RespondentSteps() {
  return (
    <section className="bg-[#F5F5F7] px-3 py-10 lg:px-5 lg:py-14">
      <div className="relative overflow-hidden mx-auto max-w-[1450px] rounded-[40px] bg-[#F7F4FF] px-6 py-10 lg:px-14 lg:py-14">

        {/* Заголовок — полная ширина над двумя колонками */}
        <h2 className="text-[44px] sm:text-[56px] lg:text-[68px] font-[800] leading-none tracking-[-0.05em] text-[#1D0B57] mb-10">
          4 простых шага
        </h2>

        {/* Две колонки: карточки слева, ноутбук справа */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:gap-6">

          {/* LEFT — сетка карточек */}
          <div className="w-full xl:w-[45%] xl:shrink-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className={`flex flex-col justify-between rounded-[28px] p-6 min-h-[200px] transition-transform duration-300 hover:-translate-y-[2px] ${
                    step.lime
                      ? "bg-[#DDF247]"
                      : "border border-[#DDD4FA] bg-[#FBFAFF]"
                  }`}
                >
                  <span className={`text-[16px] font-[700] ${step.lime ? "text-[#4A2DB5]" : "text-[#6C3CF0]"}`}>
                    {step.num}
                  </span>

                  <h3 className="mt-5 whitespace-pre-line text-[22px] sm:text-[24px] font-[700] leading-[1.08] tracking-[-0.04em] text-[#1D0B57]">
                    {step.title}
                  </h3>

                  <p className={`mt-4 text-[15px] leading-[1.5] max-w-[220px] ${step.lime ? "text-[#1D0B57]/70" : "text-[#7D749C]"}`}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — ноутбук, центрирован по высоте карточек */}
          <div className="w-full xl:w-[55%] mt-10 xl:mt-0 flex items-center justify-center xl:justify-end">
            <Image
              src="/Respondent/img_res.svg"
              alt="Платформа ПотокМнений"
              width={920}
              height={760}
              priority
              className="w-full h-auto object-contain max-w-[500px] sm:max-w-[620px] xl:max-w-[780px]"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
