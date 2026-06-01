"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

type ReviewItem = {
  id: string;
  brand: string;
  text: string;
  name: string;
  role: string;
  company: string;
  initials: string;
};

type CaseSlide = {
  id: string;
  brand: string;
  titleBefore: string;
  highlight: string;
  titleAfter: string;
  summary: string;
  result: string;
  extended?: React.ReactNode;
  logo?: string;
  logoAlt?: string;
  caseUrl?: string;
  quote: string;
  quoteName: string;
  quoteRole: string;
  quoteCompany: string;
};

const reviewCards: ReviewItem[] = [
  {
    id: "eyfel",
    brand: "EYFEL",
    text: "Контакт с аудиторией всегда у нас был вслепую, пока мы не решили сначала изучить реальные запросы аудитории, а не полагаться на внутренние гипотезы. Благодаря структурированным опросам мы точно поняли, какой посыл, акция и формат подачи информации действительно важны для нашей ЦА. Это позволило выстроить коммуникацию на языке потребителя.",
    name: "Хвостов М.Р.",
    role: "Маркетолог",
    company: "EYFEL",
    initials: "ХМ",
  },
  {
    id: "alluri",
    brand: "ALLURI",
    text: "Разрабатывая отдельный бренд специально под логику маркетплейсов, мы сразу поняли: здесь побеждает не только качество, но и точное соответствие алгоритмам выбора покупателя. Предварительное исследование дало нам чёткую картину того, как люди смотрят карточки, какие формулировки в составе ищут и на каком этапе принимают решение о корзине. Мы сформировали ассортимент, упаковку и цену строго под требования аудитории. Запуск прошёл гладко, потому что мы всё знали заранее.",
    name: "Хегай И.В.",
    role: "Бренд-менеджер",
    company: "ALLURI",
    initials: "ХИ",
  },
  {
    id: "angfa",
    brand: "ANGFA",
    text: "Мы заранее протестировали гипотезы запуска и поняли, какие барьеры мешают покупке, какие формулировки вызывают доверие и как должен выглядеть первый продукт для локального рынка. Это дало возможность сократить риск дорогих ошибок до старта продаж.",
    name: "Ливенцев В.В.",
    role: "CMO ANGFA в России и СНГ",
    company: "ANGFA",
    initials: "ЛВ",
  },
];

const angfaExtended = (
  <div className="mt-6 space-y-5 border-t border-[#D0C7EE]/60 pt-6 dark:border-white/10">
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#8A80A8] dark:text-white/40">
        Инструмент
      </p>
      <p className="mt-2 text-[15px] leading-[1.65] text-[#4F417A] dark:text-white/65">
        За 6 месяцев до старта мы запустили опросы среди{" "}
        <strong className="text-[#24115D] dark:text-white">6&nbsp;000+ респондентов</strong>,
        регулярно покупающих уходовую косметику в России. Спрашивали не «нравится ли вам Япония?»,
        а конкретно: за какую проблему волос готовы платить 8&nbsp;000&nbsp;₽ вместо 800&nbsp;₽,
        где ищут отзывы, какая упаковка удобнее.
      </p>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        { label: "Матрица продуктов", text: "Убрали 40% ассортимента, нерелевантного рынку — сделали ставку на то, что закрывает реальные запросы." },
        { label: "Ценовая политика", text: "Три уровня: доступная, ядро и премиум — без крайностей «слишком дорого» и «размывает репутацию»." },
        { label: "Стратегия контакта", text: "68% покупателей изучают разборы в Telegram. Перераспределили медиабюджет до первого рубля." },
      ].map(({ label, text }) => (
        <div key={label} className="rounded-[18px] bg-white/50 p-4 dark:bg-white/5">
          <p className="text-[13px] font-semibold text-[#24115D] dark:text-white">{label}</p>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-[#4F417A] dark:text-white/55">{text}</p>
        </div>
      ))}
    </div>
    <p className="text-[14px] leading-[1.65] text-[#4F417A] dark:text-white/60">
      Маркетинг — это система. «ПотокМнений» дал нам не просто цифры, а язык, на котором говорит
      наша аудитория. Мы не привезли «японский каталог» — мы привезли решение конкретных запросов.
    </p>
  </div>
);

