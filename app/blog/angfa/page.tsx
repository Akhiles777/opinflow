import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Как ANGFA сэкономил 5 000 000 ₽ до первого запуска в России — ПотокМнений",
  description:
    "Японский бренд вышел на российский рынок за 4 месяца вместо прогнозируемых 12 — благодаря структурированным опросам 6000+ респондентов до старта продаж.",
};

export default function AngfaCasePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#1C0C4C]">
      <Header />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6438D9] transition-colors hover:text-[#4E28B5] dark:text-[#A98BFF] dark:hover:text-white"
        >
          ← На главную
        </Link>

        {/* ── Header ── */}
        <div className="mt-8">
          <span className="inline-block rounded-full bg-[#EAF45D] px-3 py-1 text-[12px] font-semibold text-[#1C0C4C]">
            Кейс
          </span>
          <h1 className="mt-4 text-[36px] font-semibold leading-[1.0] tracking-[-0.05em] text-[#24115D] dark:text-white sm:text-[48px] lg:text-[56px]">
            Без проб и ошибок: как исследование на&nbsp;«ПотокМнений» сэкономило японскому бренду ANGFA&nbsp;более 5&nbsp;млн рублей до&nbsp;первого запуска в&nbsp;России
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#EDE8F8] pt-6 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#A67EFF_0%,#6D43E5_100%)] text-[14px] font-semibold text-white">
                ЛВ
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#24115D] dark:text-white">Ливенцев В.В.</p>
                <p className="text-[13px] text-[#8A80A8] dark:text-white/50">CMO ANGFA в России и СНГ</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#8A80A8] dark:text-white/40">
              <span>5 мин чтения</span>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Image
                  src="/Testimonials2/logo-white (1).png"
                  alt="ANGFA"
                  width={60}
                  height={22}
                  className="h-5 w-auto object-contain opacity-60 dark:invert"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Lead ── */}
        <p className="mt-10 text-[18px] font-medium leading-[1.65] tracking-[-0.01em] text-[#35236B] dark:text-white/80 sm:text-[20px]">
          Когда японский бренд впервые выходит на российский рынок, первое, что слышишь: «Готовьтесь к году тестов». Готовьте бюджет на нереализованные остатки, на «незашедшие» креативы, на адаптацию цен после трёх проваленных кварталов. Мы в&nbsp;ANGFA решили пойти другим путём. Вместо того чтобы тратить деньги на&nbsp;рынке, мы потратили их на&nbsp;разговор с&nbsp;рынком.
        </p>

        {/* ── Body ── */}
        <div className="prose-custom mt-10 space-y-8 text-[#35236B] dark:text-white/75">

          <Section title="Россия — не просто «ещё одна география»">
            <p>
              У бренда сильные позиции в Азии, отлаженная система продаж и безупречная репутация в сфере ухода за волосами и кожей головы. Но Россия диктует свои правила: другая чувствительность к цене, иные приоритеты в уходе, свои площадки для принятия решений и свои «боли», которые японские стандарты не учитывали автоматически.
            </p>
            <p>
              Ввозить весь каталог «вслепую» — это лотерея. А лотерея в маркетинге — это всегда налог на непрофессионализм. Мы знали: чтобы не сжечь бюджет на адаптацию постфактум, нужно принять стратегические решения до того, как первый контейнер пересечёт границу.
            </p>
          </Section>

          <Section title="Инструмент: живые опросы вместо кабинетных гипотез">
            <p>
              За 6 месяцев до старта мы запустили масштабное исследование целевой аудитории на платформе «ПотокМнений». Не фокус-группы с заученными ответами, не вторичную аналитику, а структурированные опросы среди <strong className="text-[#24115D] dark:text-white">6000+ респондентов</strong>, которые регулярно покупают уходовую косметику в России.
            </p>
            <p>Мы спрашивали не «нравится ли вам Япония?», а:</p>
            <ul>
              <li>За какую конкретную проблему волос/кожи головы вы готовы платить 8 000 ₽ вместо 800 ₽?</li>
              <li>Какой формат упаковки и объём вам удобнее хранить и использовать?</li>
              <li>Где вы ищете отзывы перед покупкой косметики?</li>
              <li>Какая коммуникация вызывает доверие, а какая воспринимается как «рекламный шум»?</li>
            </ul>
          </Section>

          <Section title="Три решения, которые изменили запуск">
            <h3>1. Матрица продуктов: фокус вместо «всего и сразу»</h3>
            <p>
              Данные чётко показали: 40% японского ассортимента в России окажется нишевым или избыточным. Мы убрали линейки, которые не решали острых запросов, и сделали ставку на уход за кожей головы, мягкое очищение и концентрированные сыворотки. Именно эти категории закрывали реальные жалобы российских потребителей на жёсткую воду, сезонную ломкость и стресс-выпадение. Ассортимент стал уже, но значительно релевантнее.
            </p>
            <h3>2. Ценовая политика: зона «честной ценности»</h3>
            <p>
              Исследование выявило психологический потолок и точки, где рост цены перестаёт конвертироваться в восприятие качества. Мы выстроили трёхуровневую линейку:
            </p>
            <ul>
              <li><strong className="text-[#24115D] dark:text-white">Доступная</strong> — продукт для безопасного знакомства с брендом</li>
              <li><strong className="text-[#24115D] dark:text-white">Ядро</strong> с оптимальной маржой и частотой повторных покупок</li>
              <li><strong className="text-[#24115D] dark:text-white">Премиум-форматы</strong> для лояльной аудитории, готовой инвестировать в результат</li>
            </ul>
            <p>
              Это позволило избежать двух крайностей: «слишком дорого для первого контакта» и «дешевизны, размывающей японскую репутацию».
            </p>
            <h3>3. Стратегия контакта и источники трафика</h3>
            <p>
              Вместо размытого «продвигаться везде» мы получили точную карту принятия решений: <strong className="text-[#24115D] dark:text-white">68% покупателей</strong> изучали разборы в Telegram-каналах и в СМИ, <strong className="text-[#24115D] dark:text-white">54%</strong> совершали покупку в интернете, а микро-эксперты (трихологи, косметологи с 10–50 тыс. подписчиков) давали в 2,5–3 раза выше лояльность, чем крупные блогеры. Мы перераспределили медиабюджет ещё до первого потраченного рубля.
            </p>
          </Section>

          {/* Highlight block */}
          <div className="rounded-[28px] bg-[#EAF45D] px-7 py-8 dark:bg-[#D9F326]">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#5A6300]">Итог</p>
            <p className="mt-3 text-[24px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#1C0C4C] sm:text-[30px]">
              Запуск за 4 месяца и экономия более 5 000 000 ₽
            </p>
            <p className="mt-4 text-[16px] leading-[1.65] text-[#2E3500]">
              Мы вошли в рынок за 4 месяца вместо прогнозируемых 12. Ассортимент встал на полки сразу в нужном объёме. Цена воспринималась как «справедливая за качество». По нашим внутренним расчётам, мы сэкономили более 5 000 000 ₽, которые обычно уходят на тестовые завозы, перемаркировку, неудачные рекламные спринты и складские издержки. Эти деньги мы направили на экспертный контент, работу с профессиональным комьюнити и программу удержания первых покупателей.
            </p>
          </div>

          <Section title="Что вынесем для себя и для коллег">
            <p>
              Маркетинг — это система. «ПотокМнений» дал нам не просто цифры, а язык, на котором говорит наша аудитория. Мы не привезли в Россию «японский каталог». Мы привезли решение конкретных запросов, упакованное в философию ANGFA.
            </p>
            <p>
              Если вы планируете выход на новый рынок или запуск новой линейки — не спешите с контейнерами, билбордами и масштабными медиапланами. Сначала задайте правильные вопросы. Рынок ответит. А ваш бюджет, команда и первые клиенты скажут спасибо.
            </p>
          </Section>
        </div>

        {/* ── Author quote ── */}
        <div className="mt-12 rounded-[28px] border border-[#D8CEF5] bg-[#F5F2FF] dark:border-white/12 dark:bg-white/5 p-7">
          <p className="text-[17px] leading-[1.65] text-[#35236B] dark:text-white/80">
            «ПотокМнений» дал нам не просто цифры, а язык, на котором говорит наша аудитория.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#A67EFF_0%,#6D43E5_100%)] text-[16px] font-semibold text-white">
              ЛВ
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#24115D] dark:text-white">Ливенцев В.В.</p>
              <p className="text-[13px] text-[#8A80A8] dark:text-white/50">CMO ANGFA в России и СНГ</p>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-[28px] bg-[#1C0C4C] px-8 py-10 text-center dark:bg-white/8">
          <p className="text-[22px] font-semibold text-white sm:text-[26px]">
            Готовы исследовать аудиторию до&nbsp;старта?
          </p>
          <p className="max-w-md text-[15px] leading-relaxed text-white/65">
            Запустите первый опрос на «ПотокМнений» — от 500 ответов за 24 часа.
          </p>
          <Link
            href="/register"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-[14px] border border-[#D7EC3A] bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)] px-8 text-[15px] font-semibold text-[#1C0C4C] transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(217,243,38,0.25)]"
          >
            Начать бесплатно
          </Link>
        </div>

        <div className="mt-10">
          
        </div>
      </article>
      <Footer />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.03em] text-[#24115D] dark:text-white sm:text-[26px]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[16px] leading-[1.7] [&_h3]:mt-5 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-[#24115D] [&_h3]:dark:text-white [&_li]:ml-5 [&_li]:list-disc [&_li]:text-[15px] [&_ul]:mt-3 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}
