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
    <section className="bg-[#F5F5F7] px-3 py-8 lg:px-5 lg:py-12">
      <div
        className="
          relative
          overflow-hidden

          mx-auto
          max-w-[1450px]

          rounded-[38px]

          bg-[#F7F4FF]

          px-5
          py-8

          sm:px-7
          lg:px-12
          lg:py-12
          xl:px-16
        "
      >
        {/* soft background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(120,90,255,0.08),transparent_40%)]" />

        {/* content */}
        <div
          className="
            relative
            z-10

            flex
            flex-col

            gap-10

            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >
          {/* LEFT */}
          <div className="w-full max-w-[690px]">
            <h2
              className="
                text-[42px]
                leading-[0.92]
                tracking-[-0.06em]

                font-[800]

                text-[#1D0B57]

                sm:text-[54px]
                lg:text-[66px]
              "
            >
              4 простых шага
            </h2>

            {/* cards */}
            <div
              className="
                mt-8

                grid
                grid-cols-1
                gap-4

                sm:grid-cols-2
                lg:gap-5
              "
            >
              {steps.map((step) => (
                <div
                  key={step.num}
                  className={`
                    relative

                    min-h-[210px]

                    rounded-[28px]

                    p-6

                    transition-all
                    duration-300

                    ${
                      step.lime
                        ? "bg-[#DDF247]"
                        : "border border-[#DDD4FA] bg-[#FCFBFF]"
                    }

                    hover:-translate-y-[2px]
                  `}
                >
                  {/* number */}
                  <div
                    className={`
                      text-[15px]
                      font-[700]

                      ${
                        step.lime
                          ? "text-[#5C37D5]"
                          : "text-[#6C3CF0]"
                      }
                    `}
                  >
                    {step.num}
                  </div>

                  {/* title */}
                  <h3
                    className="
                      mt-5

                      whitespace-pre-line

                      text-[20px]
                      leading-[1.05]

                      font-[700]

                      tracking-[-0.05em]

                      text-[#1D0B57]

                      sm:text-[22px]
                      lg:text-[24px]
                    "
                  >
                    {step.title}
                  </h3>

                  {/* desc */}
                  <p
                    className={`
                      mt-5

                      max-w-[260px]

                      text-[15px]
                      leading-[1.5]

                      ${
                        step.lime
                          ? "text-[#1D0B57]/75"
                          : "text-[#7B7399]"
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

              xl:w-[760px]
              xl:flex-shrink-0

              xl:-ml-24
            "
          >
            {/* glow */}
            <div
              className="
                absolute

                h-[500px]
                w-[500px]

                rounded-full

                bg-[#8B5CF6]/10

                blur-[100px]
              "
            />

            <Image
              src="/Respondent/img_res.svg"
              alt="Ноутбук"

              width={1200}
              height={900}
              priority

              className="
                relative
                z-10

                h-auto
                w-full

                max-w-[900px]

                object-contain

                drop-shadow-[0_30px_70px_rgba(40,16,90,0.12)]

                xl:scale-[1.18]
              "
            />
          </div>
        </div>
      </div>
    </section>
  );
}