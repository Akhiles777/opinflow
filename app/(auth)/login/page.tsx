import { Suspense } from "react";
import LoginPageClient from "@/components/auth/LoginPageClient";

function hasOAuthCredentials(clientId: string | undefined, clientSecret: string | undefined) {
  return Boolean(clientId?.trim() && clientSecret?.trim() && clientId.trim().length > 5 && clientSecret.trim().length > 5);
}

function hasVkClientId(clientId: string | undefined) {
  return Boolean(clientId?.trim() && clientId.trim().length > 3);
}

function LoginFallback() {
  return (
    <div className="mx-auto  max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:mt-24 sm:p-10">
      <p className="text-sm uppercase tracking-[0.25em] text-white/35">Вход</p>
      <h1 className="mt-4 font-display text-3xl text-white">Добро пожаловать</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">Загружаем форму входа...</p>
    </div>
  );
}

export default function LoginPage() {
  const vkEnabled = hasOAuthCredentials(process.env.VK_CLIENT_ID, process.env.VK_CLIENT_SECRET);
  const yandexEnabled = hasOAuthCredentials(process.env.YANDEX_CLIENT_ID, process.env.YANDEX_CLIENT_SECRET);

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageClient vkEnabled={vkEnabled} yandexEnabled={yandexEnabled} />
    </Suspense>
  );
}
