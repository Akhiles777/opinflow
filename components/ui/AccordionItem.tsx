import * as React from "react";

type AccordionItemProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export default function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: AccordionItemProps) {
  return (
    <div className="border-b border-neutral-200 py-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-neutral-900 font-medium"
      >
        <span>{title}</span>
        <span
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-45 text-brand-500" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-64" : "max-h-0"
        }`}
      >
        <div className="pt-3 pb-1 text-sm text-neutral-500 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
