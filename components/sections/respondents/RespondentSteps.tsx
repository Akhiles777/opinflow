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
      <div
        className="
          relative
          overflow-hidden

          mx-auto
          max-w-[1450px]

          rounded-[40px]

          bg-[#F7F4FF]

          px-6
          py-10

          lg:px-14
          lg:py-14
        "
      >
      

        <div
          className="
            relative
            z-10

            flex
            flex-col

            gap-12

            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >
          {/* LEFT */}
          <div className="w-full max-w-[620px]">
            <h2
              className="
                text-[44px]
                leading-none
                tracking-[-0.05em]

                font-[800]

                text-[#1D0B57]

                sm:text-[56px]
                lg:text-[68px]
              "
            >
              4 простых шага
            </h2>

            {/* cards */}
            <div
              className="
                mt-10

                grid
                grid-cols-1
                gap-5

                sm:grid-cols-2
              "
            >
              {steps.map((step) => (
                <div
                  key={step.num}
                  className={`
                    rounded-[30px]

                    p-7

                    min-h-[210px]

                    transition-all
                    duration-300

                    ${
                      step.lime
                        ? "bg-[#DDF247]"
                        : "border border-[#DDD4FA] bg-[#FBFAFF]"
                    }
                  `}
                >
                  {/* number */}
                  <div className="text-[18px] font-semibold text-[#6C3CF0]">
                    {step.num}
                  </div>

                  {/* title */}
                  <h3
                    className="
                      mt-6

                      whitespace-pre-line

                      text-[24px]
                      leading-[1.05]

                      font-semibold

                      tracking-[-0.04em]

                      text-[#1D0B57]
                    "
                  >
                    {step.title}
                  </h3>

                  {/* desc */}
                  <p
                    className={`
                      mt-5

                      text-[16px]
                      leading-[1.45]

                      ${
                        step.lime
                          ? "text-[#1D0B57]/75"
                          : "text-[#7D749C]"
                      }
                    `}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

         {/* RIGHT */}
<div
  className="
    relative

    flex
    items-center
    justify-center

    w-full
    xl:w-[720px]

    xl:-ml-10
  "
>
  <Image
    src="/Respondent/img_res.svg"
    alt="Ноутбук"

    width={920}
    height={760}
    priority

    className="
      relative
      z-10

      h-auto
      w-full

      max-w-[920px]

      object-contain
    "
  />
</div>
        </div>
      </div>
    </section>
  );
}