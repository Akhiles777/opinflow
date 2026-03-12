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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Закрыть"
      />

      <div className="relative w-full max-w-2xl bg-dash-card border border-dash-border rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dash-border flex items-center justify-between gap-4">
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

        <div className="p-6 text-sm text-dash-body">{children}</div>

        {footer ? (
          <div className="px-6 py-4 border-t border-dash-border bg-dash-bg">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

