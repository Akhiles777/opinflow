import Link from "next/link";

export default async function SurveyCompletePage({
  searchParams,
}: {
  searchParams?: Promise<{ rewarded?: string; amount?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const rewarded = params.rewarded === "true";
  const amount = Number(params.amount ?? 0);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-site-bg px-6 py-12 text-site-body">
      <div className="w-full max-w-2xl rounded-[2rem] border border-site-border bg-site-card p-8 text-center shadow-2xl sm:p-12">
        <div className={[
          "mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl",
          rewarded ? "bg-green-500/20 text-green-500 dark:text-green-300" : "bg-site-section text-site-heading",
        ].join(" ")}>
          {rewarded ? "🎉" : "✓"}
        </div>

        <h1 className="mt-6 font-display text-4xl font-bold text-site-heading">
          {rewarded ? "Спасибо за ответы!" : "Опрос завершён"}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-site-muted">
          {rewarded ? "Ваши ответы приняты, и вознаграждение уже начислено на кошелёк." : "Ваши ответы приняты. Мы сохранили прохождение и обновим статистику в кабинете."}
        </p>

        {rewarded ? (
          <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 px-6 py-5 text-green-400">
            <div className="text-sm uppercase tracking-[0.22em] text-green-300/70">Начислено</div>
            <div className="mt-2 font-display text-4xl font-bold">+{amount} ₽</div>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/surveys" className="inline-flex items-center justify-center rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid">
            Найти новые опросы
          </Link>
          {rewarded ? (
            <Link href="/respondent/wallet" className="inline-flex items-center justify-center rounded-2xl border border-site-border bg-site-section px-6 py-3 text-sm font-semibold text-site-heading transition-colors hover:bg-site-card">
              Перейти к кошельку
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
