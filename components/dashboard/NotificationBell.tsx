"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  items: NotificationItem[];
  unreadCount: number;
};

function formatNotificationTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMarkingRead, setIsMarkingRead] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as NotificationsResponse;
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchNotifications();

    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications]);

  React.useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [fetchNotifications, isOpen]);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleMarkAllRead() {
    if (!unreadCount || isMarkingRead) {
      return;
    }

    setIsMarkingRead(true);

    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      if (!response.ok) {
        return;
      }

      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } finally {
      setIsMarkingRead(false);
    }
  }

  function handleNotificationClick() {
    setIsOpen(false);

    if (!unreadCount) {
      return;
    }

    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    void fetch("/api/notifications", { method: "PATCH" });
  }

  const unreadItems = items.filter((item) => !item.isRead).slice(0, 5);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-dash-border bg-dash-card text-dash-muted transition-all duration-200 hover:bg-dash-bg hover:text-dash-heading"
        aria-label="Уведомления"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          {/* Мобильный оверлей */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Панель уведомлений:
              - мобиль: fixed, снизу, полная ширина, скруглена сверху
              - десктоп: absolute, под кнопкой справа */}
          <div className="
            fixed bottom-0 left-0 right-0 z-50
            rounded-t-2xl
            lg:absolute lg:bottom-auto lg:left-auto lg:right-0 lg:top-11
            lg:w-[24rem] lg:rounded-2xl
            overflow-hidden border border-dash-border bg-dash-card shadow-2xl
          ">
            {/* Ручка-индикатор на мобиле */}
            <div className="flex justify-center pt-3 pb-1 lg:hidden">
              <div className="h-1 w-10 rounded-full bg-dash-border" />
            </div>

            <div className="flex items-center justify-between border-b border-dash-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-dash-heading">Уведомления</p>
                <p className="mt-0.5 text-xs text-dash-muted">
                  {unreadCount > 0 ? `Непрочитанных: ${unreadCount}` : "Все уведомления прочитаны"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                disabled={!unreadCount || isMarkingRead}
                className="text-xs font-semibold text-brand transition-colors hover:text-brand-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarkingRead ? "Отмечаем..." : "Отметить все"}
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto lg:max-h-96">
              {isLoading ? (
                <div className="px-4 py-6 text-sm text-dash-muted">Загрузка уведомлений...</div>
              ) : unreadItems.length > 0 ? (
                unreadItems.map((item) => {
                  const content = (
                    <div className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-dash-bg">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-5 text-dash-heading">
                            {item.title}
                          </p>
                          <span className="shrink-0 whitespace-nowrap text-[11px] text-dash-muted">
                            {formatNotificationTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-dash-body">{item.body}</p>
                      </div>
                    </div>
                  );

                  if (item.link) {
                    return (
                      <Link
                        key={item.id}
                        href={item.link}
                        onClick={handleNotificationClick}
                        className="block border-b border-dash-border last:border-b-0"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.id} className="border-b border-dash-border last:border-b-0">
                      {content}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-sm text-dash-muted">
                  Новых уведомлений нет
                </div>
              )}
            </div>

            {/* Safe area для мобиля (iPhone Home Indicator) */}
            <div className="pb-safe lg:pb-0" />
          </div>
        </>
      ) : null}
    </div>
  );
}
