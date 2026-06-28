"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/dashboard/Modal";
import { requestTurnkeyAction } from "@/actions/turnkey";

const ITEMS = [
  { title: "Разработка анкеты и аудитории", desc: "Профессиональный методолог составит вопросы и портрет вашей ЦА." },
  { title: "Запуск опроса под ключ", desc: "Мы берём на себя техническую часть и контроль качества." },
  { title: "200 респондентов", desc: "Сбор целевой, верифицированной выборки." },
  { title: "Анализ данных человеком", desc: "Не просто график, а экспертный разбор цифр." },
  { title: "Поиск инсайтов и выводы", desc: "Мы найдём скрытые смыслы и дадим рекомендации." },
  { title: "Онлайн-презентация", desc: "Встреча с командой, разбор результатов и ответы на вопросы." },
];

export default function TurnkeyOrderModal() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setSent(false);
    setError(null);
    setOpen(true);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await requestTurnkeyAction();
      if ("error" in result) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-xl border border-brand/40 bg-brand/8 px-5 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/15"
      >
        Опрос под ключ
      </button>

      <Modal
        open={open}
        title="Заказ опроса под ключ"
        onClose={() => setOpen(false)}
        footer={
          sent ? null : (
            <div className="flex items-center justify-between gap-4">
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="ml-auto inline-flex items-center justify-center rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
              >
                {isPending ? "Отправляем…" : "Оставить заявку"}
              </button>
            </div>
          )
        }
      >
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
              <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-dash-heading">Заявка отправлена!</p>
            <p className="text-sm text-dash-muted">Мы свяжемся с вами в течение рабочего дня.</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl border border-dash-border px-5 py-2 text-sm font-semibold text-dash-heading hover:bg-dash-bg transition-colors"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-dash-heading">Полный цикл исследования с привлечением экспертов</p>
              <p className="mt-1 text-dash-muted">
                Мы берём на себя всю работу: от создания вопросов до защиты результатов перед вашей командой.
              </p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-dash-muted">В стоимость включено:</p>
              <ol className="space-y-3">
                {ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-dash-heading">{item.title}</p>
                      <p className="text-dash-muted">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap gap-4 rounded-2xl border border-brand/20 bg-brand/6 px-5 py-4">
              <div>
                <p className="text-xs text-dash-muted">Стоимость</p>
                <p className="text-xl font-bold text-dash-heading">от 150 000 ₽</p>
              </div>
              <div>
                <p className="text-xs text-dash-muted">Срок</p>
                <p className="text-xl font-bold text-dash-heading">10–14 рабочих дней</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
