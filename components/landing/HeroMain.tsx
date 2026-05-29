"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroMain() {
  const [tab, setTab] = useState<"business" | "respondent">("business");

  return (
    <section className="bg-[#F5F5F5] px-4 pt-4 lg:px-6 lg:pt-6">
      <div className="relative overflow-hidden rounded-[40px] bg-[#EFEBFF] min-h-[580px] lg:min-h-[640px]">

        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <Image src="/Слой9 1.svg" alt="" fill className="object-cover object-center opacity-20" />
        </div>

        {/* Glow blobs */}
        <div className="absolute left-[-80px] top-[40px] h-[500px] w-[500px] rounded-full bg-[#6438D9]/10 blur-[80px] pointer-events-none" />
        <div className="absolute right-[-40px] top-[-40px] h-[380px] w-[380px] rounded-full bg-[#B49DFF]/15 blur-[60px] pointer-events-none" />

        {/* Decorative dots */}
        <div className="absolute right-[38%] top-[60px] w-[13px] h-[13px] rounded-full bg-[#E5F667] hidden lg:block" />
        <div className="absolute left-[44%] top-[52%] w-[16px] h-[16px] rounded-full bg-[#C4A5FF]/50 hidden lg:block" />

        {/* Big purple orb */}
        <div className="absolute bottom-[-70px] right-[-50px] w-[220px] h-[220px] rounded-full hidden xl:block"
          style={{ background: "radial-gradient(circle at 30% 30%, #B49DFF, #5B21B6)", boxShadow: "0 20px 80px rgba(100,56,217,0.35)" }} />

        {/* Tab switcher */}
        <div className="relative z-20 flex justify-center pt-10">
          <div className="inline-flex rounded-full bg-white/60 backdrop-blur-sm p-1 gap-1 border border-white/80 shadow-sm">
            {(["business", "respondent"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`rounded-full px-5 py-2 text-[14px] font-semibold transition-all duration-200 ${
                  tab === t ? "bg-white shadow-md text-[#1C0C4C]" : "text-[#6B5F9E] hover:text-[#1C0C4C]"
                }`}>
                {t === "business" ? "Бизнесу" : "Респондентам"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-10 lg:px-16 lg:py-12">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-12">

            {/* LEFT */}
            <div className="w-full lg:w-1/2 lg:flex-shrink-0">
              {tab === "business" ? (
                <>
                  <h1 className="font-manrope text-[48px] sm:text-[60px] xl:text-[72px] leading-[0.93] tracking-[-3px] font-[800] text-[#1C0C4C]">
                    Маркетинговые<br />
                    исследования{" "}
                    <span className="relative inline-block">
                      <span className="relative z-10">за 5 минут</span>
                      <span className="absolute inset-x-0 bottom-[2px] h-[40%] bg-[#E5F667]/70 rounded-sm -z-0" />
                    </span>
                    ,<br />а не 5 недель
                  </h1>
                  <p className="mt-6 text-[17px] lg:text-[19px] leading-[1.55] text-[#6B5F9E] max-w-[480px]">
                    Создайте опрос, выберите аудиторию и получите результаты с ИИ-аналитикой. 25 000+ проверенных респондентов.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/register?role=CLIENT"
                      className="inline-flex h-[52px] items-center gap-2 rounded-[14px] bg-[#6438D9] px-7 text-[16px] font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[#5530C4] hover:shadow-[0_8px_24px_rgba(100,56,217,0.30)]">
                      Запустить исследование
                    </Link>
                    <Link href="/register?role=CLIENT"
                      className="inline-flex h-[52px] items-center rounded-[14px] border border-[#6438D9]/40 bg-white/60 px-7 text-[16px] font-semibold text-[#6438D9] transition-all hover:bg-white">
                      Запросить демо
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="font-manrope text-[48px] sm:text-[60px] xl:text-[72px] leading-[0.93] tracking-[-3px] font-[800] text-[#1C0C4C]">
                    Зарабатывай<br />
                    <span className="text-[#6438D9]">на своём</span><br />
                    мнении
                  </h1>
                  <p className="mt-6 text-[17px] lg:text-[19px] leading-[1.55] text-[#6B5F9E] max-w-[460px]">
                    Проходи короткие опросы от брендов и получай выплаты на карту или СБП. Без скрытых условий.
                  </p>
                  <div className="mt-8">
                    <Link href="/register?role=RESPONDENT"
                      className="inline-flex h-[52px] items-center gap-2 rounded-[14px] bg-[#6438D9] px-7 text-[16px] font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[#5530C4] hover:shadow-[0_8px_24px_rgba(100,56,217,0.30)]">
                      <span className="text-[20px] font-light">+</span> Начать зарабатывать
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT — no RevealOnScroll on outer */}
            <div style={{ width: "100%", flexShrink: 0, overflow: "hidden", maxWidth: "100%" }}
              className="lg:w-1/2 flex items-center justify-center lg:justify-end">
              <div style={{ overflow: "hidden", maxWidth: "100%", position: "relative" }}>
                <Image
                  src={tab === "business" ? "/img.svg" : "/Respondent/img_res.svg"}
                  alt=""
                  width={560}
                  height={480}
                  priority
                  style={{ width: "100%", height: "auto", display: "block" }}
                  className="object-contain drop-shadow-[0_20px_40px_rgba(28,12,76,0.10)]"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
