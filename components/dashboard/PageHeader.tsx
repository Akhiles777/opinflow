import * as React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-dash-heading">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-base text-dash-muted leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
