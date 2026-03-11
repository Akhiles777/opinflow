import * as React from "react";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 text-xs font-semibold font-body",
        "text-brand-light bg-brand/10 border border-brand/20",
        "rounded-full px-3 py-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
