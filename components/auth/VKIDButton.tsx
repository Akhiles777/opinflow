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

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.VKIDSDK) {
      setSdkReady(true);
    }
  }, []);

  React.useEffect(() => {
    initializedRef.current = false;
    setError(null);
    setPending(false);

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, [appId, callbackUrl, mode]);

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

      <div className="text-[15px] font-semibold text-white">{verb} через VK</div>
      <div
        ref={containerRef}
        className="min-h-12 rounded-xl border border-white/10 bg-white/5 p-1 transition-opacity"
        style={{ opacity: pending ? 0.8 : 1 }}
      />

      {pending ? <p className="text-[15px] text-white/45">Завершаем вход через VK...</p> : null}
      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[15px] text-red-400">
          {error}
        </div>
      ) : null}
    </div>
  );
}
