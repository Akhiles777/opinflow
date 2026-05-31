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
    <div className="rounded-[18px] border border-dash-border bg-dash-card p-5 transition-all duration-200 hover:border-[#6D3AE2]/35">
      {icon ? (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#6D3AE2] text-white shadow-[0_8px_20px_rgba(109,58,226,0.30)]">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-[28px] font-bold leading-none text-dash-heading tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-dash-muted">{label}</p>
      {trend ? (
        <p className={["mt-2 text-[12px] font-medium", trendUp ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"].join(" ")}>
          {trendUp ? "↑ " : "↓ "}{trend}
        </p>
      ) : null}
    </div>
  );
}
