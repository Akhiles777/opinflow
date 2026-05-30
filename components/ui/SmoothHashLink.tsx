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

        const isSamePageHash = href.startsWith("#");
        const isHomeHash = href.startsWith("/#") && window.location.pathname === "/";
        if (!isSamePageHash && !isHomeHash) return;

        const id = href.slice(href.indexOf("#") + 1);
        const el = document.getElementById(id);
        if (!el) return;

        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", isSamePageHash ? href : `/#${id}`);
      }}
      {...rest}
    />
  );
}
