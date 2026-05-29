"use client";
import * as React from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const faqs = [
  { q: "Как быстро я получу результаты?", a: "Первые ответы появляются в течение нескольких часов после запуска опроса. Полный сбор данных — от 1 до 3 дней в зависимости от аудитории." },
  { q: "Какое качество данных вы гарантируете?", a: "Мы применяем 5-уровневую систему антифрода: проверка скорости, дублей устройств, IP-адресов и подозрительных паттернов. Некачественные ответы автоматически отсеиваются." },
  { q: "Можно ли выгрузить данные?", a: "Да, все данные доступны для экспорта. Базовая аналитика — в интерфейсе, полный отчёт — в PDF через кнопку в кабинете." },
  { q: "Как происходит оплата?", a: "Оплата через ЮKassa. Заказчик пополняет баланс, средства списываются по мере сбора ответов. Неизрасходованный остаток можно вернуть." },
  { q: "Есть ли пробный период?", a: "Вы можете запустить тестовый опрос с минимальным бюджетом от 1 000₽ чтобы оценить качество данных перед масштабированием." },
];

export default function FAQMain() {
  const [active, setActive] = React.useState<number | null>(null);
  return (
    <section className="bg-white py-20 lg:py-28 px-4 lg:px-6">
      <div className="mx-auto max-w-[1400px] px-2 lg:px-10">
        <RevealOnScroll>
          <h2 className="font-manrope text-center text-[36px] sm:text-[50px] lg:text-[62px] font-[800] tracking-[-2px] text-[#1C0C4C] leading-[0.95] mb-12 lg:mb-16">
            Частые вопросы
          </h2>
        </RevealOnScroll>
        <div className="mx-auto max-w-[800px]">
          {faqs.map((faq, i) => {
            const open = active === i;
            return (
              <div key={faq.q} className="border-b border-[#E8E4F5] last:border-b-0">
                <button type="button" onClick={() => setActive(open ? null : i)}
                  className="w-full flex items-center justify-between gap-4 py-5 sm:py-6 text-left">
                  <span className="text-[17px] sm:text-[19px] font-medium text-[#1C0C4C]">{faq.q}</span>
                  <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-200 ${open ? "border-[#6438D9] bg-[#6438D9] text-white" : "border-[#D4CBF0] bg-white text-[#6438D9]"}`}>
                    <span className={`text-[18px] leading-none transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
                  </div>
                </button>
                <div className={`overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="pb-5 text-[15px] lg:text-[16px] leading-[1.65] text-[#6B5F9E]">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
