"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";

import SmoothHashLink from "@/components/ui/SmoothHashLink";
import PublicUserMenu from "@/components/layout/PublicUserMenu";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const { data: session, status } = useSession();

  const user =
    status === "authenticated" && session?.user
      ? {
          name: session.user.name ?? "Пользователь",
          email: session.user.email ?? "",
          image: session.user.image ?? null,
          role: session.user.role,
        }
      : null;

  const links = [
    { label: "Главная", href: "#top" },
    { label: "Респондентам", href: "#respondents" },
    { label: "Бизнесу", href: "#business" },
    { label: "О нас", href: "#about" },
    { label: "Контакты", href: "#contacts" },
  ];

  return (
    <header className="relative z-50 bg-transparent">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[104px] items-center justify-between">

          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
          >
            <div className="relative h-[80px] w-[80px]">

              {/* основа logo.svg */}
              <Image
                src="/logo2.png"
                alt="logo"
                fill
                className="object-contain"
                priority
              />

         
            </div>

            <span
              className="
                text-[22px]
                font-medium
                tracking-[-0.04em]
                text-[#2B1B67]
              "
            >
              ПотокМнений
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-11">
            {links.map((link) => (
              <SmoothHashLink
                key={link.label}
                href={link.href}
                className="
                  text-[17px]
                  font-medium
                  text-[#6E6884]
                  transition-colors
                  hover:text-[#2B1B67]
                "
              >
                {link.label}
              </SmoothHashLink>
            ))}
          </nav>

          {/* ACTIONS */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <PublicUserMenu {...user} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="
                    h-[44px]
                    px-7
                    rounded-[14px]
                    border
                    border-[#DDD5F5]
                    bg-[#F5F2FF]
                    flex
                    items-center
                    justify-center

                    text-[16px]
                    font-medium
                    text-[#2B1B67]

                    transition-all
                    duration-200
                    hover:border-[#C7BAF2]
                    hover:bg-white
                  "
                >
                  Войти
                </Link>

                <Link
                  href="/register"
                  className="
                    h-[44px]
                    px-7
                    rounded-[14px]

                    border
                    border-[#D7EC3A]

                    bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)]

                    flex
                    items-center
                    justify-center

                    text-[16px]
                    font-medium
                    text-[#1C0C4C]

                    transition-all
                    duration-200
                    hover:translate-y-[-1px]
                    hover:shadow-[0_8px_24px_rgba(217,243,38,0.22)]
                  "
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* MOBILE */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="
              lg:hidden
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-[14px]
              border
              border-[#DDD5F5]
              bg-white
            "
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-[#2B1B67]" />
            ) : (
              <Menu className="h-5 w-5 text-[#2B1B67]" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div
            className="
              lg:hidden
              mb-4
              rounded-[28px]
              border
              border-[#E4DEF7]
              bg-white
              p-5
              shadow-[0_20px_60px_rgba(45,20,90,0.08)]
            "
          >
            <div className="flex flex-col gap-5">
              {links.map((link) => (
                <SmoothHashLink
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    text-[17px]
                    font-medium
                    text-[#4B416D]
                  "
                >
                  {link.label}
                </SmoothHashLink>
              ))}
            </div>

            {!user && (
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="
                    h-[46px]
                    rounded-[14px]
                    border
                    border-[#DDD5F5]
                    bg-[#F5F2FF]
                    flex
                    items-center
                    justify-center
                    text-[16px]
                    font-medium
                    text-[#2B1B67]
                  "
                >
                  Войти
                </Link>

                <Link
                  href="/register"
                  className="
                    h-[46px]
                    rounded-[14px]
                    border
                    border-[#D7EC3A]
                    bg-[linear-gradient(180deg,#E5F667_0%,#D9F326_100%)]
                    flex
                    items-center
                    justify-center
                    text-[16px]
                    font-medium
                    text-[#1C0C4C]
                  "
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}