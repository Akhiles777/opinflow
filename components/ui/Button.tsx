"use client";

import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

type Size = "md" | "lg" | "xl";

type ButtonBaseProps = {
  variant: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
};

type ButtonAsAnchor = ButtonBaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonAsButton = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonProps = ButtonAsAnchor | ButtonAsButton;

const base =
  "inline-flex items-center justify-center font-body font-medium rounded-xl transition-all duration-200 cursor-pointer";

const variants: Record<Variant, string> = {
  primary: "bg-brand hover:bg-brand-dark text-white shadow-glow hover:shadow-glow",
  secondary:
    "border border-site-border text-site-heading bg-site-card hover:bg-site-section hover:border-site-border/80 transition-colors",
  ghost: "text-site-muted hover:text-site-heading hover:bg-site-section transition-colors",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
  xl: "px-9 py-4 text-lg font-semibold",
};

function getClassName(variant: Variant, size: Size, className?: string) {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

export default function Button(props: ButtonProps) {
  const {
    variant,
    size = "md",
    className,
    children,
    ...rest
  } = props;

  const classes = getClassName(variant, size, className);

  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest;
    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { type, ...buttonProps } = rest as ButtonAsButton;

  return (
    <button type={type ?? "button"} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
