import * as React from "react";

type SectionLabelProps = {
  children: React.ReactNode;
};

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-xs font-semibold tracking-[0.15em] uppercase text-brand mb-4">
      {children}
    </p>
  );
}
