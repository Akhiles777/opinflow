"use client";

import * as React from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors"
    >
      {copied ? "Скопировано ✓" : "Скопировать"}
    </button>
  );
}