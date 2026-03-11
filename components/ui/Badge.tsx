import * as React from "react";

type BadgeProps = {
  children: React.ReactNode;
};

export default function Badge({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-brand bg-brand-light border border-brand/10 rounded-full px-3 py-1">
      {children}
    </span>
  );
}
