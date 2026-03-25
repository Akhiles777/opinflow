import Link from "next/link";
import { resendVerificationAction, verifyEmailTokenAction } from "@/actions/auth";

type SearchParams = Promise<{ token?: string }>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = params.token ?? "";
  const result = await verifyEmailTokenAction(token);

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-white/8 bg-surface-900 p-6 text-center text-white sm:mt-24 sm:p-10">
      <div className={[
        "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl",
        result.success ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
      ].join(" ")}>
        {result.success ? "✓" : "✕"}
      </div>
      <h1 className="mt-6 font-display text-3xl text-white">
        {result.success ? "Email подтверждён" : result.error || "Не удалось подтвердить email"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/55">
        {result.success
          ? "Теперь вы можете войти в аккаунт и продолжить работу с платформой."
          : "Проверьте ссылку или запросите новое письмо для подтверждения email."}
      </p>

      {result.success ? (
        <Link href="/login" className="mt-8 inline-flex rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
          Войти
        </Link>
      ) : result.email ? (
        <form
          action={async () => {
            "use server";
            await resendVerificationAction(result.email as string);
          }}
          className="mt-8"
        >
          <button type="submit" className="rounded-xl border border-brand/30 bg-brand/10 px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/15">
            Отправить новую ссылку
          </button>
        </form>
      ) : null}
    </div>
  );
}
