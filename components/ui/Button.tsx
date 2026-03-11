"use client";

import * as React from "react";

type Variant = "primary" | "outline" | "ghost" | "dark";

type Size = "sm" | "md" | "lg";

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
  "inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all duration-200 cursor-pointer";

const variants: Record<Variant, string> = {
  primary: "bg-brand hover:bg-brand-mid text-white shadow-sm hover:shadow-md",
  outline:
    "border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50",
  ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
  dark: "bg-gray-900 hover:bg-gray-800 text-white",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-7 py-3.5",
};

function getClassName(variant: Variant, size: Size, className?: string) {
  return [base, variants[variant], sizes[size], className]
    .filter(Boolean)
    .join(" ");
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
