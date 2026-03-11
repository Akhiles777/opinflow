"use client";

import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function Input({ className, ...props }: InputProps) {
  const classes = [
    "w-full rounded-2xl border border-white/10 bg-surface-900 px-4 py-3 text-sm text-white placeholder:text-white/35 transition duration-200 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input className={classes} {...props} />;
}
