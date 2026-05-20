"use client";

import Image from "next/image";
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
  logo?: string;
  logoAlt?: string;
  quote: string;
  quoteName: string;
  quoteRole: string;
  quoteCompany: string;
};

const reviewCards: ReviewItem[] = [
  {
    id: "eyfel",
    brand: "EYFEL",
    text: "Контакт с аудиторией всегда у нас был вслепую, пока мы не решили сначала изучить реальные запросы аудитории, а не полагаться на внутренние гипотезы. Благодаря структурированным опросам мы точно поняли, какой посыл, акция и формат подачи информации действительно важны для нашей ЦА.",
    name: "Хвостов М.Р.",
    role: "Маркетолог",
    company: "EYFEL",
    initials: "ХМ",
  },
  {
    id: "alluri",
    brand: "ALLURI",
    text: "Разрабатывая отдельный бренд специально под логику маркетплейсов, мы сразу поняли: здесь побеждает не только качество, но и точное соответствие алгоритмам выбора покупателя. Предварительное исследование дало нам чёткую картину того, как люди смотрят карточки и на каком этапе принимают решение о корзине.",
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
    logo: "/Testimonials/logo-white (1).png",
    logoAlt: "ANGFA",
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
      "Команда заранее выяснила, как покупатели читают карточки, на что смотрят в составе и какие обещания действительно влияют на решение о покупке. Это позволило выстроить ассортимент и упаковку под реальные ожидания.",
    result: "Итог: запуск прошёл без хаотичных переработок карточек и цены.",
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
    logo: "/Testimonials/logo_black_crop.svg",
    logoAlt: "EYFEL",
    quote:
      "Благодаря структурированным опросам мы точно поняли, какой посыл, акция и формат подачи информации действительно важны для нашей ЦА. Это позволило выстроить коммуникацию на языке потребителя.",
    quoteName: "Хвостов М.Р.",
    quoteRole: "Маркетолог",
    quoteCompany: "EYFEL",
  },
];

const mosaicTiles = [
  {
    kind: "logo" as const,
    src: "/Testimonials/2MOOD_logo_main-_2_.png",
    alt: "2MOOD",
    className:
      "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center p-3",
    imageClassName: "h-full max-h-[60px] w-full object-contain opacity-85",
  },
  {
    kind: "logo" as const,
    src: "/Testimonials/logo-klient-1.jpg",
    alt: "Natura Siberica",
    className:
      "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center p-3",
    imageClassName: "h-full max-h-[68px] w-full object-contain opacity-90",
  },
  {
    kind: "metric" as const,
    top: "800+",
    bottom: "исследований проведено",
    badge: "◎",
    className:
      "row-span-2 rounded-[32px] bg-[#EEF67C] p-5 sm:p-6 flex flex-col justify-between",
    topClassName: "text-[#6947DF]",
  },
  {
    kind: "logo" as const,
    src: "/Testimonials/fc3816fd-7346-48d2-948d-4e69bee035a3.jpg",
    alt: "Sammy Beauty",
    className:
      "rounded-[28px] bg-[#EEF67C] flex items-center justify-center p-3",
    imageClassName: "h-full max-h-[74px] w-full object-contain",
  },
  {
    kind: "logo" as const,
    src: "/Testimonials/logo_black_crop.svg",
    alt: "EYFEL",
    className:
      "rounded-[28px] border border-[#D8CEF5] bg-white flex items-center justify-center p-3",
    imageClassName: "h-full max-h-[62px] w-full object-contain opacity-80",
  },
  {
    kind: "metric" as const,
    top: "15+",
    bottom: "компаний уже с нами",
    badge: "+",
    className:
      "row-span-2 rounded-[32px] bg-[#ECE5FA] p-5 sm:p-6 flex flex-col justify-between",
    topClassName: "text-[#6947DF]",
    badgeClassName:
      "bg-[linear-gradient(180deg,#9A73FF_0%,#6E42E5_100%)] text-white",
  },
  {
    kind: "logo" as const,
    src: "/Testimonials/__.jpg",
    alt: "Gamma D'oro",
    className:
      "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center p-3",
    imageClassName: "h-full max-h-[72px] w-full object-contain opacity-85",
  },
  {
    kind: "logo" as const,
    src: "/Testimonials/krjx4LhlKer_zPTk7-JGVWgNMyvS7kEIZZ_KfeTnrXsN74ytEn6OglOntuD0o9r4i6BtOIqHnwzENfWuTUCOPO4j.jpg",
    alt: "La'Venti",
    className:
      "rounded-[28px] border border-[#D8CEF5] bg-white flex items-center justify-center p-3",
    imageClassName: "h-full max-h-[72px] w-full object-contain opacity-85",
  },
  {
    kind: "symbol" as const,
    label: "S.",
    className:
      "rounded-[28px] bg-[#EEF67C] flex items-center justify-center text-[44px] font-semibold tracking-[-0.08em] text-[#7B7396]",
  },
  {
    kind: "symbol" as const,
    label: "+7",
    className:
      "rounded-[28px] bg-[#F0ECFA] flex items-center justify-center text-[36px] font-medium tracking-[-0.06em] text-[#8D84A7]",
  },
];

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Предыдущий отзыв" : "Следующий отзыв"}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D8CEF5] bg-white text-[#2C1A67] transition-all duration-200 hover:border-[#B9ACEC] hover:bg-[#F7F4FF]"
    >
      <span className="text-[20px] leading-none">
        {direction === "prev" ? "‹" : "›"}
      </span>
    </button>
  );
}

