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
  id: "wildberries",
  brand: "WB",
  text: "Раньше мы гадали, какая карточка лучше сработает на Wildberries. Теперь тестируем варианты на реальной аудитории. Конверсия в карточке выросла на 2,1%, а стоимость исследования составила копейки по сравнению с агентствами. ИИ-отчет сразу подсветил, какой именно триггер цепляет покупателей. Теперь тестируем всё здесь.",
  name: "Терешков А.К.",
  role: "Менеджер маркетплейсов",
  company: "Wildberries",
  initials: "ТК",
},


  {
    id: "angfa",
    brand: "ANGFA",
    text: "Перед первым запуском в России мы провели масштабное исследование на «ПотокМнений» — 6 000+ респондентов, регулярно покупающих уходовую косметику. Получили чёткую картину барьеров, ценовых ожиданий и каналов доверия. Результат: стратегические решения по ассортименту, ценообразованию и медиа ещё до того, как первый контейнер пересёк границу.",
    name: "Ливенцев В.В.",
    role: "CMO ANGFA в России и СНГ",
    company: "ANGFA",
    initials: "ЛВ",
  },


];

const chaschinaCard: ReviewItem = {
  id: "AI",
  brand: "AI",
  text: "Сэкономил 300 000 руб на исследовании новой упаковки. Результат и готовые выводы от ИИ получили за 2 дня вместо месяца. Качество данных на высоте!",
  name: "Чащина Ю.А",
  role: "Маркетолог",
  company: "AI",
  initials: "ЧА",
};

// Right block cycles through all reviews including Чащина; Чащина never appears in the top row.
const rightBlockReviews: ReviewItem[] = [...reviewCards, chaschinaCard];

const angfaExtended = (
  <div className="mt-5 space-y-4 border-t border-[#D0C7EE]/60 pt-5 dark:border-white/10">
    <p className="text-[14px] leading-[1.65] text-[#4F417A] dark:text-white/65">
      За 6 месяцев до старта мы запустили опросы среди <strong className="text-[#24115D] dark:text-white">6&nbsp;000+ респондентов</strong>, регулярно покупающих уходовую косметику в России.
    </p>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        { label: "Матрица продуктов", text: "Убрали 40% ассортимента." },
        { label: "Ценовая политика", text: "Три уровня: доступная, ядро, премиум." },
        { label: "Стратегия контакта", text: "68% изучают разборы в Telegram." },
      ].map(({ label, text }) => (
        <div key={label} className="rounded-[16px] bg-white/50 p-3 dark:bg-white/5">
          <p className="text-[13px] font-semibold text-[#24115D] dark:text-white">{label}</p>
          <p className="mt-1 text-[12px] leading-[1.5] text-[#4F417A] dark:text-white/55">{text}</p>
        </div>
      ))}
    </div>
  </div>
);

const slides: CaseSlide[] = [
  {
    id: "angfa",
    brand: "ANGFA",
    titleBefore: "Как бренд ANGFA сэкономил",
    highlight: "5 000 000 ₽",
    titleAfter: "до первого запуска в России",
    summary: "До вывода бренда на рынок команда проверила упаковку, ожидания аудитории и сценарии выбора товара. Исследование помогло сократить число дорогих гипотез ещё до закупок и производства.",
    result: "Итог: запуск за 4 месяца и экономия более 5 000 000 ₽.",
    extended: angfaExtended,
    logo: "/Testimonials2/logo-white (1).png",
    logoAlt: "ANGFA",
    caseUrl: "/blog/angfa",
    quote: "Без проб и ошибок: сначала мы собрали ответы аудитории, а уже потом принимали решения по продукту и коммуникации. Это сняло лишние расходы на тесты вслепую и ускорило выход на рынок.",
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
    summary: "Команда заранее выяснила, как покупатели читают карточки, на что смотрят в составе и какие обещания действительно влияют на решение о покупке.",
    result: "Итог: запуск прошёл без хаотичных переработок карточек и цены.",
    extended: (
      <div className="mt-5 space-y-4 border-t border-[#D0C7EE]/60 pt-5 dark:border-white/10">
        <p className="text-[14px] leading-[1.65] text-[#4F417A] dark:text-white/65">
          Предварительное исследование дало чёткую картину: как люди смотрят карточки, какие формулировки в составе ищут и на каком этапе принимают решение о корзине.
        </p>
      </div>
    ),
    quote: "Мы сформировали ассортимент, упаковку и цену строго под требования аудитории. Запуск прошёл гладко, потому что ключевые решения были приняты заранее, а не после первых ошибок.",
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
    summary: "Опросы помогли команде перейти от внутренних гипотез к понятным сигналам рынка: какие акции воспринимаются лучше, какой посыл работает и что действительно важно покупателю.",
    result: "Итог: коммуникация стала точнее и ближе к реальному запросу ЦА.",
    extended: (
      <div className="mt-5 space-y-4 border-t border-[#D0C7EE]/60 pt-5 dark:border-white/10">
        <p className="text-[14px] leading-[1.65] text-[#4F417A] dark:text-white/65">
          До исследования команда полагалась на внутренние гипотезы. После — получила конкретные данные: какой посыл вызывает доверие, какой формат акции воспринимается как выгода.
        </p>
      </div>
    ),
    logo: "/Testimonials2/logo_black_crop.svg",
    logoAlt: "EYFEL",
    quote: "Благодаря структурированным опросам мы точно поняли, какой посыл, акция и формат подачи информации действительно важны для нашей ЦА. Это позволило выстроить коммуникацию на языке потребителя.",
    quoteName: "Хвостов М.Р.",
    quoteRole: "Маркетолог",
    quoteCompany: "EYFEL",
  },
];

