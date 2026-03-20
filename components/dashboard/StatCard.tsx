import * as React from "react";

type Props = {
  icon?: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
};

export default function StatCard({ icon, label, value, trend, trendUp }: Props) {
  return (
    <div className="bg-dash-card border border-dash-border rounded-2xl p-6 hover:shadow-md transition-shadow">
      {icon ? (
        <div className="w-10 h-10 bg-brand/10 rounded-xl text-brand mb-4 flex items-center justify-center">
          {icon}
        </div>
      ) : null}
      <p className="text-base text-dash-muted font-body mb-1">{label}</p>
      <p className="font-display text-3xl text-dash-heading font-bold tabular-nums sm:text-4xl">
        {value}
      </p>
      {trend ? (
        <p
          className={[
            "text-sm mt-2 font-body",
            trendUp ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400",
          ].join(" ")}
        >
          {trendUp ? "↑ " : "↓ "}
          {trend}
        </p>
      ) : null}
    </div>
  );
}
