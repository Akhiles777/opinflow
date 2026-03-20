"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Tab = { label: string; value: string };

type Props = {
  tabs: Tab[];
  param: string;
  defaultValue: string;
};

export default function Tabs({ tabs, param, defaultValue }: Props) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? defaultValue;

  function hrefFor(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) sp.delete(param);
    else sp.set(param, value);
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="inline-flex w-full items-center rounded-xl border border-dash-border bg-dash-card p-1 sm:w-auto">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <a
            key={t.value}
            href={hrefFor(t.value)}
            className={[
              "flex-1 rounded-lg px-3 py-2 text-center text-sm font-body transition-colors sm:flex-none",
              isActive
                ? "bg-dash-bg text-dash-heading font-medium"
                : "text-dash-muted hover:text-dash-heading",
            ].join(" ")}
          >
            {t.label}
          </a>
        );
      })}
    </div>
  );
}
