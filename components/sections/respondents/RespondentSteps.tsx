"use client";

import Image from "next/image";

export default function RespondentSteps() {
  return (
    <section className="bg-white dark:bg-[#160840] pt-10 pb-20 lg:pt-12 lg:pb-28 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">

        {/* Заголовок */}
        <h2 className="text-[40px] sm:text-[54px] lg:text-[68px] font-[800] leading-none tracking-[-0.05em] text-[#1D0B57] dark:text-white mb-8 lg:mb-10">
          4 простых шага
        </h2>

        {/* 
          Макет на десктопе:
          
          [  01  ] [  02  ]          🖥️ ноутбук большой
               [  03  ] [  04🟡]    (перекрывает правую часть)
          
          Нижний ряд смещён вправо на половину карточки.
          Ноутбук начинается с середины 02, уходит вправо и вниз.
          Карточки поверх ноутбука (z-20).
        */}

        {/* Мобайл: вертикальный стак */}
        <div className="flex flex-col gap-4 md:hidden">
          {[
            { num: "01", title: "Зарегистрируйся\nза 1 минуту", desc: "Укажи имя, почту и создай пароль", lime: false },
            { num: "02", title: "Заполни\nинформацию о себе", desc: "Никаких сложных анкет", lime: false },
            { num: "03", title: "Проходи опросы в\nудобное время", desc: "Получай уведомления о новых опросах, которые подходят твоему профилю", lime: false },
            { num: "04", title: "Получай деньги на\nсчёт", desc: "Выводи заработанное на карту, телефон или электронный кошелёк", lime: true },
          ].map((step) => (
            <div
              key={step.num}
              className={`rounded-[24px] p-6 ${step.lime ? "bg-[#DDF247]" : "bg-white dark:bg-white/[0.07] border border-[#E2D9F8] dark:border-white/10"}`}
            >
              <span className={`text-[14px] font-[700] ${step.lime ? "text-[#4A2DB5]" : "text-[#7C5CF5] dark:text-[#9B7FFF]"}`}>{step.num}</span>
              <h3 className={`mt-4 whitespace-pre-line text-[20px] font-[700] leading-[1.1] tracking-[-0.04em] text-[#1D0B57] ${step.lime ? "" : "dark:text-white"}`}>{step.title}</h3>
              <p className={`mt-3 text-[14px] leading-[1.55] ${step.lime ? "text-[#1D0B57]/65" : "text-[#8A80A8] dark:text-white/50"}`}>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Десктоп: точное расположение как на макете */}
        <div className="relative hidden md:block" style={{ minHeight: "440px" }}>

          {/* Ноутбук — абсолютно, z-10, левый край примерно посередине контейнера */}
          <div
            className="absolute z-10"
            style={{
              top: "-100px",
              right: "-80px",
              width: "62%",
            }}
          >
            <Image
              src="/Respondent/img_res.png"
              alt="Платформа ПотокМнений"
              width={2706}
              height={2770}
              sizes="62vw"
              className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(28,12,76,0.10)] dark:drop-shadow-[0_30px_60px_rgba(100,56,217,0.30)]"
            />
          </div>

          {/* Верхний ряд карточек: 01 и 02 — слева, z-20 поверх ноутбука */}
          <div
            className="absolute z-20 flex gap-4"
            style={{ top: "0px", left: "0px", width: "52%" }}
          >
            {/* 01 */}
            <div
              className="flex-1 flex flex-col justify-between rounded-[24px] p-6 bg-white dark:bg-white/[0.07] border border-[#E2D9F8] dark:border-white/10 hover:-translate-y-[2px] transition-transform duration-300"
              style={{ minHeight: "200px" }}
            >
              <span className="text-[14px] font-[700] text-[#7C5CF5] dark:text-[#9B7FFF]">01</span>
              <div>
                <h3 className="whitespace-pre-line text-[20px] lg:text-[22px] font-[700] leading-[1.1] tracking-[-0.04em] text-[#1D0B57] dark:text-white mt-4">
                  {"Зарегистрируйся\nза 1 минуту"}
                </h3>
                <p className="mt-3 text-[13px] lg:text-[14px] leading-[1.55] text-[#8A80A8] dark:text-white/50">
                  Укажи имя, почту и создай пароль
                </p>
              </div>
            </div>

            {/* 02 */}
            <div
              className="flex-1 flex flex-col justify-between rounded-[24px] p-6 bg-white dark:bg-white/[0.07] border border-[#E2D9F8] dark:border-white/10 hover:-translate-y-[2px] transition-transform duration-300"
              style={{ minHeight: "200px" }}
            >
              <span className="text-[14px] font-[700] text-[#7C5CF5] dark:text-[#9B7FFF]">02</span>
              <div>
                <h3 className="whitespace-pre-line text-[20px] lg:text-[22px] font-[700] leading-[1.1] tracking-[-0.04em] text-[#1D0B57] dark:text-white mt-4">
                  {"Заполни\nинформацию о себе"}
                </h3>
                <p className="mt-3 text-[13px] lg:text-[14px] leading-[1.55] text-[#8A80A8] dark:text-white/50">
                  Никаких сложных анкет
                </p>
              </div>
            </div>
          </div>

          {/* Нижний ряд карточек: 03 и 04 — смещены вправо на ~половину карточки */}
          <div
            className="absolute z-20 flex gap-4"
            style={{ top: "220px", left: "13%", width: "52%" }}
          >
            {/* 03 */}
            <div
              className="flex-1 flex flex-col justify-between rounded-[24px] p-6 bg-white dark:bg-white/[0.07] border border-[#E2D9F8] dark:border-white/10 hover:-translate-y-[2px] transition-transform duration-300"
              style={{ minHeight: "200px" }}
            >
              <span className="text-[14px] font-[700] text-[#7C5CF5] dark:text-[#9B7FFF]">03</span>
              <div>
                <h3 className="whitespace-pre-line text-[20px] lg:text-[22px] font-[700] leading-[1.1] tracking-[-0.04em] text-[#1D0B57] dark:text-white mt-4">
                  {"Проходи опросы в\nудобное время"}
                </h3>
                <p className="mt-3 text-[13px] lg:text-[14px] leading-[1.55] text-[#8A80A8] dark:text-white/50">
                  Получай уведомления о новых опросах, которые подходят твоему профилю
                </p>
              </div>
            </div>

            {/* 04 — лаймовая */}
            <div
              className="flex-1 flex flex-col justify-between rounded-[24px] p-6 hover:-translate-y-[2px] transition-transform duration-300"
              style={{ minHeight: "200px", background: "#DDF247" }}
            >
              <span className="text-[14px] font-[700] text-[#4A2DB5]">04</span>
              <div>
                <h3 className="whitespace-pre-line text-[20px] lg:text-[22px] font-[700] leading-[1.1] tracking-[-0.04em] text-[#1D0B57] mt-4">
                  {"Получай деньги на\nсчёт"}
                </h3>
                <p className="mt-3 text-[13px] lg:text-[14px] leading-[1.55] text-[#1D0B57]/65">
                  Выводи заработанное на карту, телефон или электронный кошелёк
                </p>
              </div>
            </div>
          </div>

          {/* Spacer чтобы section имела нужную высоту */}
          <div style={{ height: "380px" }} />

        </div>

      </div>
    </section>
  );
}