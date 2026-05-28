"use client";
import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const steps = [
  { num: "01", title: "Зарегистрируйся за 1 минуту", desc: "Укажи имя, почту и создай пароль", lime: false },
  { num: "02", title: "Заполни информацию о себе", desc: "Никаких сложных анкет", lime: false },
  { num: "03", title: "Проходи опросы в удобное время", desc: "Получай уведомления о новых опросах, которые подходят твоему профилю", lime: false },
  { num: "04", title: "Получай деньги на счёт", desc: "Выводи заработанное на карту, телефон или электронный кошелёк", lime: true },
];

export default function RespondentSteps() {
  return (
    <section className="bg-white px-4 py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-6">
        <RevealOnScroll>
          <h2 className="font-manrope text-[38px] sm:text-[52px] lg:text-[68px] leading-[0.93] tracking-[-0.04em] font-extrabold text-[#1C0C4C] mb-12 lg:mb-16">
            4 простых шага
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_480px] lg:items-center">

          {/* STEPS 2×2 GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map((step, i) => (
              <RevealOnScroll key={step.num} delay={i * 70}>
                <div className={`rounded-[28px] p-6 lg:p-8 flex flex-col min-h-[200px] ${step.lime ? "bg-[#E5F667]" : "border border-[#E4DEF7] bg-[#FAFBFF]"}`}>
                  <div className={`text-[12px] font-bold tracking-[0.1em] mb-4 ${step.lime ? "text-[#1C0C4C]/50" : "text-[#6438D9]/40"}`}>
                    {step.num}
                  </div>
                  <div className="text-[18px] lg:text-[21px] font-semibold leading-[1.2] mb-3 text-[#1C0C4C]">
                    {step.title}
                  </div>
                  <p className={`text-[14px] lg:text-[15px] leading-[1.55] mt-auto ${step.lime ? "text-[#1C0C4C]/65" : "text-[#797691]"}`}>
                    {step.desc}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* LAPTOP ILLUSTRATION — no RevealOnScroll on outer div */}
          <div className="flex items-center justify-center lg:justify-end">
            <RevealOnScroll direction="right">
              <div className="relative w-full max-w-[480px]">
                <div className="absolute inset-0 rounded-full bg-[#6438D9]/6 blur-[70px] pointer-events-none" />
                <Image
                  src="/Respondent/img_res2.svg"
                  alt="Как работает платформа"
                  width={480}
                  height={420}
                  style={{ width: "100%", height: "auto" }}
                  className="object-contain relative z-10"
                />
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </div>
    </section>
  );
}
