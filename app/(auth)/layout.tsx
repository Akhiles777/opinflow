import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-surface-950 px-4 py-12 sm:px-6">{children}</div>;
}
