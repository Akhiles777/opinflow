"use client";

import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function RespondentCTA() {
  return (
    <section className="bg-[#FCFBFF] px-4 mt-6 mb-20">
      <RevealOnScroll>
        <div className="relative overflow-hidden mx-auto max-w-[1600px] rounded-[32px] lg:rounded-[42px] border border-[#BFAEF3] bg-[linear-gradient(135deg,#6438D9_0%,#7B4FF0_45%,#8F67F5_100%)]">

          {/* glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -left-[10%] top-[10%] w-[420px] h-[420px] rounded-full bg-[#A98BFF]/30 blur-3xl" />
            <div className="absolute right-[-10%] top-[-10%] w-[520px] h-[520px] rounded-full bg-[#8E66FF]/20 blur-3xl" />
            <div className="absolute bottom-[-20%] left-[30%] w-[420px] h-[420px] rounded-full bg-[#CDBDFF]/20 blur-3xl" />
          </div>

          {/* decorative rings */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-[300px] right-[-180px] w-[900px] h-[900px] rounded-full border border-white/30" />
            <div className="absolute -bottom-[500px] left-[10%] w-[1000px] h-[1000px] rounded-full border border-white/20" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center">

            {/* LEFT */}
            <div className="px-6 sm:px-10 lg:px-16 pt-14 pb-14 lg:pb-0 lg:min-h-[500px] flex flex-col justify-center">
              <div className="max-w-[540px]">
                <h2 className="text-white text-[36px] sm:text-[50px] lg:text-[64px] leading-[0.92] tracking-[-0.06em] font-semibold">
                  Готов начать
                  <br />
                  зарабатывать
                  <br />
                  на своём мнении?
                </h2>

                <p className="mt-6 text-white/80 text-[16px] sm:text-[18px] lg:text-[20px] leading-[1.45] max-w-[440px]">
                  Регистрация займёт несколько минут. Первые опросы
                  доступны сразу после подтверждения.
                </p>

                <Link href="/register?role=RESPONDENT">
                  <button className="mt-10 h-[56px] lg:h-[60px] px-7 lg:px-8 rounded-[16px] lg:rounded-[18px] bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)] text-[#1C0C4C] text-[16px] lg:text-[17px] font-semibold transition-transform duration-300 hover:scale-[1.02]">
                    Регистрация
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative flex items-end justify-center lg:justify-end min-h-[200px] sm:min-h-[300px] lg:min-h-[500px]">
              <div className="relative w-full h-[200px] sm:h-[300px] lg:h-[500px] max-w-[640px]">
                <Image
                  src="/Respondent/img_res.svg"
                  alt="Начать зарабатывать"
                  fill
                  className="object-contain object-bottom"
                />
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