function ReviewAvatar({ item }: { item: ReviewItem }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#A67EFF_0%,#6D43E5_100%)] text-[18px] font-semibold tracking-[-0.04em] text-white">
      {item.initials}
    </div>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <article className="flex min-h-[300px] flex-col justify-between rounded-[34px] border border-[#D8CEF5] p-6 lg:min-h-[320px] lg:p-7">
      <p className="text-[16px] leading-[1.54] tracking-[-0.02em] text-[#35236B] sm:text-[17px] lg:text-[18px]">
        {item.text}
      </p>

      <div className="mt-8 flex items-center gap-4">
        <ReviewAvatar item={item} />
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.04em] text-[#24115D]">
            {item.name}
          </div>
          <div className="mt-1 text-[16px] text-[#8A80A8]">
            {item.role} · {item.company}
          </div>
        </div>
      </div>
    </article>
  );
}

function MosaicTile({
  tile,
}: {
  tile: (typeof mosaicTiles)[number];
}) {
  if (tile.kind === "logo") {
    return (
      <div className={tile.className}>
        <Image
          src={tile.src}
          alt={tile.alt}
          width={180}
          height={80}
          className={tile.imageClassName}
        />
      </div>
    );
  }

  if (tile.kind === "symbol") {
    return <div className={tile.className}>{tile.label}</div>;
  }

  return (
    <div className={tile.className}>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-[16px] text-[22px] font-semibold ${
          tile.badgeClassName ?? "bg-[#D8EB16] text-white"
        }`}
      >
        {tile.badge}
      </div>

      <div>
        <div
          className={`text-[50px] leading-none tracking-[-0.06em] font-semibold ${tile.topClassName}`}
        >
          {tile.top}
        </div>
        <p className="mt-2 max-w-[130px] text-[16px] leading-[1.2] text-[#35236B]">
          {tile.bottom}
        </p>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = slides[activeIndex];

  const orderedReviews = useMemo(() => {
    return reviewCards.map((_, index) => reviewCards[(activeIndex + index) % reviewCards.length]);
  }, [activeIndex]);

  const goPrev = () => {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  };

  const goNext = () => {
    setActiveIndex((current) => (current === slides.length - 1 ? 0 : current + 1));
  };

  return (
    <section className="overflow-hidden bg-[#FCFBFF] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1350px]">
        <RevealOnScroll>
          <div className="flex items-start justify-between gap-6">
            <h2 className="text-[44px] font-semibold leading-[0.9] tracking-[-0.07em] text-[#24115D] sm:text-[58px] lg:text-[72px]">
              Нам доверяют
            </h2>

            <div className="flex items-center gap-3">
              <ArrowButton direction="prev" onClick={goPrev} />
              <ArrowButton direction="next" onClick={goNext} />
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={80}>
          <div className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-3">
            {orderedReviews.map((item) => (
              <ReviewCard key={`${activeSlide.id}-${item.id}`} item={item} />
            ))}
          </div>
        </RevealOnScroll>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
          <RevealOnScroll delay={120}>
            <div className="grid grid-cols-3 auto-rows-[110px] gap-4 sm:auto-rows-[125px] lg:auto-rows-[132px]">
              {mosaicTiles.map((tile, index) => (
                <MosaicTile key={`${tile.kind}-${index}`} tile={tile} />
              ))}
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.1fr_0.85fr]">
            <RevealOnScroll delay={160}>
              <article
                key={`${activeSlide.id}-case`}
                className="flex min-h-[460px] flex-col justify-between rounded-[38px] bg-[#EFECFA] p-6 transition-all duration-300 sm:p-8 lg:min-h-[500px] lg:p-9"
              >
                <div>
                  <h3 className="max-w-[15ch] text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-[#24115D] sm:text-[36px] lg:max-w-[14ch] lg:text-[54px] lg:leading-[0.95]">
                    {activeSlide.titleBefore}{" "}
                    <span className="box-decoration-clone rounded-[16px] bg-[#EAF45D] px-2 py-0.5">
                      {activeSlide.highlight}
                    </span>{" "}
                    {activeSlide.titleAfter}
                  </h3>

                  <p className="mt-5 max-w-[34rem] text-[15px] leading-[1.62] text-[#4F417A] sm:text-[16px] lg:mt-6 lg:text-[18px]">
                    {activeSlide.summary}
                  </p>

                  <p className="mt-4 max-w-[30rem] text-[15px] leading-[1.5] text-[#24115D] sm:text-[16px]">
                    {activeSlide.result}
                  </p>
                </div>

                <div className="mt-10 flex flex-wrap items-end justify-between gap-5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A80A8] sm:text-[12px]">
                    {activeSlide.brand}
                  </span>

                  <div className="flex max-w-full items-center justify-end">
                    {activeSlide.logo ? (
                      <Image
                        src={activeSlide.logo}
                        alt={activeSlide.logoAlt ?? activeSlide.brand}
                        width={220}
                        height={82}
                        className="max-h-[58px] w-auto max-w-full object-contain sm:max-h-[68px] lg:max-h-[76px]"
                      />
                    ) : (
                      <span className="text-[40px] font-semibold tracking-[-0.08em] text-[#6D6788] sm:text-[54px] lg:text-[64px]">
                        {activeSlide.brand}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </RevealOnScroll>

            <RevealOnScroll delay={220}>
              <article
                key={`${activeSlide.id}-quote`}
                className="min-h-[420px] rounded-[38px] bg-[#EFECFA] p-4 transition-all duration-300 sm:p-5 lg:min-h-[500px] lg:p-6"
              >
                <div className="flex h-full flex-col justify-between rounded-[32px] bg-white p-5 sm:p-6 lg:p-7">
                  <p className="text-[16px] leading-[1.6] text-[#35236B] sm:text-[17px] lg:text-[18px]">
                    {activeSlide.quote}
                  </p>

                  <div className="mt-8 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#A67EFF_0%,#6D43E5_100%)] text-[18px] font-semibold tracking-[-0.04em] text-white">
                      {activeSlide.quoteName.slice(0, 1)}
                      {activeSlide.quoteName.split(" ")[0].slice(1, 2)}
                    </div>

                    <div className="min-w-0">
                      <div className="text-[18px] font-semibold tracking-[-0.04em] text-[#24115D] sm:text-[20px]">
                        {activeSlide.quoteName}
                      </div>
                      <div className="mt-1 text-[14px] leading-[1.35] text-[#8A80A8] sm:text-[16px]">
                        {activeSlide.quoteRole}
                      </div>
                      <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#A095BD]">
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
