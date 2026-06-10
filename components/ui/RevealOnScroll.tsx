"use client";

import { useEffect, useRef, useState } from "react";

type RevealOnScrollProps = {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  className?: string;
};

export default function RevealOnScroll({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Start VISIBLE: server renders full content, no opacity:0 in SSR HTML
  const [visible, setVisible] = useState(true);

  const initial =
    direction === "left"
      ? "translateX(-24px)"
      : direction === "right"
      ? "translateX(24px)"
      : "translateY(24px)";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // Element is already in viewport on load — keep it visible, no animation needed
    if (rect.top < window.innerHeight) return;

    // Element is below fold — hide it and animate when scrolled to
    setVisible(false);

    const show = () => setVisible(true);

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          obs.disconnect();
        }
      },
      { threshold: 0, rootMargin: "50px 0px 50px 0px" }
    );
    obs.observe(el);

    // Absolute fallback: show after 600ms even if IO never fires (Safari bug)
    const fallback = setTimeout(show, 600);

    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : initial,
        transition: visible
          ? `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`
          : "none",
      }}
    >
      {children}
    </div>
  );
}
