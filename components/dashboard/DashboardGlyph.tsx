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

const P = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function DashboardGlyph({
  name,
  className = "h-5 w-5",
}: {
  name: DashboardGlyphName;
  className?: string;
}) {
  switch (name) {
    /* ── Admin: Опросы на модерации ── */
    case "moderation":
      return (
        <svg {...P} className={className}>
          {/* 3/4-окружность (линза лупы) — открыта вверху-справа */}
          <path d="M17.5 11C17.5 14.59 14.59 17.5 11 17.5C7.41 17.5 4.5 14.59 4.5 11C4.5 7.41 7.41 4.5 11 4.5" />
          {/* строки документа в правом верхнем углу */}
          <path d="M14 4.5h5.5M14 7.5h4" />
          {/* ручка лупы */}
          <path d="M16.5 16.5 21 21" />
        </svg>
      );

    /* ── Admin: Новые пользователи — точные пути из Icons 24px.svg ── */
    case "users":
      return (
        <svg {...P} className={className}>
          {/* голова пользователя */}
          <path d="M11.46 13.73a2.81 2.81 0 1 0 0-5.62 2.81 2.81 0 0 0 0 5.62Z" />
          {/* плечи */}
          <path d="M16.65 20.2c0-2.33-2.32-4.23-5.19-4.23s-5.19 1.9-5.19 4.23" />
          {/* большой круг вокруг */}
          <path d="M21 12.5a9.5 9.5 0 1 1-6-8.76" />
          {/* кружок с плюсом (новый) */}
          <path d="M23 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
          <path d="M20.49 4.98h-2.98M19 3.52v2.99" />
        </svg>
      );

    /* ── Admin: Оборот за месяц — точные пути из Icons_money.svg ── */
    case "money":
      return (
        <svg {...P} className={className}>
          {/* задний кошелёк */}
          <path d="M19.3 7.92v5.15c0 3.08-1.76 4.4-4.4 4.4H6.11a5.2 5.2 0 0 1-1-.09 3.35 3.35 0 0 1-.99-.33C2.62 16.59 1.71 15.29 1.71 13.07V7.92c0-3.08 1.76-4.4 4.4-4.4h8.79c2.24 0 3.85.95 4.28 3.12.07.4.12.81.12 1.28Z" />
          {/* передний кошелёк */}
          <path d="M22.3 10.92v5.15c0 3.08-1.76 4.4-4.4 4.4H9.11a4.2 4.2 0 0 1-1.99-.33C5.93 19.71 5.12 18.8 4.83 17.34c.4.09.83.13 1.28.13h8.79c2.64 0 4.4-1.32 4.4-4.4v-5.15c0-2.54-1.22-3.88-3.12-4.28C18.08 4.04 22.3 5.38 22.3 10.92Z" />
          {/* монета */}
          <path d="M10.5 13.14a2.64 2.64 0 1 0 0-5.28 2.64 2.64 0 0 0 0 5.28Z" />
          {/* вертикальные линии по бокам */}
          <path d="M4.78 8.3v4.4M16.22 8.3v4.4" />
        </svg>
      );

    /* ── Admin: Выплачено респондентам — точные пути из Icons_money_res.svg ── */
    case "wallet":
      return (
        <svg {...P} className={className}>
          {/* монета */}
          <path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M18.5 9.5v5" />
          {/* кружок с галочкой */}
          <path d="M9 18a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
          <path d="M3.44 18 4.43 18.99 6.56 17.02" />
          {/* корпус кошелька */}
          <path d="M2 15.3V9c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v6c0 3.5-2 5-5 5H8.5" />
        </svg>
      );

    /* ── Общие глифы ── */
    case "checklist":
      return (
        <svg {...P} className={className}>
          <rect x="5" y="4" width="14" height="16" rx="3" />
          <path d="m8.5 9.5 1.4 1.4 3-3M8.5 15l1.4 1.4 3-3M15 10h1.5M15 15.5h1.5" />
        </svg>
      );
    case "survey":
      return (
        <svg {...P} className={className}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <path d="M8 9h8M8 13h6M8 17h4" />
        </svg>
      );
    case "referral":
      return (
        <svg {...P} className={className}>
          <circle cx="8" cy="14.5" r="4" />
          <circle cx="16.5" cy="7.5" r="3" />
          <circle cx="17" cy="17" r="2.5" />
          <path d="M11 12 14 9.5M12 16l2.8.5" />
        </svg>
      );
    case "trend":
      return (
        <svg {...P} className={className}>
          <path d="M4 17 9 12l3.5 3.5L20 8" />
          <path d="M15 8h5v5" />
        </svg>
      );
    case "layers":
      return (
        <svg {...P} className={className}>
          <path d="m12 3 8 4-8 4-8-4 8-4Z" />
          <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
        </svg>
      );
    case "warning":
      return (
        <svg {...P} className={className}>
          <path d="M12 4 21 20H3L12 4Z" />
          <path d="M12 9v5M12 17h.01" />
        </svg>
      );
    default:
      return null;
  }
}
