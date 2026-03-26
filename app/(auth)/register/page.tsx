import { Suspense } from "react";
import RegisterPageClient from "@/components/auth/RegisterPageClient";

function hasOAuthCredentials(clientId: string | undefined, clientSecret: string | undefined) {
  return Boolean(clientId?.trim() && clientSecret?.trim() && clientId.trim().length > 5 && clientSecret.trim().length > 5);
}

function hasVkClientId(clientId: string | undefined) {
  return Boolean(clientId?.trim() && clientId.trim().length > 3);
}

function RegisterFallback() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:mt-24 sm:p-10">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">Регистрация</p>
      <h1 className="mt-4 font-display text-3xl text-white">Создайте аккаунт</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">Загружаем форму регистрации...</p>
    </div>
  );
}

export default function RegisterPage() {
  const vkAppId = process.env.VK_CLIENT_ID?.trim() ?? null;
  const vkEnabled = hasVkClientId(process.env.VK_CLIENT_ID);
  const yandexEnabled = hasOAuthCredentials(process.env.YANDEX_CLIENT_ID, process.env.YANDEX_CLIENT_SECRET);

  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPageClient vkEnabled={vkEnabled} vkAppId={vkAppId} yandexEnabled={yandexEnabled} />
    </Suspense>
  );
}