const slides: CaseSlide[] = [
  {
    id: "angfa",
    brand: "ANGFA",
    titleBefore: "Как бренд ANGFA сэкономил",
    highlight: "5 000 000 ₽",
    titleAfter: "до первого запуска в России",
    summary:
      "До вывода бренда на рынок команда проверила упаковку, ожидания аудитории и сценарии выбора товара. Исследование помогло сократить число дорогих гипотез ещё до закупок и производства.",
    result: "Итог: запуск за 4 месяца и экономия более 5 000 000 ₽.",
    extended: angfaExtended,
    logo: "/Testimonials2/logo-white (1).png",
    logoAlt: "ANGFA",
    caseUrl: "/blog/angfa",
    quote:
      "Без проб и ошибок: сначала мы собрали ответы аудитории, а уже потом принимали решения по продукту и коммуникации. Это сняло лишние расходы на тесты вслепую и ускорило выход на рынок.",
    quoteName: "Ливенцев В.В.",
    quoteRole: "CMO ANGFA в России и СНГ",
    quoteCompany: "ANGFA",
  },
  {
    id: "alluri",
    brand: "ALLURI",
    titleBefore: "Как бренд ALLURI собрал",
    highlight: "точную продуктовую матрицу",
    titleAfter: "до выхода на маркетплейсы",
    summary:
      "Команда заранее выяснила, как покупатели читают карточки, на что смотрят в составе и какие обещания действительно влияют на решение о покупке.",
    result: "Итог: запуск прошёл без хаотичных переработок карточек и цены.",
    extended: (
      <div className="mt-6 space-y-4 border-t border-[#D0C7EE]/60 pt-6 dark:border-white/10">
        <p className="text-[15px] leading-[1.65] text-[#4F417A] dark:text-white/65">
          Предварительное исследование дало чёткую картину: как люди смотрят карточки, какие
          формулировки в составе ищут и на каком этапе принимают решение о корзине. Ассортимент,
          упаковка и цена были выстроены строго под требования аудитории — ещё до первой поставки.
        </p>
        <p className="text-[14px] leading-[1.6] text-[#4F417A] dark:text-white/55">
          Запуск прошёл гладко, потому что ключевые решения были приняты заранее, а не после первых
          ошибок на живом рынке.
        </p>
      </div>
    ),
    quote:
      "Мы сформировали ассортимент, упаковку и цену строго под требования аудитории. Запуск прошёл гладко, потому что ключевые решения были приняты заранее, а не после первых ошибок.",
    quoteName: "Хегай И.В.",
    quoteRole: "Бренд-менеджер",
    quoteCompany: "ALLURI",
  },
  {
    id: "eyfel",
    brand: "EYFEL",
    titleBefore: "Как EYFEL нашёл",
    highlight: "язык аудитории",
    titleAfter: "и усилил рекламную коммуникацию",
    summary:
      "Опросы помогли команде перейти от внутренних гипотез к понятным сигналам рынка: какие акции воспринимаются лучше, какой посыл работает и что действительно важно покупателю.",
    result: "Итог: коммуникация стала точнее и ближе к реальному запросу ЦА.",
    extended: (
      <div className="mt-6 space-y-4 border-t border-[#D0C7EE]/60 pt-6 dark:border-white/10">
        <p className="text-[15px] leading-[1.65] text-[#4F417A] dark:text-white/65">
          До исследования команда полагалась на внутренние гипотезы. После — получила конкретные
          данные: какой посыл вызывает доверие, какой формат акции воспринимается как выгода, а не
          как манипуляция. Реклама заговорила на языке потребителя.
        </p>
        <p className="text-[14px] leading-[1.6] text-[#4F417A] dark:text-white/55">
          Структурированные опросы дали то, что не могут дать внутренние совещания: прямую речь
          аудитории без фильтров.
        </p>
      </div>
    ),
    logo: "/Testimonials2/logo_black_crop.svg",
    logoAlt: "EYFEL",
    quote:
      "Благодаря структурированным опросам мы точно поняли, какой посыл, акция и формат подачи информации действительно важны для нашей ЦА. Это позволило выстроить коммуникацию на языке потребителя.",
    quoteName: "Хвостов М.Р.",
    quoteRole: "Маркетолог",
    quoteCompany: "EYFEL",
  },
];

