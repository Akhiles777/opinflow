"use client";

import * as React from "react";
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
        {vkEnabled && vkAppId ? <VKIDButton appId={vkAppId} callbackUrl={callbackUrl} mode={mode} /> : null}
        {yandexEnabled ? (
          <button
            type="button"
            onClick={() => {
              setPendingProvider("yandex");
              void signIn("yandex", { callbackUrl });
            }}
            disabled={pendingProvider !== null}
            className="rounded-xl border border-[#FC3F1D]/30 bg-[#FC3F1D] px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#E53818] disabled:cursor-wait disabled:opacity-70"
          >
            {pendingProvider === "yandex" ? "Перенаправляем в Яндекс..." : `${verb} через Яндекс`}
          </button>
        ) : null}
      </div>

      <div className="my-6 flex items-center gap-3 text-sm uppercase tracking-[0.25em] text-white/25">
        <div className="h-px flex-1 bg-white/10" />
        или
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </>
  );
}
