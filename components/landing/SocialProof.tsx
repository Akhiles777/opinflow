import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const logos = [
  { src: "/Testimonials2/2MOOD_logo_main-_2_.png", alt: "2MOOD" },
  { src: "/Testimonials2/logo-klient-1-Photoroom.png", alt: "Клиент" },
  { src: "/Testimonials2/logo_black_crop-_1_.png", alt: "Бренд" },
];

const testimonials = [
  {
    text: "Запустили исследование за день вместо обычных двух недель. Данные точные, аналитика понятная.",
    name: "Елизавета Галина",
    role: "Маркетолог",
    initials: "ЕГ",
  },
  {
    text: "Высокое качество данных. Антифрод реально работает — получили чистую выборку с первого запуска.",
    name: "Елена Васильева",
    role: "Product Manager",
    initials: "ЕВ",
  },
  {
    text: "Провели NPS-исследование на 300 респондентов. Результаты готовы за 2 дня, PDF отчёт — в один клик.",
    name: "Дмитрий Ковалёв",
    role: "Директор по маркетингу",
    initials: "ДК",
  },
];

export default function SocialProof() {
  return (
    <section className="bg-[#F5F5F5] py-20 lg:py-28 px-4 lg:px-6">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start">

          {/* LEFT */}
          <div>
            <RevealOnScroll>
              <h2 className="font-manrope text-[36px] sm:text-[48px] lg:text-[58px] font-[800] tracking-[-2px] text-[#1C0C4C] leading-[0.95] mb-8">
                Нам доверяют
              </h2>
            </RevealOnScroll>

            <RevealOnScroll delay={60}>
              <div className="flex flex-wrap gap-5 items-center mb-10">
                {logos.map((l) => (
                  <div key={l.alt} className="rounded-[16px] border border-[#E8E2F5] bg-white px-5 py-4 flex items-center justify-center h-[64px]">
                    <Image src={l.src} alt={l.alt} width={100} height={36} className="object-contain h-8 w-auto grayscale opacity-70" />
                  </div>
                ))}
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-[20px] bg-[#EFEBFF] p-6">
                  <div className="font-manrope text-[44px] font-[800] tracking-[-2px] text-[#6438D9] leading-none">800+</div>
                  <div className="mt-2 text-[14px] text-[#6B5F9E]">исследований проведено</div>
                </div>
                <div className="rounded-[20px] bg-[#EFEBFF] p-6">
                  <div className="font-manrope text-[44px] font-[800] tracking-[-2px] text-[#6438D9] leading-none">15+</div>
                  <div className="mt-2 text-[14px] text-[#6B5F9E]">категорий аудитории</div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={t.name} direction="right" delay={i * 80}>
                <div className="rounded-[20px] bg-white border border-[#E8E2F5] p-5 lg:p-6">
                  <p className="text-[15px] leading-[1.65] text-[#35236B] mb-4">«{t.text}»</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6438D9] text-[12px] font-bold text-white">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#1C0C4C]">{t.name}</div>
                      <div className="text-[12px] text-[#9B8FC9]">{t.role}</div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
