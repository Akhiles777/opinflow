"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/auth";

const initialState = { success: false, error: "", message: "" };

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-site-border bg-site-card p-6 text-site-body shadow-card sm:p-10">
      <p className="text-sm uppercase tracking-[0.25em] text-site-muted">Восстановление пароля</p>
      <h1 className="mt-4 font-display text-3xl text-site-heading">Сброс пароля</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-site-body/80">
        Введите email, и мы отправим ссылку для смены пароля.
      </p>

      <form action={formAction} className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-[15px] text-site-body/80">Email</span>
          <input name="email"  type="email" className="h-11 rounded-xl border border-site-border bg-site-bg px-3 text-[15px] text-site-heading outline-none placeholder:text-site-muted focus:border-brand/40" placeholder="mail@example.com" />
        </label>

        {state.error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] text-red-400">{state.error}</div> : null}
        {state.success ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[15px] text-emerald-400">{state.message}</div> : null}

        <button type="submit" disabled={isPending} className="rounded-xl bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
          {isPending ? "Отправляем..." : "Отправить ссылку"}
        </button>
      </form>

      <p className="mt-6 text-[15px] text-site-muted">
        Вспомнили пароль? <Link href="/login" className="text-brand hover:text-brand-light">Вернуться ко входу</Link>
      </p>
    </div>
  );
}
