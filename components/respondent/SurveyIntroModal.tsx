"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Sparkles, ShieldCheck, Wallet, ClipboardCheck } from "lucide-react";

type Props = {
  userId: string;
  openByDefault: boolean;
};

const STORAGE_VERSION = "v1";

export default function SurveyIntroModal({ userId, openByDefault }: Props) {
  const storageKey = useMemo(
    () => `opinflow-survey-intro-${STORAGE_VERSION}-${userId}`,
    [userId],
  );
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!openByDefault) {
      return;
    }

    const seen = window.localStorage.getItem(storageKey);
    if (seen === "seen") {
      return;
    }

    setMounted(true);
    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [openByDefault, storageKey]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mounted]);

  function handleClose() {
    window.localStorage.setItem(storageKey, "seen");
    setVisible(false);
    window.setTimeout(() => {
      setMounted(false);
    }, 220);
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Закрыть инструкцию"
        onClick={handleClose}
        className={[
          "absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <div
        className={[
          "relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(15,23,42,0.96)_55%)] text-white shadow-2xl transition-all duration-300 sm:max-h-[calc(100vh-3rem)]",
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.97] opacity-0",
        ].join(" ")}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-8 sm:pt-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
              <Sparkles className="h-3.5 w-3.5" />
              Как проходить опросы
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
              Несколько правил перед стартом
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80">
              Здесь собраны короткие рекомендации, которые помогут проходить опросы быстрее,
              спокойнее и без отклонений со стороны антифрод-проверок.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand-light">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold text-white">Отвечайте внимательно</div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Не спешите. Если пропускать смысл вопросов или выбирать ответы случайно, такой
              проход может не засчитаться.
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold text-white">Награда приходит автоматически</div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Если ответы проходят проверку, вознаграждение сразу начисляется в кошелёк. Ничего
              дополнительно подтверждать не нужно.
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/5 p-5 sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-lg font-semibold text-white">Что важно для корректного прохождения</div>
            </div>
            <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-white/80 sm:grid-cols-3">
              <li className="rounded-xl border border-white/6 bg-white/4 px-4 py-3">
                Проходите опрос до конца, не закрывайте вкладку посередине без необходимости.
              </li>
              <li className="rounded-xl border border-white/6 bg-white/4 px-4 py-3">
                Читайте вопросы до конца и давайте последовательные ответы, особенно в матрицах и ранжировании.
              </li>
              <li className="rounded-xl border border-white/6 bg-white/4 px-4 py-3">
                Если опрос вам не подходит по содержанию, просто выберите другой из ленты.
              </li>
            </ul>
          </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/8 bg-white/[0.03] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-white/70">
            Это окно показывается один раз для нового респондента. Его всегда можно закрыть крестиком.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid"
          >
            Понятно, начать
          </button>
        </div>
      </div>
    </div>
  );
}
