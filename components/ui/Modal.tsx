"use client";

import * as React from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-gutter">
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-[24px] border border-ink/10 bg-paper p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          {title ? (
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
          ) : (
            <div />
          )}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/15 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-ink/70 transition hover:border-purple hover:text-purple"
            >
              Закрыть
            </button>
          ) : null}
        </div>
        <div className="mt-4 text-sm text-ink/80">{children}</div>
      </div>
    </div>
  );
}
