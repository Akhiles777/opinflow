"use client";
import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function RespondentCTA() {
  return (
    <section className="bg-white px-4 lg:px-6 pb-20 pt-4">
      <RevealOnScroll>
        <div
          className="relative overflow-hidden mx-auto max-w-[1600px] rounded-[32px] lg:rounded-[42px]"
          style={{ background: "linear-gradient(135deg, #6438D9 0%, #3B2C7B 100%)" }}
        >
          {/* glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -left-[10%] top-[10%] w-[420px] h-[420px] rounded-full bg-[#A98BFF]/30 blur-3xl" />
            <div className="absolute right-[-10%] top-[-10%] w-[520px] h-[520px] rounded-full bg-[#8E66FF]/20 blur-3xl" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center">
            {/* LEFT */}
            <div className="px-6 sm:px-10 lg:px-16 pt-14 pb-14 lg:pb-0 lg:min-h-[500px] flex flex-col justify-center">
              <div className="max-w-[520px]">
                <h2 className="font-manrope text-white text-[34px] sm:text-[48px] lg:text-[60px] leading-[1.0] tracking-[-0.05em] font-extrabold">
                  Готов начать<br />зарабатывать<br />на своём мнении?
                </h2>
                <p className="mt-6 text-white/75 text-[16px] sm:text-[18px] leading-[1.5] max-w-[420px]">
                  Регистрация займёт несколько минут. Первые опросы доступны сразу после подтверждения.
                </p>
                <Link
                  href="/register?role=RESPONDENT"
                  className="mt-10 inline-flex h-[54px] items-center rounded-[16px] bg-[#E5F667] px-8 text-[16px] font-semibold text-[#1C0C4C] transition-transform hover:scale-[1.02]"
                >
                  Регистрация
                </Link>
              </div>
            </div>

            {/* RIGHT — no RevealOnScroll on outer div */}
            <div className="relative flex items-end justify-center lg:justify-end overflow-hidden min-h-[240px] lg:min-h-[500px]">
              <div className="relative w-full max-w-[600px] h-[240px] lg:h-[500px]">
                <Image
                  src="/Respondent/img_res2.svg"
                  alt="Платформа ПотокМнений"
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
