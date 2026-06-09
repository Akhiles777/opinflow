import Link from "next/link";

export default async function RespondentSurveyCompletePage({
  searchParams,
}: {
  searchParams?: Promise<{ rewarded?: string; amount?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const rewarded = params.rewarded === "true";
  const amount = Number(params.amount ?? 0);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-dash-border bg-dash-card p-8 text-center sm:p-12">
        <div
          className={[
            "mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl",
            rewarded ? "bg-green-500/20 text-green-500 dark:text-green-300" : "bg-dash-bg text-dash-heading",
          ].join(" ")}
        >
          {rewarded ? "🎉" : "✓"}
        </div>

        <h1 className="mt-6 text-3xl font-bold text-dash-heading">
          {rewarded ? "Спасибо за ответы!" : "Опрос завершён"}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-dash-muted">
          {rewarded
            ? "Ваши ответы приняты, и вознаграждение уже начислено на кошелёк."
            : "Ваши ответы приняты. Мы сохранили прохождение и обновим статистику в кабинете."}
        </p>

        {rewarded ? (
          <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 px-6 py-5 text-green-400">
            <div className="text-sm uppercase tracking-[0.22em] text-green-300/70">Начислено</div>
            <div className="mt-2 text-4xl font-bold">+{amount} ₽</div>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/respondent/feed"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid"
          >
            Найти новые опросы
          </Link>
          {rewarded ? (
            <Link
              href="/respondent/wallet"
              className="inline-flex items-center justify-center rounded-xl border border-dash-border bg-dash-bg px-6 py-3 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-card"
            >
              Перейти к кошельку
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
