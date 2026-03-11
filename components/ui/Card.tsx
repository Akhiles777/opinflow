import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Card({ className, ...props }: CardProps) {
  const classes = [
    "rounded-[24px] border border-ink/10 bg-paper p-6 shadow-soft",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}
