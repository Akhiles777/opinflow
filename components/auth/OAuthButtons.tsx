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

function YandexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.4 2H11c-3.9 0-6 2-6 5.3 0 2.7 1.3 4.3 3.8 5.9L6 22h3.1l2.6-8.3h1.1L15.5 22H19l-3-8.9C17.7 11.5 19 9.7 19 7c0-3.2-1.9-5-5.6-5zm-.3 9.3h-1V4.7h1c2.1 0 3.1 1 3.1 3.1 0 2.3-1.1 3.5-3.1 3.5z"
        fill="white"
      />
    </svg>
  );
}

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
              if (pendingProvider !== null) {
                return;
              }
              setPendingProvider("yandex");
              void signIn("yandex", { callbackUrl });
            }}
            disabled={pendingProvider !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#E53517] hover:opacity-95 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            style={{ backgroundColor: "#FC3F1D" }}
          >
            <YandexIcon />
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
