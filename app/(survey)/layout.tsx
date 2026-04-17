import Link from "next/link";
import Image from "next/image";

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-3xl items-center px-6">
          <Link href="/" className="group flex items-center gap-2">
            <Image
              src="/favicon.png"
              alt="ПотокМнений"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
            <span className="font-display text-sm font-bold text-white">
              ПотокМнений
            </span>
          </Link>
        </div>
      </header>
      <main className="pt-14">{children}</main>
    </div>
  );
}