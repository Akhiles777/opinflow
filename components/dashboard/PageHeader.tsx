import * as React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0">
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.03em] text-dash-heading sm:text-[38px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-[16px] font-medium leading-relaxed text-dash-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="min-w-0 w-full lg:w-auto">{right}</div> : null}
    </div>
  );
}
