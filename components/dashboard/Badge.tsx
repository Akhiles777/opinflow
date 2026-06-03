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
    "bg-green-500 text-white border-green-500",
  pending:
    "bg-orange-500/10 text-orange-500 border-orange-400",
  rejected:
    "bg-red-500/10 text-red-500 border-red-300 dark:border-red-500/40",
  draft:
    "bg-dash-bg text-dash-muted border-dash-border",
  moderation:
    "bg-white text-dash-muted border-dash-border",
  completed:
    "bg-white text-[#6D3AE2] border-[#6D3AE2]",
};

export default function Badge({ variant, children, className }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold leading-none",
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
