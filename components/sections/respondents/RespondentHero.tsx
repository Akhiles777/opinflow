"use client";

import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const checks = [
  "Моментальные выплаты",
  "Более 25 000 респондентов уже с нами",
  "Только проверенные заказчики",
];

export default function RespondentHero() {
  return (
    <section className="px-4 pt-4 lg:px-6 lg:pt-6 bg-[#F5F5F5]">
      <div className="relative overflow-hidden rounded-[40px] bg-[#EFEBFF] min-h-[580px]">

        {/* background pattern */}
        <div className="absolute inset-0">
          <Image src="/bg-img.svg" alt="" fill priority className="object-cover opacity-25" />
        </div>
        <div className="absolute inset-0 bg-white/10" />

        {/* glow left */}
        <div className="absolute left-[-60px] top-[80px] h-[500px] w-[500px] rounded-full bg-[#6438D9]/8 blur-3xl pointer-events-none" />

        {/* decorative dot */}
        <div className="absolute right-[38%] top-[70px] w-[14px] h-[14px] rounded-full bg-[#E5F667] pointer-events-none hidden lg:block" />
        <div className="absolute left-[42%] top-[55%] w-[20px] h-[20px] rounded-full bg-[#D4B0FF]/60 pointer-events-none hidden lg:block" />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pt-10 pb-10 lg:px-16 lg:pt-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">

            {/* LEFT */}
            <div className="max-w-[600px]">
              <RevealOnScroll>
                <h1 className="font-manrope text-[52px] sm:text-[68px] xl:text-[84px] leading-[0.88] tracking-[-4px] font-[800] text-[#1C0C4C]">
                  Зарабатывай
                  <br />
                  на своём мнении
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={100}>
                <p className="mt-6 text-[18px] lg:text-[20px] leading-[1.5] text-[#797691] max-w-[480px]">
                  Регистрируйся, проходи короткие опросы от брендов и получай
                  выплаты на карту, телефон или электронный кошелёк. Без
                  сложных заданий и скрытых условий.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={160}>
                <div className="mt-8">
                  <Link
                    href="/register?role=RESPONDENT"
                    className="inline-flex h-[56px] items-center rounded-[16px] bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)] px-7 text-[17px] font-semibold text-[#1C0C4C] transition-transform hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(217,243,38,0.25)]"
                  >
                    Начать зарабатывать
                  </Link>
                </div>

                <ul className="mt-6 space-y-3">
                  {checks.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[16px] text-[#4A3B7A]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6438D9]/15 text-[#6438D9] text-[11px] font-bold">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </RevealOnScroll>
            </div>

            {/* RIGHT */}
            <RevealOnScroll direction="right" className="flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[560px]">
                <div className="absolute inset-0 rounded-full bg-[#6438D9]/6 blur-[80px] pointer-events-none" />
                <Image
                  src="/Respondent/img_res.svg"
                  alt="Платформа для респондентов"
                  width={560}
                  height={460}
                  priority
                  className="w-full h-auto object-contain drop-shadow-[0_24px_48px_rgba(28,12,76,0.10)]"
                />
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* big orb */}
        <div
          className="absolute bottom-[-50px] right-[-30px] w-[220px] h-[220px] rounded-full pointer-events-none hidden xl:block"
          style={{
            background: "radial-gradient(circle at 30% 30%, #A78BFF, #4C1D95)",
            boxShadow: "0 20px 80px rgba(100,56,217,0.45)",
          }}
        />
      </div>
    </section>
  );
}
