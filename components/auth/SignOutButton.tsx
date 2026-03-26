"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/8 hover:text-white"
    >
      Выйти
    </button>
  );
}
