import * as React from "react";

type GlowOrbProps = {
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
};

export default function GlowOrb({
  size = 400,
  opacity = 0.2,
  color = "#6366F1",
  className = "",
}: GlowOrbProps) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(60px)",
        opacity,
      }}
    />
  );
}
