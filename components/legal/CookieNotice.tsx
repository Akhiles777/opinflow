"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "opinflow_cookie_notice_accepted";

export default function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(localStorage.getItem(STORAGE_KEY) !== "true");
  }, []);

  function acceptCookies() {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-5xl rounded-3xl border border-site-border bg-site-card/95 p-4 text-site-body shadow-card backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-site-heading">Мы используем cookie</p>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-site-body/80 dark:text-site-body">
            Cookie помогают поддерживать работу сайта, сохранять настройки и улучшать сервис. Продолжая
            пользоваться сайтом, вы соглашаетесь с{" "}
            <Link href="/legal/cookies" className="font-semibold text-brand underline-offset-4 hover:underline">
              политикой использования cookie
            </Link>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={acceptCookies}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
