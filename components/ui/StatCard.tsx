import * as React from "react";

type StatCardProps = {
  value: string;
  label: string;
  className?: string;
};

export default function StatCard({ value, label, className }: StatCardProps) {
  const classes = ["flex flex-col gap-2", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <span className="text-2xl font-semibold text-neutral-900">{value}</span>
      <span className="text-sm text-neutral-400">{label}</span>
    </div>
  );
}