type MosaicTile =
  | { kind: "logo"; src: string; alt: string; light: string; dark: string; imgClass: string; invertOnDark?: boolean }
  | { kind: "metric"; top: string; bottom: string; badge: string; light: string; dark: string; topClass: string; badgeClass?: string }
  | { kind: "symbol"; label: string; light: string; dark: string; lightText: string; darkText: string };

const mosaicTiles: MosaicTile[] = [
  {
    kind: "logo",
    src: "/Testimonials2/2MOOD_logo_main-_2_.png",
    alt: "2MOOD",
    light: "rounded-[22px] bg-[#F0ECFA] flex items-center justify-center p-3",
    dark: "rounded-[22px] bg-white/10 flex items-center justify-center p-3",
    imgClass: "h-full max-h-[48px] w-full object-contain opacity-85",
  },
  {
    kind: "logo",
    src: "/Testimonials2/logo-klient-1-Photoroom.png",
    alt: "Natura Siberica",
    light: "rounded-[22px] bg-[#F0ECFA] flex items-center justify-center p-3",
    dark: "rounded-[22px] bg-white/10 flex items-center justify-center p-3",
    imgClass: "h-full max-h-[54px] w-full object-contain opacity-90",
  },
  {
    kind: "metric",
    top: "800+",
    bottom: "исследований проведено",
    badge: "◎",
    light: "row-span-2 rounded-[22px] bg-[#E8F573] p-4 flex flex-col justify-between",
    dark: "row-span-2 rounded-[22px] bg-[#D9F326] p-4 flex flex-col justify-between",
    topClass: "text-[#1C0C4C]",
  },
  {
    kind: "logo",
    src: "/Testimonials2/fc3816fd-7346-48d2-948d-4e69bee035a3 (1).png",
    alt: "Sammy Beauty",
    light: "rounded-[22px] bg-[#E8F573] flex items-center justify-center p-3",
    dark: "rounded-[22px] bg-[#D9F326] flex items-center justify-center p-3",
    imgClass: "h-full max-h-[56px] w-full object-contain",
  },
  {
    kind: "logo",
    src: "/Testimonials2/logo_black_crop.svg",
    alt: "MIXIT",
    light: "rounded-[22px] border border-[#E0D9F0] bg-white flex items-center justify-center p-3",
    dark: "rounded-[22px] border border-white/15 bg-white/10 flex items-center justify-center p-3",
    imgClass: "h-full max-h-[48px] w-full object-contain opacity-80",
    invertOnDark: true,
  },
  {
    kind: "metric",
    top: "15+",
    bottom: "компаний уже с нами",
    badge: "+",
    light: "row-span-2 rounded-[22px] bg-[#ECE5FA] p-4 flex flex-col justify-between",
    dark: "row-span-2 rounded-[22px] bg-white/10 p-4 flex flex-col justify-between",
    topClass: "text-[#6947DF] dark:text-[#A98BFF]",
    badgeClass: "bg-[linear-gradient(180deg,#9A73FF_0%,#6E42E5_100%)] text-white",
  },
  {
    kind: "logo",
    src: "/Testimonials2/__ (1)-Photoroom.png",
    alt: "Gamma D'oro",
    light: "rounded-[22px] bg-[#F0ECFA] flex items-center justify-center p-3",
    dark: "rounded-[22px] bg-white/10 flex items-center justify-center p-3",
    imgClass: "h-full max-h-[54px] w-full object-contain opacity-85",
  },
  {
    kind: "logo",
    src: "/Testimonials2/krjx4LhlKer_zPTk7-JGVWgNMyvS7kEIZZ_KfeTnrXsN74ytEn6OglOntuD0o9r4i6BtOIqHnwzENfWuTUCOPO4j (1)-Photoroom.png",
    alt: "La'Venti",
    light: "rounded-[22px] border border-[#E0D9F0] bg-white flex items-center justify-center p-3",
    dark: "rounded-[22px] border border-white/15 bg-white/10 flex items-center justify-center p-3",
    imgClass: "h-full max-h-[54px] w-full object-contain opacity-85",
  },
  {
    kind: "symbol",
    label: "S.",
    light: "rounded-[22px] bg-[#E8F573] flex items-center justify-center text-[36px] font-semibold tracking-[-0.08em]",
    dark: "rounded-[22px] bg-[#D9F326] flex items-center justify-center text-[36px] font-semibold tracking-[-0.08em]",
    lightText: "text-[#7B7396]",
    darkText: "text-[#1C0C4C]",
  },
  {
    kind: "symbol",
    label: "+7",
    light: "rounded-[22px] bg-[#F0ECFA] flex items-center justify-center text-[28px] font-medium tracking-[-0.06em]",
    dark: "rounded-[22px] bg-white/10 flex items-center justify-center text-[28px] font-medium tracking-[-0.06em]",
    lightText: "text-[#8D84A7]",
    darkText: "text-white/60",
  },
];

function ArrowButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Предыдущий" : "Следующий"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D8CEF5] bg-white text-[#2C1A67] dark:border-white/20 dark:bg-white/10 dark:text-white transition-all hover:bg-[#F7F4FF] dark:hover:bg-white/18"
    >
      <span className="text-[18px] leading-none">{direction === "prev" ? "‹" : "›"}</span>
    </button>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 200;
  const isLong = item.text.length > LIMIT;
  const displayText = !expanded && isLong ? item.text.slice(0, LIMIT).trimEnd() + "…" : item.text;

  return (
    <article className="flex flex-col justify-between rounded-[24px] border border-[#E8E3F4] bg-white dark:border-white/10 dark:bg-white/5 p-6 xl:p-7">
      <div>
        <p className="text-[15px] leading-[1.65] text-[#3D3060] dark:text-white/75">{displayText}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="mt-2 text-[13px] font-semibold text-[#6438D9] hover:text-[#4E28B5] dark:text-[#A98BFF]"
          >
            {expanded ? "Свернуть ↑" : "Читать далее →"}
          </button>
        )}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#A67EFF_0%,#6D43E5_100%)] text-[15px] font-semibold text-white">
          {item.initials}
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#1C0C4C] dark:text-white">{item.name}</p>
          <p className="mt-0.5 text-[13px] text-[#8A80A8] dark:text-white/45">{item.role}</p>
        </div>
      </div>
    </article>
  );
}

function MosaicTileComponent({ tile }: { tile: MosaicTile }) {
  if (tile.kind === "logo") {
    const darkImg = `h-full max-h-[56px] w-full object-contain opacity-60${tile.invertOnDark ? " invert" : ""}`;
    return (
      <>
        <div className={`${tile.light} dark:hidden`}>
          <Image src={tile.src} alt={tile.alt} width={150} height={64} className={tile.imgClass} />
        </div>
        <div className={`${tile.dark} hidden dark:flex`}>
          <Image src={tile.src} alt={tile.alt} width={150} height={64} className={darkImg} />
        </div>
      </>
    );
  }
  if (tile.kind === "symbol") {
    return (
      <>
        <div className={`${tile.light} ${tile.lightText} dark:hidden`}>{tile.label}</div>
        <div className={`${tile.dark} ${tile.darkText} hidden dark:flex`}>{tile.label}</div>
      </>
    );
  }
  return (
    <>
      <div className={`${tile.light} dark:hidden`}>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[16px] font-semibold ${tile.badgeClass ?? "bg-[#C5DD15] text-[#1C0C4C]"}`}>
          {tile.badge}
        </div>
        <div>
          <div className={`text-[40px] leading-none tracking-[-0.05em] font-bold ${tile.topClass}`}>{tile.top}</div>
          <p className="mt-1 max-w-[110px] text-[12px] leading-[1.25] text-[#35236B]">{tile.bottom}</p>
        </div>
      </div>
      <div className={`${tile.dark} hidden dark:flex`}>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[16px] font-semibold ${tile.badgeClass ?? "bg-[#1C0C4C]/20 text-[#1C0C4C]"}`}>
          {tile.badge}
        </div>
        <div>
          <div className={`text-[40px] leading-none tracking-[-0.05em] font-bold ${tile.topClass}`}>{tile.top}</div>
          <p className="mt-1 max-w-[110px] text-[12px] leading-[1.25] text-[#1C0C4C]/70">{tile.bottom}</p>
        </div>
      </div>
    </>
  );
}

