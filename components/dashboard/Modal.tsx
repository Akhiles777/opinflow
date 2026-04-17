"use client";

import * as React from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({ open, title, onClose, children, footer }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Закрыть"
      />

      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-dash-border bg-dash-card shadow-xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-dash-border px-6 py-4">
          <div>
            {title ? (
              <p className="font-display text-lg text-dash-heading">{title}</p>
            ) : (
              <div />
            )}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-dash-border bg-dash-bg px-3 py-2 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors"
            >
              Закрыть
            </button>
          ) : null}
        </div>

        <div className="min-h-0 overflow-y-auto p-6 text-sm text-dash-body">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-dash-border bg-dash-bg px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
