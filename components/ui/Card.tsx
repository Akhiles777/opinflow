import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Card({ className, ...props }: CardProps) {
  const classes = [
    "rounded-2xl border border-white/8 bg-surface-900 p-6 shadow-card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}