type MosaicTile =
  | { kind: "logo"; src: string; alt: string; lightBg: string; darkBg: string; lightImgClass: string; invertOnDark?: boolean }
  | { kind: "metric"; top: string; bottom: string; badge: string; lightBg: string; darkBg: string; topClass: string; badgeClass?: string }
  | { kind: "symbol"; label: string; lightBg: string; darkBg: string; lightText: string; darkText: string };

const mosaicTiles: MosaicTile[] = [
  {
    kind: "logo",
    src: "/Testimonials2/2MOOD_logo_main-_2_.png",
    alt: "2MOOD",
    lightBg: "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center p-3",
    darkBg: "rounded-[28px] bg-white/10 flex items-center justify-center p-3",
    lightImgClass: "h-full max-h-[60px] w-full object-contain opacity-85",
  },
  {
    kind: "logo",
    src: "/Testimonials2/logo-klient-1-Photoroom.png",
    alt: "Natura Siberica",
    lightBg: "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center p-3",
    darkBg: "rounded-[28px] bg-white/10 flex items-center justify-center p-3",
    lightImgClass: "h-full max-h-[68px] w-full object-contain opacity-90",
  },
  {
    kind: "metric",
    top: "800+",
    bottom: "исследований проведено",
    badge: "◎",
    lightBg: "row-span-2 rounded-[32px] bg-[#EEF67C] p-5 sm:p-6 flex flex-col justify-between",
    darkBg: "row-span-2 rounded-[32px] bg-[#D9F326] p-5 sm:p-6 flex flex-col justify-between",
    topClass: "text-[#1C0C4C]",
  },
  {
    kind: "logo",
    src: "/Testimonials2/fc3816fd-7346-48d2-948d-4e69bee035a3 (1).png",
    alt: "Sammy Beauty",
    lightBg: "rounded-[28px] bg-[#EEF67C] flex items-center justify-center p-3",
    darkBg: "rounded-[28px] bg-[#D9F326] flex items-center justify-center p-3",
    lightImgClass: "h-full max-h-[74px] w-full object-contain",
  },
  {
    kind: "logo",
    src: "/Testimonials2/logo_black_crop.svg",
    alt: "EYFEL",
    lightBg: "rounded-[28px] border border-[#D8CEF5] bg-white flex items-center justify-center p-3",
    darkBg: "rounded-[28px] border border-white/15 bg-white/10 flex items-center justify-center p-3",
    lightImgClass: "h-full max-h-[62px] w-full object-contain opacity-80",
    invertOnDark: true,
  },
  {
    kind: "metric",
    top: "15+",
    bottom: "компаний уже с нами",
    badge: "+",
    lightBg: "row-span-2 rounded-[32px] bg-[#ECE5FA] p-5 sm:p-6 flex flex-col justify-between",
    darkBg: "row-span-2 rounded-[32px] bg-white/10 p-5 sm:p-6 flex flex-col justify-between",
    topClass: "text-[#6947DF] dark:text-[#A98BFF]",
    badgeClass: "bg-[linear-gradient(180deg,#9A73FF_0%,#6E42E5_100%)] text-white",
  },
  {
    kind: "logo",
    src: "/Testimonials2/__ (1)-Photoroom.png",
    alt: "Gamma D'oro",
    lightBg: "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center p-3",
    darkBg: "rounded-[28px] bg-white/10 flex items-center justify-center p-3",
    lightImgClass: "h-full max-h-[72px] w-full object-contain opacity-85",
  },
  {
    kind: "logo",
    src: "/Testimonials2/krjx4LhlKer_zPTk7-JGVWgNMyvS7kEIZZ_KfeTnrXsN74ytEn6OglOntuD0o9r4i6BtOIqHnwzENfWuTUCOPO4j (1)-Photoroom.png",
    alt: "La'Venti",
    lightBg: "rounded-[28px] border border-[#D8CEF5] bg-white flex items-center justify-center p-3",
    darkBg: "rounded-[28px] border border-white/15 bg-white/10 flex items-center justify-center p-3",
    lightImgClass: "h-full max-h-[72px] w-full object-contain opacity-85",
  },
  {
    kind: "symbol",
    label: "S.",
    lightBg: "rounded-[28px] bg-[#EEF67C] flex items-center justify-center text-[44px] font-semibold tracking-[-0.08em]",
    darkBg: "rounded-[28px] bg-[#D9F326] flex items-center justify-center text-[44px] font-semibold tracking-[-0.08em]",
    lightText: "text-[#7B7396]",
    darkText: "text-[#1C0C4C]",
  },
  {
    kind: "symbol",
    label: "+7",
    lightBg: "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center text-[36px] font-medium tracking-[-0.06em]",
    darkBg: "rounded-[28px] bg-white/10 flex items-center justify-center text-[36px] font-medium tracking-[-0.06em]",
    lightText: "text-[#8D84A7]",
    darkText: "text-white/60",
  },
];

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Предыдущий отзыв" : "Следующий отзыв"}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D8CEF5] bg-white text-[#2C1A67] dark:border-white/20 dark:bg-white/10 dark:text-white transition-all duration-200 hover:border-[#B9ACEC] hover:bg-[#F7F4FF] dark:hover:border-white/35 dark:hover:bg-white/18"
    >
      <span className="text-[20px] leading-none">{direction === "prev" ? "‹" : "›"}</span>
    </button>
  );
}

