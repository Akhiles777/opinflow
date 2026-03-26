"use client";

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
            onClick={() => signIn("yandex", { callbackUrl })}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8"
          >
            {verb} через Яндекс
          </button>
        ) : null}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/25">
        <div className="h-px flex-1 bg-white/10" />
        или
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </>
  );
}