function CaseLogo({ slide }: { slide: CaseSlide }) {
  if (!slide.logo) {
    return (
      <span className="text-[32px] font-semibold tracking-[-0.06em] text-[#6D6788] dark:text-white/50 sm:text-[44px]">
        {slide.brand}
      </span>
    );
  }
  return (
    <Image
      src={slide.logo}
      alt={slide.logoAlt ?? slide.brand}
      width={150}
      height={50}
      className="w-auto object-contain dark:invert dark:opacity-80"
      style={{ maxHeight: "44px" }}
    />
  );
}

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [caseExpanded, setCaseExpanded] = useState(false);
  const activeSlide = slides[activeIndex];

  // Render only the first 3 reviews in the main reviews grid.
  // Ensure the review with id 'wildberries' is included in the review set (prioritized),
  // but allow the first-row to be scrollable (windowed) with wrap-around.
  // The quote/article block rendered below is the right-side 4th block — don't render the 4th review here.
  const prioritizedId = "Wildberries";
  const prioritized = reviewCards.find(r => r.id === prioritizedId);
  const others = reviewCards.filter(r => r.id !== prioritizedId);
  const arrangedReviews = prioritized ? [prioritized, ...others] : others;

  // Review window (carousel) state: index of the first visible review in arrangedReviews
  const [reviewStart, setReviewStart] = useState(0);
  // Right block rotates through rightBlockReviews (all reviews + Чащина); starts on Чащина.
  const [rightIndex, setRightIndex] = useState(reviewCards.length);
  // Exclude the review that matches the active slide (avoid duplication between rows)
  const filteredReviews = arrangedReviews.filter(r => r.id !== activeSlide.id);
  const reviewCount = filteredReviews.length;
  const getWindow = (arr: ReviewItem[], start: number, size: number) => {
    if (arr.length === 0) return [] as ReviewItem[];
  // If there are fewer items than the window size, return unique items only (no duplicates).
  // If the count equals the window size we still allow rotation (different order), so only
  // short-circuit when arr.length < size.
  if (arr.length < size) return arr.slice(0, arr.length);
    const end = start + size;
    if (end <= arr.length) return arr.slice(start, end);
    return arr.slice(start).concat(arr.slice(0, end % arr.length));
  };
  const orderedReviews = getWindow(filteredReviews, reviewStart, 3);

  // Right block must never duplicate the top row — only show reviews not currently in orderedReviews.
  const nonTopReviews = rightBlockReviews.filter(
    (r) => !orderedReviews.some((t) => t.id === r.id),
  );
  const currentRightReview = nonTopReviews.length > 0
    ? nonTopReviews[rightIndex % nonTopReviews.length]
    : chaschinaCard;

  const goPrevReviews = () => setReviewStart(s => (s === 0 ? Math.max(reviewCount - 1, 0) : s - 1));
  const goNextReviews = () => setReviewStart(s => (reviewCount === 0 ? 0 : (s + 1) % reviewCount));

  const goPrev = () => {
    setActiveIndex((current) => {
      const newIndex = current === 0 ? slides.length - 1 : current - 1;
      const filteredForNew = arrangedReviews.filter(r => r.id !== slides[newIndex].id);
      const len = filteredForNew.length;
      setReviewStart(len === 0 ? 0 : prev => (prev === 0 ? len - 1 : Math.max(0, prev - 1)));
      setCaseExpanded(false);
      return newIndex;
    });
    setRightIndex(prev => (prev === 0 ? rightBlockReviews.length - 1 : prev - 1));
  };

  const goNext = () => {
    setActiveIndex((current) => {
      const newIndex = current === slides.length - 1 ? 0 : current + 1;
      const filteredForNew = arrangedReviews.filter(r => r.id !== slides[newIndex].id);
      const len = filteredForNew.length;
      setReviewStart(len === 0 ? 0 : prev => (prev + 1) % len);
      setCaseExpanded(false);
      return newIndex;
    });
    setRightIndex(prev => (prev + 1) % rightBlockReviews.length);
  };

  return (
    <section className="bg-[#FCFBFF] dark:bg-[#1C0C4C] px-4 py-16 sm:px-6 lg:px-8 lg:py-20 overflow-hidden">
      <div className="mx-auto max-w-[1400px]">

        {/* Заголовок + стрелки */}
        <RevealOnScroll>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[36px] sm:text-[48px] lg:text-[60px] font-semibold leading-[0.92] tracking-[-0.06em] text-[#1C0C4C] dark:text-white">
              Нам доверяют
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <ArrowButton direction="prev" onClick={goPrev} />
              <ArrowButton direction="next" onClick={goNext} />
            </div>
          </div>
        </RevealOnScroll>

        {/* Четыре карточки отзывов (фиксированное окно) */}
        <RevealOnScroll delay={80}>
          <div className="mt-8">
            {/* header arrows control both rows; no local controls here */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:items-start">
              {orderedReviews.map((item) => (
                <div key={item.id}>
                  <ReviewCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>

        {/* Нижний блок: мозаика | кейс | цитата */}
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">

          {/* Мозаика — 3 колонки × 4 ряда, фикс высота ряда */}
          <RevealOnScroll delay={120}>
            <div className="grid grid-cols-3 gap-3 [grid-auto-rows:96px] lg:[grid-auto-rows:104px]">
              {mosaicTiles.map((tile, i) => (
                <MosaicTileComponent key={`${tile.kind}-${i}`} tile={tile} />
              ))}
            </div>
          </RevealOnScroll>

          {/* Кейс — широкий центральный */}
          <RevealOnScroll delay={160}>
            <article className="flex h-full flex-col justify-between rounded-[28px] bg-[#EFECFA] dark:bg-white/8 dark:border dark:border-white/10 p-7 lg:p-9">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-[26px] sm:text-[32px] lg:text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#1C0C4C] dark:text-white">
                    {activeSlide.titleBefore}{" "}
                    <span
                      className="rounded-[8px] px-1.5 py-0.5 font-semibold"
                      style={{ background: "#E8F573", color: "#1C0C4C" }}
                    >
                      {activeSlide.highlight}
                    </span>{" "}
                    {activeSlide.titleAfter}
                  </h3>
                  <div className="ml-4 flex shrink-0 items-center gap-2" />
                </div>

                <p className="mt-5 text-[15px] lg:text-[16px] leading-[1.65] text-[#4F417A] dark:text-white/65 max-w-[560px]">
                  {activeSlide.summary}
                </p>
                <p className="mt-3 text-[15px] font-medium text-[#1C0C4C] dark:text-white/80">
                  {activeSlide.result}
                </p>

                {activeSlide.extended && (
                  <>
                    <div className={["overflow-hidden transition-all duration-500", caseExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"].join(" ")}>
                      {activeSlide.extended}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCaseExpanded(v => !v)}
                      className="mt-4 text-[13px] font-semibold text-[#6438D9] hover:text-[#4E28B5] dark:text-[#A98BFF]"
                    >
                      {caseExpanded ? "Свернуть ↑" : "Читать далее →"}
                    </button>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A80A8] dark:text-white/40">
                    {activeSlide.brand}
                  </span>
                  {activeSlide.caseUrl && (
                    <Link
                      href={activeSlide.caseUrl}
                      className="inline-flex items-center rounded-full border border-[#C4B8EC] bg-white/70 px-4 py-1.5 text-[12px] font-semibold text-[#6438D9] hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white/80"
                    >
                      Полный кейс →
                    </Link>
                  )}
                </div>
                <CaseLogo slide={activeSlide} />
              </div>
            </article>
          </RevealOnScroll>

          {/* Цитата — узкая правая, той же высоты что кейс */}
          <RevealOnScroll delay={200}>
            <article className="flex h-full min-h-[420px] flex-col rounded-[28px] border border-[#E8E3F4] bg-white p-8 lg:p-10 dark:border-white/10 dark:bg-white/8">

              {/* Текст */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="mb-6 h-1 w-14 rounded-full bg-[#6438D9]" />
                <p className="text-[17px] leading-[1.8] text-[#35236B] dark:text-white/80 line-clamp-6">
                  {currentRightReview.text}
                </p>
              </div>

              {/* Автор */}
              <div className="mt-8 shrink-0 border-t border-[#ECE7F7] pt-6 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-b from-[#A67EFF] to-[#6D43E5] text-[16px] font-semibold text-white shadow-lg shadow-[#6438D9]/20">
                    {currentRightReview.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[18px] font-semibold text-[#1C0C4C] dark:text-white">
                      {currentRightReview.name}
                    </p>
                    <p className="mt-1 text-[14px] text-[#8A80A8] dark:text-white/60">
                      {currentRightReview.role}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B1A6CC] dark:text-white/30">
                      {currentRightReview.company}
                    </p>
                  </div>
                </div>
              </div>

            </article>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}