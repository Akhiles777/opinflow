"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { resendVerificationAction } from "@/actions/auth";
import OAuthButtons from "@/components/auth/OAuthButtons";

const errorMap: Record<string, string> = {
  BLOCKED: "Ваш аккаунт заблокирован",
  NOT_VERIFIED: "Подтвердите email. Письмо было отправлено при регистрации.",
  CredentialsSignin: "Неверный email или пароль",
  AUTH_UNAVAILABLE: "Сервис авторизации временно недоступен. Проверьте подключение к базе данных.",
  Configuration: "OAuth-вход пока не настроен. Используйте вход по email или завершите настройку провайдеров.",
};

type Props = {
  vkEnabled: boolean;
  yandexEnabled: boolean;
};

export default function LoginPageClient({ vkEnabled, yandexEnabled }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(
    searchParams.get("error")
      ? errorMap[searchParams.get("error") as string] ?? "Не удалось выполнить вход"
      : null,
  );
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const initialErrorCode = searchParams.get("error");

  async function handleCredentialsLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResendMessage(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError(errorMap[result.error] ?? "Не удалось выполнить вход");
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  function handleResend() {
    startTransition(async () => {
      const response = await resendVerificationAction(email);
      setResendMessage(response.message ?? response.error ?? null);
    });
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:mt-24 sm:p-10">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">Вход</p>
      <h1 className="mt-4 font-display text-3xl text-white">Добро пожаловать</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">Войдите в ПотокМнений через соцсеть или email.</p>

      <OAuthButtons vkEnabled={vkEnabled} yandexEnabled={yandexEnabled} callbackUrl={callbackUrl} />
      {!vkEnabled && !yandexEnabled ? <div className="mt-8" /> : null}

      <form onSubmit={handleCredentialsLogin} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-white/55">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/25" placeholder="mail@example.com" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-white/55">Пароль</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none" />
        </label>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-brand hover:text-brand-light">Забыли пароль?</Link>
        </div>

        {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div> : null}
        {resendMessage ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">{resendMessage}</div> : null}

        {initialErrorCode === "NOT_VERIFIED" ? (
          <button type="button" onClick={handleResend} disabled={pending || !email} className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/15 disabled:opacity-60">
            {pending ? "Отправляем..." : "Отправить повторно"}
          </button>
        ) : null}

        <button type="submit" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
          Войти
        </button>
      </form>

      <p className="mt-6 text-sm text-white/45">
        Нет аккаунта? <Link href="/register" className="text-brand hover:text-brand-light">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
