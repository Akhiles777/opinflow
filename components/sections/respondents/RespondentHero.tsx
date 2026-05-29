"use client";

import Image from "next/image";
import Link from "next/link";

const checks = [
  "Моментальные выплаты",
  "Более 25 000 респондентов уже с нами",
  "Только проверенные заказчики",
];

export default function RespondentHero() {
  return (
    <section className="bg-[#F5F5F7] px-3 pt-2 lg:px-5 lg:pt-3">
      <div
        className="
          relative
          overflow-hidden

          rounded-[34px]
          lg:rounded-[40px]

          bg-[#F7F4FF]

          min-h-[620px]
          lg:min-h-[700px]
        "
      >
        {/* background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(128,90,255,0.10),transparent_42%)]" />

        {/* soft purple glow */}
        <div
          className="
            absolute
            right-[-120px]
            top-[80px]

            h-[560px]
            w-[560px]

            rounded-full

            bg-[#8B5CF6]/10

            blur-[110px]
          "
        />

        {/* curved line */}
        <svg
          className="
            absolute

            right-[-120px]
            top-[190px]

            w-[760px]

            opacity-70
          "
          viewBox="0 0 980 420"
          fill="none"
        >
          <path
            d="M10 260C170 120 340 340 520 250C710 150 830 210 980 80"
            stroke="#D8E64B"
            strokeWidth="2"
          />
        </svg>

        {/* dots */}
        <div className="absolute right-[320px] top-[140px] h-[14px] w-[14px] rounded-full bg-[#D7EB39]" />

        <div className="absolute left-[49%] top-[57%] h-[16px] w-[16px] rounded-full bg-[#A56EFF]" />

        <div className="absolute right-[120px] top-[380px] h-[16px] w-[16px] rounded-full bg-[#B06CFF]" />

        {/* purple sphere */}
        <div
          className="
            absolute
            bottom-[-80px]
            right-[-50px]

            h-[220px]
            w-[220px]

            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #C8AEFF 0%, #8B5CF6 45%, #6D28D9 100%)",
            boxShadow: "0 30px 80px rgba(109,40,217,0.35)",
          }}
        />

        {/* content */}
        <div
          className="
            relative
            z-10

            mx-auto
            flex
            max-w-[1480px]

            flex-col
            lg:flex-row

            items-center
            justify-between

            gap-6

            px-6
            pt-8
            pb-10

            sm:px-8

            lg:px-14
            lg:pt-10
            lg:pb-12
          "
        >
          {/* LEFT */}
          <div className="relative z-20 max-w-[500px]">
            <h1
              className="
                text-[52px]
                leading-[0.9]
                tracking-[-0.07em]

                font-[800]

                text-[#1E0D56]

                sm:text-[60px]
                xl:text-[76px]
              "
            >
              <span className="text-[#6C3CF0]">Зарабатывай</span>
              <br />
              <span className="text-[0.78em] tracking-[-0.04em] whitespace-nowrap">на своём мнении</span>
            </h1>

            <p
              className="
                mt-5

                max-w-[450px]

                text-[16px]
                leading-[1.55]

                text-[#776B9D]

                sm:text-[17px]
              "
            >
              Регистрируйся, проходи короткие опросы от брендов и
              получай выплаты на карту, телефон или электронный
              кошелёк. Без сложных заданий и скрытых условий.
            </p>

            <div className="mt-7">
              <Link
                href="/register?role=RESPONDENT"
                className="
                  inline-flex
                  items-center
                  gap-3

                  rounded-[16px]

                  bg-[#6438D9]

                  px-7
                  h-[56px]

                  text-[15px]
                  font-semibold
                  text-white

                  shadow-[0_18px_40px_rgba(100,56,217,0.24)]

                  transition-all
                  duration-300

                  hover:-translate-y-1
                  hover:bg-[#5B31CC]
                "
              >
                ✦ Начать зарабатывать
              </Link>

              <ul className="mt-7 space-y-3">
                {checks.map((item) => (
                  <li
                    key={item}
                    className="
                      flex
                      items-center
                      gap-3

                      text-[15px]

                      text-[#675B94]

                      sm:text-[16px]
                    "
                  >
                    <span className="text-[#6A3EF0]">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
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

              lg:flex-1
              lg:justify-start

              lg:-ml-6
              xl:-ml-10
            "
          >
            <div
              className="
                relative

                w-full

                max-w-[520px]
                sm:max-w-[620px]
                lg:max-w-[760px]
              "
            >
              <Image
                src="/Слой9 1.svg"
                alt="Платформа опросов"
                width={1080}
                height={820}
                priority
                className="
                  relative
                  z-10

                  h-auto
                  w-full

                  object-contain

                  drop-shadow-[0_30px_60px_rgba(40,16,90,0.10)]
                "
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}