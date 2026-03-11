import * as React from "react";

type GlowOrbProps = {
  className?: string;
};

export default function GlowOrb({ className }: GlowOrbProps) {
  const classes = [
    "pointer-events-none absolute rounded-full blur-[80px] opacity-25",
    "bg-[radial-gradient(circle,#4F46E5_0%,transparent_70%)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} />;
}
