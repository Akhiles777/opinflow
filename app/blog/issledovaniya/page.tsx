import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Почему бизнесу важно проводить опросы перед выпуском продукта — ПотокМнений",
  description:
    "95% новых продуктов терпят неудачу из-за несоответствия реальным запросам клиентов. Разбираем методы проверки идеи до старта продаж.",
  keywords: "маркетинговые исследования, опросы перед запуском, исследование рынка, проверка идеи продукта",
};

export default function IssledovaniyaPage() {
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
          <span className="inline-block rounded-full bg-[#ECE5FA] px-3 py-1 text-[12px] font-semibold text-[#6438D9]">
            Статья
          </span>
          <h1 className="mt-4 text-[36px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#24115D] dark:text-white sm:text-[48px]">
            Почему бизнесу важно проводить опросы перед выпуском продукта
          </h1>
          <div className="mt-6 flex items-center gap-3 border-t border-[#EDE8F8] pt-6 text-[13px] text-[#8A80A8] dark:border-white/10 dark:text-white/40">
            <span>Редакция ПотокМнений</span>
            <span>·</span>
            <span>7 мин чтения</span>
          </div>
        </div>

        {/* ── Lead ── */}
        <p className="mt-10 text-[18px] font-medium leading-[1.65] tracking-[-0.01em] text-[#35236B] dark:text-white/80 sm:text-[20px]">
          Ежегодно на рынок выходит множество новинок, но подавляющее большинство из них не приживаются. По словам профессора Клейтона Кристенсена (Harvard Business School), ежегодно стартует более 30 000 новых продуктов, однако <strong className="text-[#24115D] dark:text-white">95% из них терпят неудачу</strong>. Причина проста: продукт не соответствует реальным запросам клиентов.
        </p>

        {/* ── Body ── */}
        <div className="mt-10 space-y-10 text-[#35236B] dark:text-white/75">

          <Section title="Что дают маркетинговые исследования для нового продукта">
            <ul>
              <li>
                <strong className="text-[#24115D] dark:text-white">Выявить потребности целевой аудитории.</strong>{" "}
                Узнать, какие проблемы вы должны решать и какие функции или дизайн важны для клиентов. Компании FMCG (P&amp;G, Nestlé и др.) традиционно проверяли идеи через опросы, интервью и фокус-группы ещё на стадии разработки — это помогало сэкономить миллионы на неудачных релизах.
              </li>
              <li>
                <strong className="text-[#24115D] dark:text-white">Проверить саму концепцию.</strong>{" "}
                Опросы позволяют выяснить, нравится ли потенциальным покупателям ваша идея: готовы ли люди платить, сколько, что именно их заинтересовало. Одна IT-компания протестировала три лендинга с разными концепциями — рекламная кампания показала, что одна из идей привлекала в 3 раза больше кликов.
              </li>
              <li>
                <strong className="text-[#24115D] dark:text-white">Снизить риски и затраты.</strong>{" "}
                Без исследований вы рискуете создать «идеальный» продукт, который никому не нужен. Правильный анализ потребностей клиентов «может максимизировать шансы на достижение соответствия продукта рынку».
              </li>
            </ul>
          </Section>

          <Section title="Основные методы проверки идеи">
            <div className="space-y-6">
              <Method
                num="01"
                title="Онлайн-опросы"
                text="Быстрый способ собрать количественные данные. Расскажите о концепции в анкете и задайте ключевые вопросы: «Интересен ли вам такой продукт?», «Сколько готовы заплатить?». Даже простая форма на сайте может дать массу ценной информации."
              />
              <Method
                num="02"
                title="Глубинные интервью и фокус-группы"
                text="Несколько бесед с реальными пользователями проясняют мотивации и скрытые сомнения. Вживую можно показать прототип или варианты дизайна и услышать подробную обратную связь. Ответы «живых» людей часто дают инсайты, которые не выявить через сухую статистику."
              />
              <Method
                num="03"
                title="Тестовые рекламные кампании и лендинги"
                text="Создайте несколько посадочных страниц с разными УТП и запустите недорогую рекламу. Так вы проверите реальный интерес: сколько людей кликает, подписывается или оставляет заявку. A/B-тест до релиза может показать, какая идея собрала втрое больше кликов."
              />
              <Method
                num="04"
                title="Минимально жизнеспособный продукт (MVP)"
                text="Соберите базовую версию продукта и предложите её ограниченной группе пользователей. MVP-тестирование выявит, готовы ли люди использовать и платить за ваше решение."
              />
              <Method
                num="05"
                title="Проверка спроса и рынка"
                text="Оцените объём рынка, динамику трендов и конкурентов. Интернет-опросы и интервью дополните данными аналитики: сколько людей искали подобный продукт, что говорят на форумах и в соцсетях."
              />
            </div>
          </Section>

          <Section title="Типичные ошибки без исследований">
            <ul>
              <li>
                <strong className="text-[#24115D] dark:text-white">Запуск «вслепую».</strong>{" "}
                Без анализа целевой аудитории вы рискуете создать продукт, который «не зацепит» ни одного сегмента — слишком дорогой или банально неинтересный.
              </li>
              <li>
                <strong className="text-[#24115D] dark:text-white">Копирование чужих идей.</strong>{" "}
                Копирование конкурентов без согласования с пользователями может привести к плохому соответствию продукта рынку — даже выигрышная функция в одном сегменте может оказаться невостребованной в другом.
              </li>
              <li>
                <strong className="text-[#24115D] dark:text-white">Неучёт реальной цены.</strong>{" "}
                Без обратной связи легко ошибиться с ценой — либо назначить слишком высоко (потребитель не купит), либо слишком низко (потеряете прибыль).
              </li>
              <li>
                <strong className="text-[#24115D] dark:text-white">Маркетинговые просчёты.</strong>{" "}
                Без чёткой картины аудитории трудно выбрать каналы и послания — вы не будете знать, какие рекламные аргументы актуальны.
              </li>
            </ul>
          </Section>

          {/* Highlight */}
          <div className="rounded-[28px] border border-[#D8CEF5] bg-[#F5F2FF] p-7 dark:border-white/12 dark:bg-white/8">
            <p className="text-[17px] leading-[1.65] text-[#35236B] dark:text-white/80">
              «Глубокий анализ рынка и понимание потенциальных пользователей могут максимизировать шансы на достижение соответствия продукта рынку.»
            </p>
          </div>

          <Section title="Выводы">
            <p>
              Перед выпуском нового продукта не стоит полагаться на интуицию и домыслы. Отсутствие исследований — один из главных факторов провала. Зато анкетирование и интервью клиентов дают конкретные ответы: нужен ли продукт, как его улучшить и кому его предлагать.
            </p>
            <p>
              Используйте современные платформы для исследований: это позволяет быстро собрать данные без больших затрат времени. Поддерживайте постоянный диалог с аудиторией — через опросы и фокус-группы — и корректируйте стратегию по мере появления новой информации.
            </p>
            <p>
              Запускайте новый продукт с опорой на данные, а не на догадки. Изучите аудиторию заранее — и вы минимизируете риски, а ваш продукт найдёт своего покупателя.
            </p>
          </Section>
        </div>

        {/* ── CTA ── */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-[28px] bg-[#1C0C4C] px-8 py-10 text-center dark:bg-white/8">
          <p className="text-[22px] font-semibold text-white sm:text-[26px]">
            Изучите аудиторию до старта продаж
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
          <Link
            href="/"
            className="text-[14px] font-semibold text-[#6438D9] transition-colors hover:text-[#4E28B5] dark:text-[#A98BFF] dark:hover:text-white"
          >
            ← На главную
          </Link>
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
      <div className="mt-4 space-y-4 text-[16px] leading-[1.7] [&_li]:ml-5 [&_li]:list-disc [&_li]:text-[15px] [&_ul]:mt-3 [&_ul]:space-y-3">
        {children}
      </div>
    </div>
  );
}

function Method({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#ECE5FA] text-[13px] font-bold text-[#6438D9] dark:bg-white/10 dark:text-[#A98BFF]">
        {num}
      </div>
      <div>
        <p className="text-[16px] font-semibold text-[#24115D] dark:text-white">{title}</p>
        <p className="mt-1 text-[15px] leading-[1.65] text-[#4F417A] dark:text-white/65">{text}</p>
      </div>
    </div>
  );
}