function ReviewAvatar({ item }: { item: ReviewItem }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#A67EFF_0%,#6D43E5_100%)] text-[18px] font-semibold tracking-[-0.04em] text-white shrink-0">
      {item.initials}
    </div>
  );
}

const EXPAND_LIMIT = 220;

// ✅ ИСПРАВЛЕНИЕ: каждая карточка имеет свой независимый useState(false)
// key={item.id} гарантирует что при смене слайда стейт сбрасывается для каждой карточки отдельно
function ReviewCard({ item }: { item: ReviewItem }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = item.text.length > EXPAND_LIMIT;
  const displayText =
    !expanded && isLong ? item.text.slice(0, EXPAND_LIMIT).trimEnd() + "…" : item.text;

  return (
    <article className="flex flex-col justify-between rounded-[34px] border border-[#D8CEF5] dark:border-white/12 dark:bg-white/5 dark:backdrop-blur-sm p-6 lg:p-7">
      <div>
        <p className="text-[16px] leading-[1.6] tracking-[-0.02em] text-[#35236B] dark:text-white/80 sm:text-[17px]">
          {displayText}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 text-[14px] font-semibold text-[#6438D9] transition-colors hover:text-[#4E28B5] dark:text-[#A98BFF] dark:hover:text-white"
          >
            {expanded ? "Свернуть ↑" : "Читать далее →"}
          </button>
        )}
      </div>
      <div className="mt-6 flex items-center gap-4">
        <ReviewAvatar item={item} />
        <div>
          <div className="text-[18px] font-semibold tracking-[-0.04em] text-[#24115D] dark:text-white sm:text-[20px]">
            {item.name}
          </div>
          <div className="mt-1 text-[15px] text-[#8A80A8] dark:text-white/50 sm:text-[16px]">
            {item.role} · {item.company}
          </div>
        </div>
      </div>
    </article>
  );
}

