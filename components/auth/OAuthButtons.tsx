"use client";

import { signIn } from "next-auth/react";

type Props = {
  vkEnabled: boolean;
  yandexEnabled: boolean;
  callbackUrl: string;
};

export default function OAuthButtons({ vkEnabled, yandexEnabled, callbackUrl }: Props) {
  if (!vkEnabled && !yandexEnabled) {
    return null;
  }

  return (
    <>
      <div className="mt-8 grid gap-3">
        {vkEnabled ? (
          <button
            type="button"
            onClick={() => signIn("vk", { callbackUrl })}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8"
          >
            Войти через VK
          </button>
        ) : null}
        {yandexEnabled ? (
          <button
            type="button"
            onClick={() => signIn("yandex", { callbackUrl })}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8"
          >
            Войти через Яндекс
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
