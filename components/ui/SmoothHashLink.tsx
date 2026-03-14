"use client";

import * as React from "react";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

export default function SmoothHashLink({ href, onClick, ...rest }: Props) {
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;

        // Only handle same-page hashes.
        if (!href.startsWith("#")) return;
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (!el) return;

        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", href);
      }}
      {...rest}
    />
  );
}

