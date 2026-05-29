import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const plans = [
  {
    name: "Basic",
    price: "от 50₽",
    per: "за респондента",
    features: ["До 100 респондентов на опрос", "Базовая аналитика", "Конструктор опросов", "Стандартная модерация"],
    cta: "Выбрать план",
    href: "/register?role=CLIENT",
    featured: false,
  },
  {
    name: "Pro",
    price: "от 45₽",
    per: "за респондента",
    features: ["До 500 респондентов", "ИИ-аналитика открытых ответов", "PDF отчёты", "Приоритетная модерация"],
    cta: "Выбрать план",
    href: "/register?role=CLIENT",
    featured: true,
    badge: "Популярный",
  },
  {
    name: "Enterprise",
    price: "Индивидуально",
    per: "",
    features: ["Без ограничений", "Всё из Pro", "Персональный менеджер"],
    cta: "Связаться",
    href: "/register?role=CLIENT",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section className="bg-white py-20 lg:py-28 px-4 lg:px-6">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-10">
        <RevealOnScroll>
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-manrope text-[36px] sm:text-[50px] lg:text-[62px] font-[800] tracking-[-2px] text-[#1C0C4C] leading-[0.95]">
              Прозрачные тарифы для любых задач
            </h2>
            <p className="mt-4 text-[16px] lg:text-[18px] text-[#6B5F9E] max-w-[480px] mx-auto leading-[1.6]">
              Платите только за реальные ответы
            </p>
          </div>
        </RevealOnScroll>

        <div className="relative overflow-hidden rounded-[40px] p-6 sm:p-8 lg:p-10"
          style={{ background: "linear-gradient(135deg, #6438D9 0%, #3B2C7B 60%, #1C0C4C 100%)" }}>
          {/* glows */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -left-20 top-10 w-[400px] h-[400px] rounded-full bg-[#A98BFF]/20 blur-3xl" />
            <div className="absolute right-0 bottom-0 w-[400px] h-[400px] rounded-full bg-[#5B21B6]/30 blur-3xl" />
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
            {plans.map((plan, i) => (
              <RevealOnScroll key={plan.name} delay={i * 80}>
                <div className={`rounded-[24px] p-6 lg:p-7 flex flex-col h-full ${
                  plan.featured
                    ? "bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                    : "border bg-white/8 backdrop-blur-sm"
                }`}
                  style={plan.featured ? {} : { borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.08)" }}>
                  {plan.featured && plan.badge && (
                    <div className="inline-flex mb-4 self-start rounded-full bg-[#E5F667] px-3 py-1 text-[12px] font-bold text-[#1C0C4C]">
                      {plan.badge}
                    </div>
                  )}
                  <div className={`text-[15px] font-semibold mb-2 ${plan.featured ? "text-[#6B5F9E]" : "text-white/60"}`}>{plan.name}</div>
                  <div className={`font-manrope text-[32px] font-[800] tracking-[-1px] leading-none mb-1 ${plan.featured ? "text-[#1C0C4C]" : "text-white"}`}>
                    {plan.price}
                  </div>
                  {plan.per && <div className={`text-[13px] mb-6 ${plan.featured ? "text-[#6B5F9E]" : "text-white/50"}`}>{plan.per}</div>}
                  {!plan.per && <div className="mb-6" />}
                  <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2 text-[14px] leading-[1.4] ${plan.featured ? "text-[#1C0C4C]" : "text-white/80"}`}>
                        <span className={`mt-0.5 text-[16px] shrink-0 ${plan.featured ? "text-[#6438D9]" : "text-[#E5F667]"}`}>✦</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}
                    className={`mt-auto inline-flex h-[48px] items-center justify-center rounded-[14px] text-[15px] font-semibold transition-all ${
                      plan.featured
                        ? "bg-[#6438D9] text-white hover:bg-[#5530C4]"
                        : "border border-white/30 text-white hover:bg-white/10"
                    }`}>
                    {plan.cta}
                  </Link>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
