import * as React from "react";

type Variant =
  | "active"
  | "pending"
  | "rejected"
  | "draft"
  | "moderation"
  | "completed";

type Props = {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
};

const styles: Record<Variant, string> = {
  active:
    "bg-green-500/10 text-green-600 border-green-500 dark:text-green-400",
  pending:
    "bg-orange-500/10 text-orange-500 border-orange-400",
  rejected:
    "bg-red-500/10 text-red-500 border-red-300 dark:border-red-500/40",
  draft:
    "bg-dash-bg text-dash-muted border-dash-border",
  moderation:
    "bg-[#6D3AE2]/10 text-[#6D3AE2] border-[#6D3AE2] dark:text-[#A98BFF]",
  completed:
    "bg-[#6D3AE2] text-white border-[#6D3AE2]",
};

export default function Badge({ variant, children, className }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-[6px] border px-2 py-1 text-xs font-semibold leading-none",
        styles[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
