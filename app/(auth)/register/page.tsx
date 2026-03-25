"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth";

type Role = "RESPONDENT" | "CLIENT";

const initialState = { success: false, error: "", message: "", email: "" };

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const roleFromQuery = searchParams.get("role") === "CLIENT" ? "CLIENT" : "RESPONDENT";
  const [role, setRole] = React.useState<Role>(roleFromQuery);
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  React.useEffect(() => {
    setRole(roleFromQuery);
  }, [roleFromQuery]);

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:mt-24 sm:p-10">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">Регистрация</p>
      <h1 className="mt-4 font-display text-3xl text-white">Создайте аккаунт</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">
        Зарегистрируйтесь по email, подтвердите адрес и войдите в свой кабинет.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { value: "RESPONDENT" as const, title: "Респондент", text: "Зарабатывать на прохождении опросов" },
          { value: "CLIENT" as const, title: "Заказчик", text: "Создавать исследования и получать аналитику" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setRole(item.value)}
            className={[
              "rounded-2xl border p-4 text-left transition-colors",
              role === item.value
                ? "border-brand bg-brand/10"
                : "border-white/8 bg-white/5 hover:bg-white/8",
            ].join(" ")}
          >
            <p className="font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/45">{item.text}</p>
          </button>
        ))}
      </div>

      <form action={formAction} className="mt-8 grid gap-4">
        <input type="hidden" name="role" value={role} />
        <label className="grid gap-2">
          <span className="text-sm text-white/55">Имя</span>
          <input name="name" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/25" placeholder="Ваше имя" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-white/55">Email</span>
          <input name="email" type="email" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/25" placeholder="mail@example.com" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-white/55">Пароль</span>
          <input name="password" type="password" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" placeholder="Минимум 8 символов" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-white/55">Подтвердите пароль</span>
          <input name="confirmPassword" type="password" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" />
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/5 p-4 text-sm text-white/65">
          <input name="acceptTerms" type="checkbox" className="mt-0.5 accent-brand" />
          <span>Согласен с условиями использования и политикой конфиденциальности</span>
        </label>

        {state.error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{state.error}</div> : null}
        {state.success ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">{state.message}</div> : null}

        <button type="submit" disabled={isPending || state.success} className="mt-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
          {isPending ? "Создаём аккаунт..." : "Зарегистрироваться"}
        </button>
      </form>

      <p className="mt-6 text-sm text-white/45">
        Уже есть аккаунт? <Link href="/login" className="text-brand hover:text-brand-light">Войти</Link>
      </p>
    </div>
  );
}

function RegisterFallback() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:mt-24 sm:p-10">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">Регистрация</p>
      <h1 className="mt-4 font-display text-3xl text-white">Создайте аккаунт</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">Загружаем форму регистрации...</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
