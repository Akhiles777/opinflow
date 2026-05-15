"use client";

import * as React from "react";
import Link from "next/link";
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
  VKID_SIGNIN_FAILED:
    "Не удалось завершить вход через VK. Проверьте настройки VK ID и попробуйте ещё раз.",
};

type Props = {
  vkEnabled: boolean;
  vkAppId?: string | null;
  yandexEnabled: boolean;
  initialRole: LoginRole;
  callbackUrl: string;
  initialErrorCode?: string | null;
};

export default function LoginPageClient({
  vkEnabled,
  vkAppId,
  yandexEnabled,
  initialRole,
  callbackUrl,
  initialErrorCode,
}: Props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<LoginRole>(initialRole);
  const [error, setError] = React.useState<string | null>(
    initialErrorCode
      ? errorMap[initialErrorCode] ?? "Не удалось выполнить вход"
      : null,
  );
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [credentialsPending, setCredentialsPending] = React.useState(false);

  React.useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  React.useEffect(() => {
    setError(
      initialErrorCode
        ? errorMap[initialErrorCode] ?? "Не удалось выполнить вход"
        : null,
    );
    setResendMessage(null);
  }, [initialErrorCode]);

  React.useEffect(() => {
    setError((currentError) => {
      if (!currentError) {
        return null;
      }

      if (role === "CLIENT" && currentError === errorMap.RESPONDENT_SOCIAL_ONLY) {
        return null;
      }

      return currentError;
    });
    setResendMessage(null);
  }, [role]);

  async function handleCredentialsLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResendMessage(null);
    setCredentialsPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError(errorMap[result.error] ?? "Не удалось выполнить вход");
      setCredentialsPending(false);
      return;
    }

    window.location.assign(result?.url ?? callbackUrl);
  }

  function handleResend() {
    startTransition(async () => {
      const response = await resendVerificationAction(email);
      setResendMessage(response.message ?? response.error ?? null);
    });
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-site-border bg-site-card p-6 text-site-body shadow-card sm:p-10">
      <p className="text-sm uppercase tracking-[0.25em] text-site-muted">Вход</p>
      <h1 className="mt-4 font-display text-3xl text-site-heading">Добро пожаловать</h1>
      <p className="mt-3 text-sm leading-relaxed text-site-body/80">
        Войдите в ПотокМнений. Для респондентов доступен вход через соцсети, для заказчиков
        только вход по email.
      </p>

      {role === "RESPONDENT" ? (
        <OAuthButtons
          vkEnabled={vkEnabled}
          vkAppId={vkAppId}
          yandexEnabled={yandexEnabled}
          callbackUrl={callbackUrl}
          mode="login"
        />
      ) : (
        <div className="mt-6 mb-5 rounded-2xl border border-site-border bg-site-section p-4 text-[15px] leading-relaxed text-site-body/80">
          Для заказчиков вход через соцсети отключён. Используйте email и пароль, с которыми
          был создан аккаунт.
        </div>
      )}
      {role === "RESPONDENT" && !vkEnabled && !yandexEnabled ? <div className="mt-8" /> : null}

      <form onSubmit={handleCredentialsLogin} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-[15px] text-site-body/80">Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-11 rounded-xl border border-site-border bg-site-bg px-3 text-[15px] text-site-heading outline-none placeholder:text-site-muted focus:border-brand/40" placeholder="mail@example.com" disabled={credentialsPending} />
        </label>
        <label className="grid gap-2">
          <span className="text-[15px] text-site-body/80">Пароль</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="h-11 rounded-xl border border-site-border bg-site-bg px-3 text-[15px] text-site-heading outline-none focus:border-brand/40" disabled={credentialsPending} />
        </label>

        <div className="flex justify-end">
          <Link
            href={`/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-[15px] text-brand hover:text-brand-light"
          >
            Забыли пароль?
          </Link>
        </div>

        {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] text-red-400">{error}</div> : null}
        {resendMessage ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[15px] text-emerald-400">{resendMessage}</div> : null}

        {initialErrorCode === "NOT_VERIFIED" ? (
          <button type="button" onClick={handleResend} disabled={pending || !email} className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-[15px] font-semibold text-brand transition-colors hover:bg-brand/15 disabled:opacity-60">
            {pending ? "Отправляем..." : "Отправить повторно"}
          </button>
        ) : null}

        <button type="submit" disabled={credentialsPending} className="rounded-xl bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
          {credentialsPending ? "Входим..." : "Войти"}
        </button>
      </form>

      <p className="mt-6 text-[15px] text-site-muted">
        Нет аккаунта?{" "}
        <Link
          href={`/register?role=${role}&callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-brand hover:text-brand-light"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
