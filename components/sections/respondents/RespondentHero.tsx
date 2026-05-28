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
    <section className="bg-[#F5F5F7] px-3 pt-3 lg:px-5 lg:pt-5">
      <div
        className="
          relative
          overflow-hidden

          min-h-[680px]

          rounded-[40px]

          bg-[#F7F4FF]
        "
      >
        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(128,90,255,0.10),transparent_42%)]" />

        {/* RIGHT PURPLE GLOW */}
        <div
          className="
            absolute
            right-[-140px]
            top-[120px]

            h-[620px]
            w-[620px]

            rounded-full

            bg-[#8B5CF6]/10

            blur-[110px]
          "
        />

        {/* CURVE LINE */}
        <svg
          className="absolute right-[-80px] top-[210px] w-[760px] opacity-70"
          viewBox="0 0 980 420"
          fill="none"
        >
          <path
            d="M10 260C170 120 340 340 520 250C710 150 830 210 980 80"
            stroke="#D8E64B"
            strokeWidth="2"
          />
        </svg>

        {/* DOTS */}
        <div className="absolute right-[340px] top-[150px] h-[14px] w-[14px] rounded-full bg-[#D7EB39]" />

        <div className="absolute left-[48%] top-[58%] h-[16px] w-[16px] rounded-full bg-[#A56EFF]" />

        <div className="absolute right-[120px] top-[390px] h-[16px] w-[16px] rounded-full bg-[#B06CFF]" />

        {/* PURPLE SPHERE */}
        <div
          className="
            absolute
            bottom-[-90px]
            right-[-60px]

            h-[240px]
            w-[240px]

            rounded-full
          "
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #C8AEFF 0%, #8B5CF6 45%, #6D28D9 100%)",
            boxShadow: "0 30px 80px rgba(109,40,217,0.35)",
          }}
        />

        {/* CONTENT */}
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

            gap-8

            px-7
            pt-12
            pb-12

            lg:px-14
            lg:pt-14
          "
        >
          {/* LEFT */}
          <div className="max-w-[500px]">
            <h1
              className="
                text-[62px]
                leading-[0.9]
                tracking-[-0.07em]

                font-[800]

                text-[#1E0D56]

                xl:text-[76px]
              "
            >
              <span className="text-[#6C3CF0]">Зарабатывай</span>
              <br />
              на своём
              <br />
              мнении
            </h1>

            <p
              className="
                mt-6

                max-w-[470px]

                text-[18px]
                leading-[1.55]

                text-[#776B9D]
              "
            >
              Регистрируйся, проходи короткие опросы от брендов и
              получай выплаты на карту, телефон или электронный
              кошелёк. Без сложных заданий и скрытых условий.
            </p>

            <div className="mt-8">
              <Link
                href="/register?role=RESPONDENT"
                className="
                  inline-flex
                  items-center
                  gap-3

                  rounded-[16px]

                  bg-[#6438D9]

                  px-7
                  h-[58px]

                  text-[16px]
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

              <ul className="mt-8 space-y-4">
                {checks.map((item) => (
                  <li
                    key={item}
                    className="
                      flex
                      items-center
                      gap-3

                      text-[16px]

                      text-[#675B94]
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
    justify-end

    w-full
    max-w-[760px]

    lg:-ml-20
  "
>
  <div className="relative w-full">
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
        w-[108%]

        max-w-none

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