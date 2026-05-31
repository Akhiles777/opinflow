import * as React from "react";

export type DashboardGlyphName =
  | "wallet"
  | "checklist"
  | "survey"
  | "referral"
  | "trend"
  | "layers"
  | "moderation"
  | "users"
  | "money"
  | "warning";

export default function DashboardGlyph({
  name,
  className = "h-5 w-5",
}: {
  name: DashboardGlyphName;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  const glyphs: Record<DashboardGlyphName, React.ReactNode> = {
    wallet: (
      <svg {...common}>
        <path d="M5 8.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10A2.5 2.5 0 0 1 5.5 5H17" />
        <path d="M16 14h4" />
        <circle cx="17" cy="14" r=".8" fill="currentColor" stroke="none" />
      </svg>
    ),
    checklist: (
      <svg {...common}>
        <rect x="5" y="4" width="14" height="16" rx="3" />
        <path d="m8.5 9.5 1.4 1.4 3-3M8.5 15l1.4 1.4 3-3M15 10h1.5M15 15.5h1.5" />
      </svg>
    ),
    survey: (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M8 9h8M8 13h6M8 17h4" />
      </svg>
    ),
    referral: (
      <svg {...common}>
        <circle cx="8" cy="14.5" r="4" />
        <circle cx="16.5" cy="7.5" r="3" />
        <circle cx="17" cy="17" r="2.5" />
        <path d="M11 12 14 9.5M12 16l2.8.5" />
      </svg>
    ),
    trend: (
      <svg {...common}>
        <path d="M4 17 9 12l3.5 3.5L20 8" />
        <path d="M15 8h5v5" />
      </svg>
    ),
    layers: (
      <svg {...common}>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
      </svg>
    ),
    moderation: (
      <svg {...common}>
        <path d="M12 3 5.5 5.5v5.6c0 4.2 2.6 7.7 6.5 9.4 3.9-1.7 6.5-5.2 6.5-9.4V5.5L12 3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    users: (
      <svg {...common}>
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="10" r="2.4" />
        <path d="M3.5 20c.9-3.4 2.7-5 5.5-5s4.6 1.6 5.5 5M14.5 15.8c2.6.1 4.2 1.5 5 4.2" />
      </svg>
    ),
    money: (
      <svg {...common}>
        <rect x="4" y="6" width="16" height="12" rx="3" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M7 9.5v5M17 9.5v5" />
      </svg>
    ),
    warning: (
      <svg {...common}>
        <path d="M12 4 21 20H3L12 4Z" />
        <path d="M12 9v5M12 17h.01" />
      </svg>
    ),
  };

  return glyphs[name];
}
