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
      <div
        style={{ position: "relative", overflow: "hidden" }}
        className="rounded-[32px] lg:rounded-[40px] bg-[#EFEBFF] min-h-[560px] lg:min-h-[640px]"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <Image
            src="/Слой9 1.svg"
            alt=""
            fill
            priority
            className="object-cover object-center opacity-25"
          />
        </div>

        {/* Overlays & glows */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none" style={{ zIndex: 0 }} />
        <div className="absolute left-[-80px] top-[60px] h-[500px] w-[500px] rounded-full bg-[#6438D9]/10 blur-[80px] pointer-events-none" style={{ zIndex: 0 }} />
        <div className="absolute right-[-40px] top-[-40px] h-[380px] w-[380px] rounded-full bg-[#B49DFF]/15 blur-[60px] pointer-events-none" style={{ zIndex: 0 }} />

        {/* Decorative dots */}
        <div className="absolute right-[37%] top-[68px] w-[13px] h-[13px] rounded-full bg-[#E5F667] pointer-events-none hidden lg:block" style={{ zIndex: 0 }} />
        <div className="absolute left-[43%] top-[54%] w-[18px] h-[18px] rounded-full bg-[#C4A5FF]/50 pointer-events-none hidden lg:block" style={{ zIndex: 0 }} />

        {/* Big orb bottom right */}
        <div
          className="absolute bottom-[-60px] right-[-40px] w-[240px] h-[240px] rounded-full pointer-events-none hidden xl:block"
          style={{
            background: "radial-gradient(circle at 30% 30%, #B49DFF, #5B21B6)",
            boxShadow: "0 20px 80px rgba(100,56,217,0.35)",
            zIndex: 0,
          }}
        />

        {/* Small yellow orb top right */}
        <div
          className="absolute top-[16px] right-[90px] w-[36px] h-[36px] rounded-full pointer-events-none hidden lg:block"
          style={{ background: "radial-gradient(circle, #E5F667, #C8E000)", zIndex: 0 }}
        />

        {/* Main content */}
        <div
          style={{ position: "relative", zIndex: 10 }}
          className="mx-auto max-w-[1400px] px-6 pt-10 pb-12 lg:px-16 lg:pt-14 lg:pb-10"
        >
          {/* Two-column flex — inline styles to prevent RevealOnScroll interference */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            {/* LEFT column */}
            <div style={{ width: "100%", flexShrink: 0 }} className="lg:w-[50%] lg:max-w-[50%]">
              <RevealOnScroll>
                <h1 className="font-manrope text-[52px] sm:text-[64px] xl:text-[80px] leading-[0.92] tracking-[-3px] font-[800] text-[#1C0C4C]">
                  Зарабатывай
                  <br />
                  <span className="text-[#6438D9]">на своём</span>
                  <br />
                  мнении
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={100}>
                <p className="mt-6 text-[17px] lg:text-[19px] leading-[1.55] text-[#6B5F9E] max-w-[460px]">
                  Регистрируйся, проходи короткие опросы от брендов и получай
                  выплаты на карту, телефон или электронный кошелёк. Без
                  сложных заданий и скрытых условий.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={160}>
                <div className="mt-8">
                  <Link
                    href="/register?role=RESPONDENT"
                    className="inline-flex h-[52px] items-center gap-2 rounded-[14px] bg-[#6438D9] px-7 text-[16px] font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[#5530C4] hover:shadow-[0_8px_24px_rgba(100,56,217,0.30)] active:scale-[0.99]"
                  >
                    <span className="text-[20px] font-light leading-none">+</span>
                    Начать зарабатывать
                  </Link>
                </div>

                <ul className="mt-7 space-y-[10px]">
                  {checks.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-[15px] lg:text-[16px] text-[#4A3B7A] font-medium"
                    >
                      <span className="flex-shrink-0 text-[#6438D9] text-[15px]">✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </RevealOnScroll>
            </div>

            {/* RIGHT column — overflow hidden, fixed width, no RevealOnScroll on outer div */}
            <div
              style={{
                width: "100%",
                flexShrink: 0,
                overflow: "hidden",
                maxWidth: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="lg:w-[50%] lg:max-w-[50%] lg:justify-end"
            >
              <RevealOnScroll direction="right" className="w-full">
                <div style={{ overflow: "hidden", maxWidth: "100%", position: "relative" }}>
                  <div className="absolute inset-0 rounded-full bg-[#6438D9]/6 blur-[70px] pointer-events-none" />
                  <Image
                    src="/Respondent/img_res.svg"
                    alt="Платформа для респондентов"
                    width={560}
                    height={460}
                    priority
                    style={{ width: "100%", height: "auto", display: "block" }}
                    className="object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(28,12,76,0.10)]"
                  />
                </div>
              </RevealOnScroll>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
