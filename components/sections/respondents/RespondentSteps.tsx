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
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">

        <div className="flex flex-col xl:flex-row xl:items-start xl:gap-4">

          {/* LEFT — 45% */}
          <div className="w-full xl:w-[45%] xl:flex-shrink-0">
            <h2 className="text-[40px] sm:text-[52px] lg:text-[62px] font-[800] leading-[0.92] tracking-[-0.05em] text-[#1D0B57]">
              4 простых шага
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className={`flex flex-col justify-between rounded-[24px] p-6 min-h-[180px] transition-transform duration-300 hover:-translate-y-[2px] ${
                    step.lime
                      ? "bg-[#DDF247]"
                      : "bg-white border border-[#E2D9F8]"
                  }`}
                >
                  <span className={`text-[14px] font-[700] ${step.lime ? "text-[#4A2DB5]" : "text-[#6C3CF0]"}`}>
                    {step.num}
                  </span>

                  <h3 className="mt-4 whitespace-pre-line text-[20px] sm:text-[22px] font-[700] leading-[1.1] tracking-[-0.04em] text-[#1D0B57]">
                    {step.title}
                  </h3>

                  <p className={`mt-3 text-[14px] leading-[1.55] max-w-[230px] ${step.lime ? "text-[#1D0B57]/70" : "text-[#7B7399]"}`}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — 55%, ноутбук в потоке */}
          <div className="w-full xl:w-[55%] mt-10 xl:mt-0 flex items-start justify-center xl:justify-end">
            <Image
              src="/Respondent/img_res.svg"
              alt="Платформа ПотокМнений"
              width={780}
              height={580}
              priority
              className="w-full h-auto object-contain max-w-[500px] sm:max-w-[560px] xl:max-w-[680px] drop-shadow-[0_20px_50px_rgba(40,16,90,0.08)]"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
