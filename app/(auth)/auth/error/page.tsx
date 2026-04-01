import Link from "next/link";

type SearchParams = Promise<{ error?: string; code?: string }>;

const errorMap: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "OAuth настроен некорректно",
    description:
      "Проверьте OAuth-приложение, redirect URI и серверные переменные окружения на Vercel.",
  },
  AccessDenied: {
    title: "Доступ запрещён",
    description: "Провайдер отклонил авторизацию или вы отменили вход.",
  },
  OAuthSignin: {
    title: "Не удалось начать OAuth-вход",
    description: "Провайдер не принял запрос авторизации. Проверьте client id, secret и redirect URI.",
  },
  OAuthCallbackError: {
    title: "Ошибка обратного вызова OAuth",
    description: "Провайдер вернул ошибку после авторизации. Чаще всего это redirect URI или настройки приложения.",
  },
  OAuthAccountNotLinked: {
    title: "Аккаунт уже связан с другим способом входа",
    description: "Попробуйте войти тем способом, которым регистрировались изначально.",
  },
  RESPONDENT_SOCIAL_ONLY: {
    title: "Соцвход доступен не для всех ролей",
    description:
      "Вход и регистрация через соцсети доступны только респондентам. Для заказчика используйте email и пароль.",
  },
  AUTH_UNAVAILABLE: {
    title: "Сервис авторизации временно недоступен",
    description: "Проверьте подключение к базе данных и серверные переменные окружения.",
  },
  VKID_SIGNIN_FAILED: {
    title: "Не удалось завершить вход через VK",
    description: "VK вернул данные, но сервер не смог завершить авторизацию. Проверьте серверные логи и настройки VK ID.",
  },
  CallbackRouteError: {
    title: "Не удалось завершить вход",
    description: "Проверьте серверные логи Auth.js и настройки провайдера.",
  },
  Default: {
    title: "Не удалось выполнить вход",
    description: "Попробуйте снова или войдите по email, пока мы проверяем настройки OAuth.",
  },
};

export default async function AuthErrorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorCode = params.error ?? "Default";
  const credentialsCode = params.code;
  const resolvedCode =
    errorCode === "CredentialsSignin" && credentialsCode ? credentialsCode : errorCode;
  const content = errorMap[resolvedCode] ?? errorMap[errorCode] ?? errorMap.Default;

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-white sm:p-10">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">Ошибка авторизации</p>
      <h1 className="mt-4 font-display text-3xl text-white">{content.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">{content.description}</p>
      <p className="mt-3 text-xs text-white/35">Код ошибки: {resolvedCode}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          К входу
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/8"
        >
          К регистрации
        </Link>
      </div>
    </div>
  );
}
