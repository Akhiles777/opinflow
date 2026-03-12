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
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-200 dark:border-green-500/20",
  pending:
    "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:border-yellow-500/20",
  rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/20",
  draft:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-white/60 dark:border-white/10",
  moderation:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20",
  completed:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-200 dark:border-purple-500/20",
};

export default function Badge({ variant, children, className }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold font-body",
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

