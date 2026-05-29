import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function CTABottom() {
  return (
    <section className="bg-white px-4 lg:px-6 pb-20">
      <RevealOnScroll>
        <div className="relative overflow-hidden mx-auto max-w-[1600px] rounded-[40px]"
          style={{ background: "linear-gradient(135deg, #6438D9 0%, #3B2C7B 100%)" }}>
          {/* glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -left-20 top-10 w-[420px] h-[420px] rounded-full bg-[#A98BFF]/25 blur-3xl" />
            <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full bg-[#5B21B6]/20 blur-3xl" />
          </div>
          {/* dots */}
          <div className="absolute right-[45%] top-[50px] w-[13px] h-[13px] rounded-full bg-[#E5F667] hidden lg:block" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center">
            {/* LEFT */}
            <div className="px-6 sm:px-10 lg:px-16 pt-14 pb-14 lg:pb-0 lg:min-h-[480px] flex flex-col justify-center">
              <div className="max-w-[520px]">
                <h2 className="font-manrope text-white text-[36px] sm:text-[50px] lg:text-[62px] font-[800] leading-[0.95] tracking-[-2px]">
                  Готовы начать<br />исследование?
                </h2>
                <p className="mt-5 text-white/70 text-[16px] sm:text-[18px] leading-[1.5] max-w-[420px]">
                  Зарегистрируйтесь и запустите первый опрос за 5 минут.
                </p>
                <Link href="/register?role=CLIENT"
                  className="mt-10 inline-flex h-[54px] items-center gap-2 rounded-[16px] bg-[#E5F667] px-8 text-[16px] font-semibold text-[#1C0C4C] transition-transform hover:scale-[1.02]">
                  → Регистрация
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative flex items-end justify-center lg:justify-end overflow-hidden min-h-[200px] lg:min-h-[480px]">
              <div className="relative w-full max-w-[580px] h-[200px] lg:h-[480px]">
                <Image src="/cta.svg" alt="" fill className="object-contain object-bottom" />
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
