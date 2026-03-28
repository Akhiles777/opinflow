"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/auth";

const initialState = { success: false, error: "", message: "" };

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:mt-24 sm:p-10">
      <p className="text-sm uppercase tracking-[0.25em] text-white/35">Восстановление пароля</p>
      <h1 className="mt-4 font-display text-3xl text-white">Сброс пароля</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">
        Введите email, и мы отправим ссылку для смены пароля.
      </p>

      <form action={formAction} className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-[15px] text-white/55">Email</span>
          <input name="email" type="email" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-[15px] text-white outline-none placeholder:text-white/25" placeholder="mail@example.com" />
        </label>

        {state.error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] text-red-400">{state.error}</div> : null}
        {state.success ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[15px] text-emerald-400">{state.message}</div> : null}

        <button type="submit" disabled={isPending} className="rounded-xl bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
          {isPending ? "Отправляем..." : "Отправить ссылку"}
        </button>
      </form>

      <p className="mt-6 text-[15px] text-white/45">
        Вспомнили пароль? <Link href="/login" className="text-brand hover:text-brand-light">Вернуться ко входу</Link>
      </p>
    </div>
  );
}
