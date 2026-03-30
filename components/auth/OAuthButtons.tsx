"use client";

import * as React from "react";
import Image from "next/image";
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
            className="flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#E53517] hover:opacity-95 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            style={{ backgroundColor: "#FC3F1D" }}
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

      <div className="my-6 flex items-center gap-3 text-sm uppercase tracking-[0.25em] text-white/25">
        <div className="h-px flex-1 bg-white/10" />
        или
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </>
  );
}
