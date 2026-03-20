import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-site-bg px-4 pt-10 pb-20 text-center sm:px-6 sm:pt-12 sm:pb-24 lg:px-8 lg:pt-14 lg:pb-28"
    >
      <GlowOrb size={700} opacity={0.1} className="top-0 left-1/2 -translate-x-1/2 -translate-y-1/4" />

      <div className="relative mx-auto max-w-4xl">
        <RevealOnScroll>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand/25 bg-brand/8 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-pulse" />
            <span className="text-xs font-semibold font-body text-brand-light tracking-wide">
              Платформа маркетинговых исследований
            </span>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <h1 className="font-display text-hero text-site-heading mb-6">
            ПотокМнений — платформа
            <br />
            <span className="bg-gradient-to-r from-brand-dark via-brand to-brand-dark bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
              маркетинговых исследований
            </span>
          </h1>
        </RevealOnScroll>

        <RevealOnScroll delay={160}>
          <p className="text-xl font-body text-site-muted leading-relaxed max-w-2xl mx-auto mb-4">
            ПотокМнений — это онлайн-платформа, которая объединяет бизнес и людей, готовых делиться своим мнением.
          </p>
          <p className="text-base font-body text-site-muted/80 leading-relaxed max-w-3xl mx-auto mb-4">
            Компании получают быстрые и точные данные о своей аудитории, а пользователи — возможность зарабатывать, проходя онлайн-опросы. Мы автоматизировали процесс маркетинговых исследований: от создания опроса до анализа результатов.
          </p>
          <p className="text-base font-body text-site-muted/80 leading-relaxed max-w-2xl mx-auto mb-10">
            А встроенный искусственный интеллект помогает обрабатывать ответы и превращать их в понятные выводы. Без сложных интерфейсов. Без долгих ожиданий. Без посредников.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={240}>
          <div className="mb-16 flex flex-col justify-center gap-4 sm:mb-20 sm:flex-row">
            <Button variant="primary" size="lg">Начать зарабатывать</Button>
            <Button variant="secondary" size="lg">Заказать исследование</Button>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={320}>
          <div className="flex flex-col justify-center gap-10 pt-10 sm:flex-row">
            {[
              { value: "25 000+", label: "активных респондентов" },
              { value: "800+", label: "проведённых исследований" },
              { value: "97%", label: "качество данных" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-body tabular-nums text-3xl font-semibold text-site-heading tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs font-body text-site-muted mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