function MosaicTileComponent({ tile }: { tile: MosaicTile }) {
  if (tile.kind === "logo") {
    const darkImgClass = `h-full max-h-[70px] w-full object-contain opacity-65${tile.invertOnDark ? " invert" : ""}`;
    return (
      <>
        <div className={`${tile.lightBg} dark:hidden`}>
          <Image src={tile.src} alt={tile.alt} width={180} height={80} className={tile.lightImgClass} />
        </div>
        <div className={`${tile.darkBg} hidden dark:flex`}>
          <Image src={tile.src} alt={tile.alt} width={180} height={80} className={darkImgClass} />
        </div>
      </>
    );
  }
  if (tile.kind === "symbol") {
    return (
      <>
        <div className={`${tile.lightBg} ${tile.lightText} dark:hidden`}>{tile.label}</div>
        <div className={`${tile.darkBg} ${tile.darkText} hidden dark:flex`}>{tile.label}</div>
      </>
    );
  }
  return (
    <>
      <div className={`${tile.lightBg} dark:hidden`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] font-semibold ${tile.badgeClass ?? "bg-[#D8EB16] text-white"}`}>
          {tile.badge}
        </div>
        <div>
          <div className={`text-[50px] leading-none tracking-[-0.06em] font-semibold ${tile.topClass}`}>{tile.top}</div>
          <p className="mt-2 max-w-[130px] text-[16px] leading-[1.2] text-[#35236B]">{tile.bottom}</p>
        </div>
      </div>
      <div className={`${tile.darkBg} hidden dark:flex`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] font-semibold ${tile.badgeClass ?? "bg-[#1C0C4C]/20 text-[#1C0C4C]"}`}>
          {tile.badge}
        </div>
        <div>
          <div className={`text-[50px] leading-none tracking-[-0.06em] font-semibold ${tile.topClass}`}>{tile.top}</div>
          <p className="mt-2 max-w-[130px] text-[16px] leading-[1.2] text-[#1C0C4C]/70">{tile.bottom}</p>
        </div>
      </div>
    </>
  );
}

