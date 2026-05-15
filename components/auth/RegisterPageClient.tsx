"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { registerAction } from "@/actions/auth";
import OAuthButtons from "@/components/auth/OAuthButtons";

type Role = "RESPONDENT" | "CLIENT";

type RegisterState = {
  success: boolean;
  error: string;
  message: string;
  email: string;
};

const initialState: RegisterState = {
  success: false,
  error: "",
  message: "",
  email: "",
};

type Props = {
  vkEnabled: boolean;
  vkAppId?: string | null;
  yandexEnabled: boolean;
  initialRole: Role;
  callbackUrl: string;
};

export default function RegisterPageClient({
  vkEnabled,
  vkAppId,
  yandexEnabled,
  initialRole,
  callbackUrl,
}: Props) {
  const [role, setRole] = useState<Role>(initialRole);
  const [state, setState] = useState<RegisterState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const personClient = [
    {
      value: "CLIENT" as const,
      title: "Заказчик",
      text: "Создавать исследования и получать аналитику",
    },
  ];

  const personRespondet = [
    {
      value: "RESPONDENT" as const,
      title: "Респондент",
      text: "Зарабатывать на прохождении опросов",
    },
  ];

  const roleOffer =
    role === "RESPONDENT"
      ? {
          href: "/legal/respondent-offer",
          label: "публичную оферту для респондента",
        }
      : {
          href: "/legal/client-offer",
          label: "публичную оферту для заказчика",
        };

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    if (!state.success) return;

    formRef.current?.reset();
    successRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [state.success]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(initialState);
    setIsSigningIn(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("role", role);
    const submittedPassword = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await registerAction({}, formData);

      if (!result.success) {
        setState({
          success: false,
          error: result.error ?? "",
          message: result.message ?? "",
          email: result.email ?? "",
        });
        return;
      }

      setState({
        success: true,
        error: "",
        message: result.message ?? "",
        email: result.email ?? "",
      });

      setIsSigningIn(true);

      const signInResult = await signIn("credentials", {
        email: result.email ?? "",
        password: submittedPassword,
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.error) {
        setIsSigningIn(false);
        setState({
          success: true,
          error:
            "Аккаунт создан, но автоматический вход не сработал. Войдите вручную.",
          message:
            "Аккаунт создан. Теперь можно войти по email и паролю.",
          email: result.email ?? "",
        });
        return;
      }

      window.location.assign(signInResult?.url ?? callbackUrl);
    });
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-site-border bg-site-card p-6 text-site-body shadow-card sm:p-10">
      <p className="text-sm uppercase tracking-[0.25em] text-site-muted">
        Регистрация
      </p>

      <h1 className="mt-4 font-display text-3xl text-site-heading">
        {state.success ? "Проверьте почту" : "Создайте аккаунт"}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-site-body/80">
        {state.success
          ? "Мы создали аккаунт и отправили письмо со ссылкой для подтверждения email."
          : "Зарегистрируйтесь по email, подтвердите адрес и войдите в свой кабинет."}
      </p>

      {/* SUCCESS BLOCK */}
      {state.success ? (
        <div
          ref={successRef}
          className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-[16px] leading-7 text-emerald-200"
        >
          <p className="text-[16px] font-semibold text-emerald-100">
            {isSigningIn ? "Входим в аккаунт" : "Аккаунт создан"}
          </p>

          <p className="mt-2 text-[15px] leading-7 text-emerald-200/90">
            {state.message}
          </p>

          {state.error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] leading-7 text-red-300">
              {state.error}
            </div>
          ) : null}

          {isSigningIn ? (
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-emerald-400/15">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-white/80" />
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/login?role=${role}&callbackUrl=${encodeURIComponent(
                  callbackUrl
                )}`}
                className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Перейти ко входу
              </Link>

              <button
                type="button"
                onClick={() => setState(initialState)}
                className="inline-flex items-center justify-center rounded-xl border border-site-border bg-site-section px-5 py-3 text-[15px] font-semibold text-site-heading transition-colors hover:bg-site-bg"
              >
                Зарегистрировать ещё
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* role cards */}
         <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
  {personRespondet.map((item) => (
    <button
      key={item.value}
      type="button"
      onClick={() => setRole(item.value)}
      className={[
        "rounded-2xl border px-4 py-3 text-left transition-colors",
        role === item.value
          ? "border-brand bg-brand/10"
          : "border-site-border bg-site-section hover:bg-site-bg",
      ].join(" ")}
    >
      <p className="text-[15px] font-semibold text-site-heading leading-tight">
        {item.title}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-site-body/80">
        {item.text}
      </p>
    </button>
  ))}

  {personClient.map((item) => (
    <button
      key={item.value}
      type="button"
      onClick={() => setRole(item.value)}
      className={[
        "rounded-2xl border px-4 py-3 text-left transition-colors",
        role === item.value
          ? "border-brand bg-brand/10"
          : "border-site-border bg-site-section hover:bg-site-bg",
      ].join(" ")}
    >
      <p className="text-[15px] font-semibold text-site-heading leading-tight">
        {item.title}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-site-body/80">
        {item.text}
      </p>
    </button>
  ))}
</div>

          {/* SOCIAL */}
          {role === "RESPONDENT" ? (
            <OAuthButtons
              vkEnabled={vkEnabled}
              vkAppId={vkAppId}
              yandexEnabled={yandexEnabled}
              callbackUrl={callbackUrl}
              mode="register"
            />
          ) : (
            <div className="mt-5 rounded-2xl border border-site-border bg-site-section p-4 text-[15px] leading-7 text-site-body/80">
              Регистрация через соцсети доступна только респондентам. Для
              заказчика создайте аккаунт по email.
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <input type="hidden" name="role" value={role} />

            <label className="grid gap-2">
              <span className="text-[15px] text-site-body/80">Имя</span>
              <input
                name="name"
                className="h-11 rounded-xl border border-site-border bg-site-bg px-3 text-[15px] text-site-heading outline-none placeholder:text-site-muted focus:border-brand/40"
                placeholder="Ваше имя"
                disabled={isPending || isSigningIn}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[15px] text-site-body/80">Email</span>
              <input
                name="email"
                type="email"
                className="h-11 rounded-xl border border-site-border bg-site-bg px-3 text-[15px] text-site-heading outline-none placeholder:text-site-muted focus:border-brand/40"
                placeholder="mail@example.com"
                disabled={isPending || isSigningIn}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[15px] text-site-body/80">Пароль</span>
              <input
                name="password"
                type="password"
                className="h-11 rounded-xl border border-site-border bg-site-bg px-3 text-[15px] text-site-heading outline-none focus:border-brand/40"
                placeholder="Минимум 8 символов"
                disabled={isPending || isSigningIn}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[15px] text-site-body/80">
                Подтвердите пароль
              </span>
              <input
                name="confirmPassword"
                type="password"
                className="h-11 rounded-xl border border-site-border bg-site-bg px-3 text-[15px] text-site-heading outline-none focus:border-brand/40"
                disabled={isPending || isSigningIn}
              />
            </label>

            {/* LEGAL BLOCK — FIXED */}
            <label className="flex items-start gap-3 rounded-xl border border-site-border bg-site-section p-4 text-[15px] leading-7 text-site-body/85">
              <input
                name="acceptTerms"
                type="checkbox"
                disabled={isPending || isSigningIn}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded-md border border-site-border bg-site-bg text-brand accent-brand transition hover:scale-[1.05] focus:ring-2 focus:ring-brand/40 focus:ring-offset-0"
              />

              <span className="leading-7">
                Я принимаю{" "}
                <Link
                  href={roleOffer.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-light underline-offset-4 hover:underline"
                >
                  {roleOffer.label}
                </Link>
                ,{" "}
                <Link
                  href="/legal/user-agreement"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-light underline-offset-4 hover:underline"
                >
                  пользовательское соглашение
                </Link>
                , ознакомлен(а) с{" "}
                <Link
                  href="/legal/personal-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-light underline-offset-4 hover:underline"
                >
                  политикой обработки персональных данных
                </Link>{" "}
                и даю{" "}
                <Link
                  href="/legal/personal-data-consent"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-light underline-offset-4 hover:underline"
                >
                  согласие на обработку персональных данных
                </Link>
                .
              </span>
            </label>

            {state.error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] leading-7 text-red-400">
                {state.error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending || isSigningIn}
              className="mt-2 rounded-xl bg-brand px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Создаём аккаунт..."
                : isSigningIn
                ? "Входим..."
                : "Зарегистрироваться"}
            </button>
          </form>

          <p className="mt-6 text-[15px] text-site-muted">
            Уже есть аккаунт?{" "}
            <Link
              href={`/login?role=${role}&callbackUrl=${encodeURIComponent(
                callbackUrl
              )}`}
              className="text-brand hover:text-brand-light"
            >
              Войти
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
