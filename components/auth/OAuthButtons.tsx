"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import VKIDButton from "@/components/auth/VKIDButton";

type Props = {
  vkEnabled: boolean;
  vkAppId?: string | null;
  yandexEnabled: boolean;
  callbackUrl: string;
  mode?: "login" | "register";
};

export default function OAuthButtons({
  vkEnabled,
  vkAppId,
  yandexEnabled,
  callbackUrl,
  mode = "login",
}: Props) {
  const [pendingProvider, setPendingProvider] = React.useState<"yandex" | null>(null);

  if (!vkEnabled && !yandexEnabled) {
    return null;
  }

  const verb = mode === "register" ? "Зарегистрироваться" : "Войти";

  return (
    <>
      <div className="mt-8 grid gap-3">
        {vkEnabled && vkAppId ? (
          <VKIDButton
            key={`vkid-${mode}-${callbackUrl}`}
            appId={vkAppId}
            callbackUrl={callbackUrl}
            mode={mode}
          />
        ) : null}
        {yandexEnabled ? (
          <button
            type="button"
            onClick={() => {
              if (pendingProvider !== null) {
                return;
              }
              setPendingProvider("yandex");
              void signIn("yandex", { callbackUrl });
            }}
            disabled={pendingProvider !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FC3F1D] px-5 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#E53517] hover:opacity-95 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Image
              src="/yandexAuth.png"
              alt="Yandex"
              width={20}
              height={20}
              className="h-8 w-8 rounded-sm object-contain"
            />
            {pendingProvider === "yandex" ? "Перенаправляем в Яндекс..." : `${verb} через Яндекс`}
          </button>
        ) : null}
      </div>

      {mode === "register" ? (
        <p className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 text-[13px] leading-relaxed text-white/55">
          Продолжая регистрацию через соцсети, вы принимаете{" "}
          <Link
            href="/legal/respondent-offer"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-light underline-offset-4 hover:underline"
          >
            публичную оферту для респондента
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
          , подтверждаете ознакомление с{" "}
          <Link
            href="/legal/personal-data-policy"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-light underline-offset-4 hover:underline"
          >
            политикой обработки персональных данных
          </Link>{" "}
          и даёте{" "}
          <Link
            href="/legal/personal-data-consent"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-light underline-offset-4 hover:underline"
          >
            согласие на обработку персональных данных
          </Link>
          .
        </p>
      ) : null}

      <div className="my-6 flex items-center gap-3 text-sm uppercase tracking-[0.25em] text-white/25">
        <div className="h-px flex-1 bg-white/10" />
        или
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </>
  );
}