function CaseLogo({ slide }: { slide: CaseSlide }) {
  if (!slide.logo) {
    return (
      <span className="text-[40px] font-semibold tracking-[-0.08em] text-[#6D6788] dark:text-white/50 sm:text-[54px] lg:text-[64px]">
        {slide.brand}
      </span>
    );
  }
  return (
    <Image
      src={slide.logo}
      alt={slide.logoAlt ?? slide.brand}
      width={160}
      height={60}
      className="max-h-13 w-auto object-contain dark:invert dark:opacity-80"
    />
  );
}

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [caseExpanded, setCaseExpanded] = useState(false);

  const activeSlide = slides[activeIndex];

  // ✅ orderedReviews пересчитывается при смене activeIndex
  // ReviewCard получает key={item.id} — каждая карточка независима
  // При смене слайда карточки НЕ пересоздаются (key стабилен = item.id)
  // Поэтому expanded у каждой карточки сохраняется независимо
  const orderedReviews = useMemo(
    () => reviewCards.map((_, i) => reviewCards[(activeIndex + i) % reviewCards.length]),
    [activeIndex],
  );

  const goPrev = () => {
    setActiveIndex((c) => (c === 0 ? slides.length - 1 : c - 1));
    setCaseExpanded(false);
  };
  const goNext = () => {
    setActiveIndex((c) => (c === slides.length - 1 ? 0 : c + 1));
    setCaseExpanded(false);
  };

  return (
    <section className="overflow-hidden bg-[#FCFBFF] dark:bg-[#1C0C4C] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-337.5">
        <RevealOnScroll>
          <div className="flex items-start justify-between gap-6">
            <h2 className="text-[44px] font-semibold leading-[0.9] tracking-[-0.07em] text-[#24115D] dark:text-white sm:text-[58px] lg:text-[72px]">
              Нам доверяют
            </h2>
            <div className="flex items-center gap-3">
              <ArrowButton direction="prev" onClick={goPrev} />
              <ArrowButton direction="next" onClick={goNext} />
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <div className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-3 xl:items-start">
            {orderedReviews.map((item) => (
              // ✅ key={item.id} — стабильный, не зависит от activeIndex
              // Каждая карточка живёт своим независимым useState
              // Нажатие "Читать далее" на одной НЕ затрагивает другие
              <ReviewCard key={item.id} item={item} />
            ))}
          </div>
        </RevealOnScroll>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
          <RevealOnScroll delay={120}>
            <div className="grid grid-cols-3 auto-rows-[110px] gap-4 sm:auto-rows-[125px] lg:auto-rows-[132px]">
              {mosaicTiles.map((tile, index) => (
                <MosaicTileComponent key={`${tile.kind}-${index}`} tile={tile} />
              ))}
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.75fr]">
            <RevealOnScroll delay={160}>
              <article
                key={`${activeSlide.id}-case`}
                className="flex flex-col justify-between rounded-[38px] bg-[#EFECFA] dark:bg-white/8 dark:border dark:border-white/10 dark:backdrop-blur-sm p-6 transition-all duration-300 sm:p-8 lg:p-9"
              >
                <div>
                  <h3 className="max-w-[15ch] text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-[#24115D] dark:text-white sm:text-[36px] lg:max-w-[14ch] lg:text-[54px] lg:leading-[0.95]">
                    {activeSlide.titleBefore}{" "}
                    <span className="box-decoration-clone rounded-2xl bg-[#EAF45D] dark:bg-[#D9F326] dark:text-[#1C0C4C] px-2 py-0.5">
                      {activeSlide.highlight}
                    </span>{" "}
                    {activeSlide.titleAfter}
                  </h3>
                  <p className="mt-5 max-w-136 text-[15px] leading-[1.62] text-[#4F417A] dark:text-white/65 sm:text-[16px] lg:mt-6 lg:text-[18px]">
                    {activeSlide.summary}
                  </p>
                  <p className="mt-4 max-w-120 text-[15px] leading-normal text-[#24115D] dark:text-white/80 sm:text-[16px]">
                    {activeSlide.result}
                  </p>

                  {activeSlide.extended && (
                    <>
                      <div
                        className={[
                          "overflow-hidden transition-all duration-500",
                          caseExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
                        ].join(" ")}
                      >
                        {activeSlide.extended}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCaseExpanded((v) => !v)}
                        className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6438D9] transition-colors hover:text-[#4E28B5] dark:text-[#A98BFF] dark:hover:text-white"
                      >
                        {caseExpanded ? "Свернуть ↑" : "Читать далее →"}
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A80A8] dark:text-white/40 sm:text-[12px]">
                      {activeSlide.brand}
                    </span>
                    {activeSlide.caseUrl && (
                      <Link
                        href={activeSlide.caseUrl}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#C4B8EC] bg-white/70 px-4 py-1.5 text-[13px] font-semibold text-[#6438D9] transition-all hover:border-[#6438D9] hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white"
                      >
                        Полный кейс →
                      </Link>
                    )}
                  </div>
                  <div className="flex w-auto shrink-0 items-center justify-end">
                    <CaseLogo slide={activeSlide} />
                  </div>
                </div>
              </article>
            </RevealOnScroll>

            <RevealOnScroll delay={220}>
              <article
                key={`${activeSlide.id}-quote`}
                className="min-h-[320px] rounded-[38px] bg-[#EFECFA] dark:bg-white/8 dark:border dark:border-white/10 dark:backdrop-blur-sm p-3 transition-all duration-300 sm:p-4 lg:min-h-[400px] lg:p-5"
              >
                <div className="flex h-full flex-col justify-between rounded-[30px] bg-white dark:bg-white/8 p-4 sm:p-5 lg:p-6">
                  <p className="text-[16px] leading-[1.6] text-[#35236B] dark:text-white/80 sm:text-[17px] lg:text-[18px]">
                    {activeSlide.quote}
                  </p>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#A67EFF_0%,#6D43E5_100%)] text-[18px] font-semibold tracking-[-0.04em] text-white shrink-0">
                      {activeSlide.quoteName.slice(0, 1)}
                      {activeSlide.quoteName.split(" ")[0].slice(1, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[18px] font-semibold tracking-[-0.04em] text-[#24115D] dark:text-white sm:text-[20px]">
                        {activeSlide.quoteName}
                      </div>
                      <div className="mt-1 text-[14px] leading-[1.35] text-[#8A80A8] dark:text-white/50 sm:text-[16px]">
                        {activeSlide.quoteRole}
                      </div>
                      <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#A095BD] dark:text-white/35">
                        {activeSlide.quoteCompany}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}