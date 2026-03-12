import * as React from "react";

type Props = {
  title: string;
  description: string;
  cta?: React.ReactNode;
};

export default function EmptyState({ title, description, cta }: Props) {
  return (
    <div className="bg-dash-card border border-dash-border rounded-2xl p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl border border-dash-border bg-dash-bg flex items-center justify-center text-dash-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
          <path d="M4 7h16" />
          <path d="M6 12h12" />
          <path d="M8 17h8" />
        </svg>
      </div>
      <p className="mt-5 font-display text-xl text-dash-heading">{title}</p>
      <p className="mt-2 text-sm text-dash-muted leading-relaxed">{description}</p>
      {cta ? <div className="mt-6 flex justify-center">{cta}</div> : null}
    </div>
  );
}

