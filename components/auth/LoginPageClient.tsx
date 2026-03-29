"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { resendVerificationAction } from "@/actions/auth";
import OAuthButtons from "@/components/auth/OAuthButtons";

type LoginRole = "RESPONDENT" | "CLIENT";

const errorMap: Record<string, string> = {
  BLOCKED: "Ваш аккаунт заблокирован",
  NOT_VERIFIED: "Подтвердите email. Письмо было отправлено при регистрации.",
  CredentialsSignin: "Неверный email или пароль",
  AUTH_UNAVAILABLE: "Сервис авторизации временно недоступен. Проверьте подключение к базе данных.",
  Configuration: "OAuth-вход пока не настроен. Используйте вход по email или завершите настройку провайдеров.",
  RESPONDENT_SOCIAL_ONLY:
    "Вход через соцсети доступен только респондентам. Для заказчика используйте вход по email.",
};

type Props = {
  vkEnabled: boolean;
  yandexEnabled: boolean;
};

export default function LoginPageClient({ vkEnabled, yandexEnabled }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeFromQuery: LoginRole = searchParams.get("role") === "CLIENT" ? "CLIENT" : "RESPONDENT";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<LoginRole>(modeFromQuery);
  const [error, setError] = React.useState<string | null>(
    searchParams.get("error")
      ? errorMap[searchParams.get("error") as string] ?? "Не удалось выполнить вход"
      : null,
  );
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const initialErrorCode = searchParams.get("error");

  React.useEffect(() => {
    setRole(modeFromQuery);
  }, [modeFromQuery]);

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
    <div className="mx-auto  max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:mt-24 sm:p-10">
      <p className="text-sm uppercase tracking-[0.25em] text-white/35">Вход</p>
      <h1 className="mt-4 font-display text-3xl text-white">Добро пожаловать</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">
        Войдите в ПотокМнений. Для респондентов доступен вход через соцсети, для заказчиков
        только вход по email.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            value: "RESPONDENT" as const,
            title: "Респондент",
            text: "Вход по email, VK или Яндексу",
          },
          {
            value: "CLIENT" as const,
            title: "Заказчик",
            text: "Вход только по email и паролю",
          },
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
            <p className="mt-2 text-[15px] leading-relaxed text-white/45">{item.text}</p>
          </button>
        ))}
      </div>

      {role === "RESPONDENT" ? (
        <OAuthButtons
          vkEnabled={vkEnabled}
          yandexEnabled={yandexEnabled}
          callbackUrl={callbackUrl}
          mode="login"
        />
      ) : (
        <div className="mt-6  mb-5 rounded-2xl border border-white/8 bg-white/5 p-4 text-[15px] leading-relaxed text-white/55">
          Для заказчиков вход через соцсети отключён. Используйте email и пароль, с которыми
          был создан аккаунт.
        </div>
      )}
      {role === "RESPONDENT" && !vkEnabled && !yandexEnabled ? <div className="mt-8" /> : null}

      <form onSubmit={handleCredentialsLogin} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-[15px] text-white/55">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-[15px] text-white outline-none placeholder:text-white/25" placeholder="mail@example.com" />
        </label>
        <label className="grid gap-2">
          <span className="text-[15px] text-white/55">Пароль</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-[15px] text-white outline-none" />
        </label>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[15px] text-brand hover:text-brand-light">Забыли пароль?</Link>
        </div>

        {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] text-red-400">{error}</div> : null}
        {resendMessage ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[15px] text-emerald-400">{resendMessage}</div> : null}

        {initialErrorCode === "NOT_VERIFIED" ? (
          <button type="button" onClick={handleResend} disabled={pending || !email} className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-[15px] font-semibold text-brand transition-colors hover:bg-brand/15 disabled:opacity-60">
            {pending ? "Отправляем..." : "Отправить повторно"}
          </button>
        ) : null}

        <button type="submit" className="rounded-xl bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark">
          Войти
        </button>
      </form>

      <p className="mt-6 text-[15px] text-white/45">
        Нет аккаунта?{" "}
        <Link href={`/register?role=${role}`} className="text-brand hover:text-brand-light">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
