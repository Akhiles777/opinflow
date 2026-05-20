"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";
import Image from "next/image";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="bg-[#FCFBFF] px-4 mt-6 mb-20">
      <RevealOnScroll>
        <div
          className="
            relative
            overflow-hidden

            mx-auto
            max-w-[1600px]

            rounded-[32px]
            lg:rounded-[42px]

            border
            border-[#BFAEF3]

            bg-[linear-gradient(135deg,#6438D9_0%,#7B4FF0_45%,#8F67F5_100%)]
          "
        >
          {/* glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -left-[10%] top-[10%] w-[420px] h-[420px] rounded-full bg-[#A98BFF]/30 blur-3xl" />

            <div className="absolute right-[-10%] top-[-10%] w-[520px] h-[520px] rounded-full bg-[#8E66FF]/20 blur-3xl" />

            <div className="absolute bottom-[-20%] left-[30%] w-[420px] h-[420px] rounded-full bg-[#CDBDFF]/20 blur-3xl" />
          </div>

          {/* curved lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-[300px] right-[-180px] w-[900px] h-[900px] rounded-full border border-white/30" />

            <div className="absolute -bottom-[500px] left-[10%] w-[1000px] h-[1000px] rounded-full border border-white/20" />
          </div>

          {/* content */}
          <div
            className="
              relative
              z-10

              grid
              grid-cols-1
              lg:grid-cols-2

              items-center

              gap-10
              lg:gap-0
            "
          >
            {/* LEFT */}
            <div
              className="
                px-6
                sm:px-10
                lg:px-16

                pt-14
                lg:pt-0

                pb-0
                lg:pb-0

                lg:min-h-[560px]

                flex
                flex-col
                justify-center
              "
            >
              <div className="max-w-[620px]">
                <h2
                  className="
                    text-white

                    text-[38px]
                    sm:text-[52px]
                    lg:text-[72px]

                    leading-[0.92]

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

                    text-[17px]
                    sm:text-[19px]
                    lg:text-[22px]

                    leading-[1.4]

                    max-w-[520px]
                  "
                >
                  Зарегистрируйтесь сейчас и запустите
                  свой первый опрос за 5 минут
                </p>

                <Link href="/register?role=CLIENT">
                  <button
                    className="
                      mt-10

                      h-[60px]
                      lg:h-[64px]

                      px-7
                      lg:px-8

                      rounded-[18px]
                      lg:rounded-[20px]

                      bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)]

                      text-[#1C0C4C]

                      text-[17px]
                      lg:text-[18px]

                      font-semibold

                      transition-transform
                      duration-300

                      hover:scale-[1.02]
                    "
                  >
                    ✦ Регистрация
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div
              className="
                relative

                flex
                items-end
                justify-center
                lg:justify-end

                min-h-[260px]
                sm:min-h-[320px]
                md:min-h-[420px]
                lg:min-h-[560px]
              "
            >
              <div
                className="
                  relative

                  w-full

                  h-[260px]
                  sm:h-[320px]
                  md:h-[420px]
                  lg:h-[560px]

                  max-w-[760px]
                "
              >
                <Image
                  src="/cta.svg"
                  alt="CTA Illustration"
                  fill
                  priority
                  className="
                    object-contain
                    object-bottom

                    lg:object-bottom-right
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}