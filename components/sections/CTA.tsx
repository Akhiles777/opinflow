"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="bg-[#FCFBFF] px-4 mb-25 mt-5">
      <RevealOnScroll>
        <div
          className="
            relative
            overflow-hidden

            max-w-[1600px]
            mx-auto

            rounded-[42px]

            border
            border-[#BFAEF3]

            bg-[linear-gradient(135deg,#6438D9_0%,#7B4FF0_45%,#8F67F5_100%)]

            min-h-[500px]
            lg:min-h-[560px]

            px-6
            sm:px-10
            lg:px-16
          "
        >
          {/* glow */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-[10%] top-[10%] w-[520px] h-[520px] rounded-full bg-[#A98BFF] opacity-30 blur-3xl" />

            <div className="absolute right-[-10%] top-[-10%] w-[620px] h-[620px] rounded-full bg-[#8E66FF] opacity-25 blur-3xl" />

            <div className="absolute bottom-[-20%] left-[30%] w-[500px] h-[500px] rounded-full bg-[#CDBDFF] opacity-20 blur-3xl" />
          </div>

          {/* curved lines */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute -top-[300px] right-[-180px] w-[900px] h-[900px] rounded-full border border-white/30" />

            <div className="absolute -bottom-[500px] left-[10%] w-[1000px] h-[1000px] rounded-full border border-white/20" />
          </div>

          {/* CONTENT */}
          <div
            className="
              relative
              z-10

              flex
              flex-col
              justify-center

              min-h-[500px]
              lg:min-h-[560px]
            "
          >
            {/* TEXT */}
            <div className="relative z-20 max-w-[620px] py-14 lg:py-0">
              <h2
                className="
                  text-white

                  text-[42px]
                  sm:text-[56px]
                  lg:text-[72px]

                  leading-[0.9]

                  tracking-[-0.06em]

                  font-semibold
                "
              >
                Готовы начать исследование?
              </h2>

              <p
                className="
                  mt-6

                  text-white/80

                  text-[18px]
                  sm:text-[20px]
                  lg:text-[22px]

                  leading-[1.4]

                  max-w-[500px]
                "
              >
                Зарегистрируйтесь сейчас и запустите
                свой первый опрос за 5 минут
              </p>

              {/* BUTTON */}
              <Link href='/register?role=CLIENT'>
              <button
                className="
                  mt-10

                  h-[64px]

                  px-8

                  rounded-[20px]

                  bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)]

                  text-[#1C0C4C]

                  text-[18px]
                  font-semibold

                  transition-all
                  duration-300

                  hover:scale-[1.02]
                  hover:shadow-[0_10px_30px_rgba(217,243,38,0.25)]
                "
              >
                ✦ Регистрация
              </button>
              </Link>
            </div>

            {/* IMAGE */}
            <div
              className="
                absolute

                right-[-120px]
                bottom-[-40px]

                sm:right-[-80px]
                sm:bottom-[-20px]

                md:right-[-40px]
                md:bottom-0

                lg:right-0
                lg:bottom-0

                w-[380px]
                h-[380px]

                sm:w-[460px]
                sm:h-[460px]

                md:w-[520px]
                md:h-[520px]

                lg:w-[700px]
                lg:h-[560px]

                pointer-events-none
              "
            >
              <Image
                src="/cta.svg"
                alt="CTA Illustration"
                fill
                priority
                className="
                  object-contain
                  object-bottom-right
                "
              />
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}