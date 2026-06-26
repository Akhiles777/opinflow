"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] border border-[#4A3185] bg-white/[0.07] px-4 text-[14px] font-semibold text-white/86 transition-all hover:bg-white/[0.11] hover:text-white"
    >
      <LogOut className="h-[18px] w-[18px]" />
      Выйти
    </button>
  );
}
