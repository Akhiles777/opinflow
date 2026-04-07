"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordFormAction, validatePasswordResetTokenAction } from "@/actions/auth";

const initialState = { success: false, error: "", message: "" };

export default function ResetPasswordPageClient({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordFormAction, initialState);
  const [tokenState, setTokenState] = React.useState<{ checked: boolean; valid: boolean; error?: string }>({
    checked: false,
    valid: false,
  });

  React.useEffect(() => {
    let active = true;

    validatePasswordResetTokenAction(token).then((result) => {
      if (!active) return;
      setTokenState({ checked: true, valid: result.valid, error: result.error });
    });

    return () => {
      active = false;
    };
  }, [token]);

  if (!tokenState.checked) {
    return <div className="mx-auto max-w-md rounded-2xl border border-white/8 bg-surface-900 p-10 text-center text-[15px] text-white">Проверяем ссылку...</div>;
  }

  if (!tokenState.valid) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:p-10">
        <h1 className="font-display text-3xl text-white">{tokenState.error}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/55">Запросите новую ссылку для восстановления пароля.</p>
        <Link href="/forgot-password" className="mt-8 inline-flex rounded-xl bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark">
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:p-10">
      <p className="text-sm uppercase tracking-[0.25em] text-white/35">Новый пароль</p>
      <h1 className="mt-4 font-display text-3xl text-white">Задайте новый пароль</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">После смены пароля все старые сессии будут завершены.</p>

      {state.success ? (
        <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-[15px] text-emerald-400">
          {state.message}
          <div className="mt-4">
            <Link href="/login" className="inline-flex rounded-xl bg-brand px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-dark">
              Войти
            </Link>
          </div>
        </div>
      ) : (
        <form action={formAction} className="mt-8 grid gap-4">
          <input type="hidden" name="token" value={token} />
          <label className="grid gap-2">
            <span className="text-[15px] text-white/55">Новый пароль</span>
            <input name="password" type="password" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-[15px] text-white outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="text-[15px] text-white/55">Подтвердите пароль</span>
            <input name="confirmPassword" type="password" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-[15px] text-white outline-none" />
          </label>
          {state.error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] text-red-400">{state.error}</div> : null}
          <button type="submit" disabled={isPending} className="rounded-xl bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
            {isPending ? "Сохраняем..." : "Сбросить пароль"}
          </button>
        </form>
      )}
    </div>
  );
}
