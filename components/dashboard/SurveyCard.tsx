import Link from "next/link";

type Status = "available" | "in-progress" | "completed";

type Props = {
  category: string;
  title: string;
  reward?: number | null;
  duration?: number | null;
  questions?: number | null;
  maxResponses?: number | null;
  currentResponses?: number | null;
  clientRating?: number;
  clientName?: string;
  status: Status;
  meta?: string;
  link: string;
  suitable?: boolean;
};

function Badge({ label, variant }: { label: string; variant: "green" | "purple" | "yellow" | "gray" }) {
  const styles = {
    green:  "bg-green-500/10 text-green-600 border border-green-500 dark:text-green-400",
    purple: "bg-[#6D3AE2]/10 text-[#6D3AE2] border border-[#6D3AE2] dark:text-[#A98BFF] dark:border-[#6D3AE2]",
    yellow: "bg-orange-500/10 text-orange-500 border border-orange-400",
    gray:   "bg-dash-bg text-dash-muted border border-dash-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[12px] font-semibold leading-none ${styles[variant]}`}>
      {label}
    </span>
  );
}

export default function SurveyCard({
  category,
  title,
  reward,
  duration,
  questions,
  maxResponses,
  currentResponses,
  clientRating,
  clientName,
  status,
  meta,
  link,
  suitable = false,
}: Props) {
  const progress =
    typeof maxResponses === "number" && maxResponses > 0 && typeof currentResponses === "number"
      ? Math.min((currentResponses / maxResponses) * 100, 100)
      : 0;

  return (
    <div className="rounded-[18px] border border-dash-border bg-dash-card p-6 transition-all duration-200 hover:border-[#6D3AE2]/40">
      {/* Top row: badges + price */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {status === "available" && <Badge label="Доступен" variant="green" />}
          {status === "in-progress" && <Badge label="В работе" variant="yellow" />}
          {status === "completed" && <Badge label="Завершён" variant="gray" />}
          {suitable && <Badge label="Подходит Вам" variant="purple" />}
        </div>
        {typeof reward === "number" && (
          <div className="shrink-0 text-right">
            <p className="text-[24px] font-semibold leading-none text-dash-heading tabular-nums">{reward} ₽</p>
            {typeof duration === "number" && (
              <p className="mt-1 text-[13px] font-medium text-dash-muted">~ {duration} мин</p>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <p className=" line-clamp-2 text-[20px] font-semibold leading-[1.15] text-dash-heading">
        {title}
      </p>

      {/* Category */}
      <p className="mt-1 text-[14px] font-medium text-dash-muted">{category}</p>
      {meta ? <p className="mt-3 text-[13px] font-medium text-dash-muted">{meta}</p> : null}

      {/* Stats row */}
      <div className="mt-6 flex items-center justify-between text-[14px] font-medium text-dash-muted">
        {typeof questions === "number" && <span>{questions} вопросов</span>}
        {typeof maxResponses === "number" && typeof currentResponses === "number" && (
          <span>{currentResponses}/{maxResponses} респондентов</span>
        )}
      </div>

      {/* Progress bar */}
      {typeof maxResponses === "number" && maxResponses > 0 && (
        <div className="mt-3 h-[5px] overflow-hidden rounded-full bg-[repeating-linear-gradient(to_right,rgba(109,58,226,0.26)_0_18px,transparent_18px_23px)]">
          <div
            className="h-full rounded-full bg-[#6D3AE2] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Bottom row: author + button */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[15px] text-dash-muted">
          {clientName && (
            <>
              <span className="font-medium text-dash-heading">{clientName}</span>
              {typeof clientRating === "number" && (
                <span className="flex items-center gap-1 rounded-[6px] border border-[#6D3AE2]/35 bg-[#6D3AE2]/10 px-1.5 py-1 text-[13px] text-dash-heading">
                  <span className="text-[14px] text-amber-400">★</span>
                  <span>{clientRating.toFixed(1)}</span>
                </span>
              )}
            </>
          )}
        </div>
        <Link
          href={link}
          className="shrink-0 rounded-xl bg-[#7244F5] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.45)] transition-all hover:bg-[#6238DC]"
        >
          Пройти опрос
        </Link>
      </div>
    </div>
  );
}
