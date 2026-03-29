"use client";

import * as React from "react";
import Script from "next/script";
import { signIn } from "next-auth/react";

type Props = {
  appId: string;
  callbackUrl: string;
  mode?: "login" | "register";
};

type VKIDLoginPayload = {
  code?: string;
  device_id?: string;
};

type VKIDTokenResult = {
  access_token?: string;
  email?: string | null;
};

type VKIDUserInfoResult = {
  user?: {
    user_id?: number | string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    avatar_200?: string;
    email?: string | null;
  };
  user_id?: number | string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  avatar_200?: string;
  email?: string | null;
};

type VKIDSDKGlobal = {
  WidgetChain: {
    on: (event: unknown, callback: (payload: unknown) => void | Promise<void>) => VKIDSDKGlobal["WidgetChain"];
  };
  Config: {
    init: (config: Record<string, unknown>) => void;
  };
  ConfigResponseMode: { Callback: string };
  ConfigSource: { LOWCODE: string };
  OneTap: new () => {
    render: (params: { container: HTMLElement; showAlternativeLogin?: boolean }) => VKIDSDKGlobal["WidgetChain"];
  };
  WidgetEvents: { ERROR: unknown };
  OneTapInternalEvents: { LOGIN_SUCCESS: unknown };
  Auth: {
    exchangeCode: (code: string, deviceId: string) => Promise<VKIDTokenResult>;
    userInfo: (accessToken: string) => Promise<VKIDUserInfoResult>;
  };
};

declare global {
  interface Window {
    VKIDSDK?: VKIDSDKGlobal;
  }
}

function VkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.56h-1.8c-.68 0-.89-.54-2.11-1.77-1.06-1.03-1.52-.97-1.52.3v1.47c0 .39-.12.62-1.15.62-1.7 0-3.57-1.03-4.89-2.95C4.91 10.7 4.5 8.7 4.5 8.28c0-.23.09-.44.32-.44h1.8c.54 0 .65.25.83.66.92 2.65 2.46 4.97 3.1 4.97.24 0 .35-.11.35-.72V9.93c-.07-1.29-.75-1.4-.75-1.86 0-.22.18-.44.46-.44h2.83c.46 0 .62.25.62.79v4.24c0 .46.2.62.33.62.24 0 .44-.16.88-.6 1.36-1.52 2.33-3.86 2.33-3.86.13-.27.35-.52.88-.52h1.8c.54 0 .66.28.54.66-.22 1.04-2.4 4.11-2.4 4.11-.19.31-.26.45 0 .79.19.26.81.8 1.22 1.28.76.87 1.34 1.6 1.5 2.1.16.5-.1.75-.6.75z"
        fill="white"
      />
    </svg>
  );
}

function extractProfile(data: VKIDUserInfoResult, fallbackEmail?: string | null) {
  const user = data.user ?? data;
  const id = user.user_id ?? data.user_id;
  const firstName = user.first_name ?? data.first_name ?? "";
  const lastName = user.last_name ?? data.last_name ?? "";
  const name = `${firstName} ${lastName}`.trim() || "Пользователь VK";

  return {
    id: id ? String(id) : "",
    name,
    email: user.email ?? data.email ?? fallbackEmail ?? "",
    image: user.avatar_200 ?? user.avatar ?? data.avatar_200 ?? data.avatar ?? "",
  };
}

export default function VKIDButton({ appId, callbackUrl, mode = "login" }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const initializedRef = React.useRef(false);
  const [sdkReady, setSdkReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const verb = mode === "register" ? "Зарегистрироваться" : "Войти";

  const renderWidget = React.useCallback(() => {
    if (!sdkReady || initializedRef.current || !containerRef.current || typeof window === "undefined") {
      return;
    }

    try {
      const VKID = window.VKIDSDK;

      if (
        !VKID ||
        !VKID.Config?.init ||
        !VKID.ConfigResponseMode?.Callback ||
        !VKID.ConfigSource?.LOWCODE ||
        !VKID.OneTap ||
        !VKID.Auth?.exchangeCode ||
        !VKID.Auth?.userInfo ||
        !VKID.WidgetEvents?.ERROR ||
        !VKID.OneTapInternalEvents?.LOGIN_SUCCESS
      ) {
        setError("VK SDK загружен некорректно. Попробуйте обновить страницу.");
        return;
      }

      VKID.Config.init({
        app: Number(appId),
        redirectUrl: `${window.location.origin}/api/auth/callback/vk`,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: "email",
      });

      containerRef.current.innerHTML = "";

      const oneTap = new VKID.OneTap();
      oneTap
        .render({
          container: containerRef.current,
          showAlternativeLogin: true,
        })
        .on(VKID.WidgetEvents.ERROR, (sdkError) => {
          console.error("[auth][vkid-widget-error]", sdkError);
          setError("Не удалось открыть вход через VK. Попробуйте ещё раз.");
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: unknown) => {
          const loginPayload = payload as VKIDLoginPayload;
          if (!loginPayload.code || !loginPayload.device_id) {
            setError("VK не вернул код авторизации. Попробуйте ещё раз.");
            return;
          }

          setPending(true);
          setError(null);

          try {
            const tokenResult = await VKID.Auth.exchangeCode(loginPayload.code, loginPayload.device_id);
            if (!tokenResult.access_token) {
              throw new Error("VK access token is missing");
            }

            const userInfo = await VKID.Auth.userInfo(tokenResult.access_token);
            const profile = extractProfile(userInfo, tokenResult.email);
            if (!profile.id) {
              throw new Error("VK user id is missing");
            }

            await signIn("vkid", {
              callbackUrl,
              vkUserId: profile.id,
              email: profile.email,
              name: profile.name,
              image: profile.image,
            });
          } catch (sdkError) {
            console.error("[auth][vkid-login-error]", sdkError);
            setError("Вход через VK временно недоступен. Попробуйте позже.");
          } finally {
            setPending(false);
          }
        });

      initializedRef.current = true;
    } catch (sdkError) {
      console.error("[auth][vkid-runtime-error]", sdkError);
      setError("Не удалось инициализировать VK-вход. Используйте email или Яндекс.");
    }
  }, [appId, callbackUrl, sdkReady]);

  React.useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  return (
    <div className="grid gap-3">
      <Script
        src="https://unpkg.com/@vkid/sdk@2.6.1/dist-sdk/umd/index.js"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => setError("Не удалось загрузить VK SDK. Попробуйте позже.")}
      />

      <div className="overflow-hidden rounded-xl" style={{ backgroundColor: "#0077FF" }}>
        <div className="flex items-center justify-center gap-3 px-5 py-3 text-[15px] font-semibold text-white">
          <VkIcon />
          <span>{verb} через VK</span>
        </div>
        <div className="px-2 pb-2">
          <div
            ref={containerRef}
            className="min-h-12 rounded-[10px] bg-white/95 p-1 transition-opacity"
            style={{ opacity: pending ? 0.8 : 1 }}
          />
        </div>
      </div>

      {pending ? <p className="text-[15px] text-white/45">Завершаем вход через VK...</p> : null}
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] text-red-400">
          {error}
        </div>
      ) : null}
    </div>
  );
}
