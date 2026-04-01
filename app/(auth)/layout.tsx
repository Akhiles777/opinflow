import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-950 px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
      <div className="mx-auto mb-1 flex max-w-md">
        <Link
          href="/"
          className="inline-flex mt-2 mb-3 items-center gap-2 text-sm font-semibold text-white/55 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 " />
          На главную
        </Link>
      </div>
      {children}
    </div>
  );
}
