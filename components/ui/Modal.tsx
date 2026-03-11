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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-card-lg">
        <div className="flex items-start justify-between gap-4">
          {title ? (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          ) : (
            <div />
          )}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/50 transition hover:border-brand/30 hover:text-white"
            >
              Закрыть
            </button>
          ) : null}
        </div>
        <div className="mt-4 text-sm text-white/75">{children}</div>
      </div>
    </div>
  );
}
