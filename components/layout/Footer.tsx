"use client";

import Image from "next/image";
import Link from "next/link";
import SmoothHashLink from "@/components/ui/SmoothHashLink";

const navLinks = [
  { label: "Главная", href: "/#top" },
  { label: "Респондентам", href: "/respondents", accent: true },
  { label: "Бизнесу", href: "/#business" },
  { label: "О нас", href: "/#about" },
  { label: "Контакты", href: "/#contacts" },
];

const documentLinks = [
  {
    label: "Политика персональных данных",
    href: "/legal/personal-data-policy",
  },
  {
    label: "Согласие на обработку ПДн",
    href: "/legal/personal-data-consent",
  },
  {
    label: "Пользовательское соглашение",
    href: "/legal/user-agreement",
  },
  {
    label: "Оферта для респондента",
    href: "/legal/respondent-offer",
  },
  {
    label: "Оферта для заказчика",
    href: "/legal/client-offer",
  },
  {
    label: "Политика cookie",
    href: "/legal/cookies",
  },
  {
    label: "Согласие на публикацию отзыва",
    href: "/legal/review-consent",
  },
];

export default function Footer() {
  return (
    <footer id="contacts" className="bg-[#FCFBFF] dark:bg-[#1C0C4C] px-3 pb-4 sm:px-4 lg:px-6 lg:pb-6">
      <div
        className="
          relative
          overflow-hidden

          mx-auto
          max-w-[1800px]

          rounded-[34px]
          sm:rounded-[42px]

          border
          border-[#3E248D]

          bg-[#1F0A5A]

          px-5
          sm:px-8
          lg:px-14

          pt-8
          sm:pt-10
          lg:pt-14

          pb-5
          sm:pb-6
        "
      >
        {/* glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="
              absolute
              left-[-120px]
              top-[-120px]

              w-[380px]
              h-[380px]

              rounded-full

              bg-[#6438D9]/25

              blur-3xl
            "
          />

          <div
            className="
              absolute
              right-[-180px]
              bottom-[-180px]

              w-[520px]
              h-[520px]

              rounded-full

              bg-[#7B4FF0]/20

              blur-3xl
            "
          />
        </div>

        {/* top */}
        <div
          className="
            relative
            z-10

            grid
            grid-cols-1
            lg:grid-cols-[1.2fr_1fr_0.7fr]

            gap-12
            lg:gap-20
          "
        >
          {/* BRAND */}
          <div className="max-w-[420px]">
            <div className="flex items-center gap-4">
              {/* LOGO */}
              <div className="relative h-[70px] w-[70px] shrink-0">
                <Image
                  src="/logo2.png"
                  alt="ПотокМнений"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              {/* TITLE */}
              <h2
                className="
                  text-white

                  text-[24px]
                  sm:text-[28px]

                  leading-none

                  tracking-[-0.05em]

                  font-medium
                "
              >
                ПотокМнений
              </h2>
            </div>

            {/* description */}
            <p
              className="
                mt-6

                max-w-[360px]

                text-[15px]
                sm:text-[16px]

                leading-[1.55]

                text-white/88
              "
            >
              Платформа маркетинговых исследований нового поколения.
              Объединяем бизнес и людей, готовых делиться своим мнением.
            </p>

            {/* contacts */}
            <div className="mt-7 space-y-4">
              <div>
                <p className="text-white/70 text-[15px]">Сотрудничество:</p>
                <a href="mailto:support@potokmneny.ru" className="mt-1 inline-block text-[#E5F667] text-[16px] underline underline-offset-4 hover:text-white transition-colors">
                  support@potokmneny.ru
                </a>
              </div>
              <div>
                <p className="text-white/70 text-[15px]">Правовые обращения:</p>
                <a href="mailto:gmetalnikov1993@gmail.com" className="mt-1 inline-block text-[#E5F667] text-[16px] underline underline-offset-4 hover:text-white transition-colors">
                gmetalnikov1993@gmail.com
                </a>
              </div>
              
            </div>
          </div>

          {/* DOCS */}
          <div>
            <h3
              className="
                text-white/65

                text-[28px]

                tracking-[-0.04em]

                mb-6
              "
            >
              Документы
            </h3>

            <ul className="space-y-3">
              {documentLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="
                      text-white/92

                      text-[15px]
                      sm:text-[16px]

                      leading-[1.35]

                      hover:text-white

                      transition-colors
                    "
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* NAVIGATION */}
          <div>
            <h3
              className="
                text-white/65

                text-[28px]

                tracking-[-0.04em]

                mb-6
              "
            >
              Навигация
            </h3>

            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <SmoothHashLink
                    href={link.href}
                    className={`
                      text-[16px]
                      transition-colors

                      ${
                        link.accent
                          ? "text-[#E5F667]"
                          : "text-white/92 hover:text-white"
                      }
                    `}
                  >
                    {link.label}
                  </SmoothHashLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* bottom */}
        <div
          className="
            relative
            z-10

            mt-10
            sm:mt-12

            rounded-[22px]

            border
            border-white/5

            bg-white/6
            backdrop-blur-xl

            px-5
            sm:px-7

            py-4

            flex
            flex-col
            md:flex-row

            items-start
            md:items-center

            justify-between

            gap-4
          "
        >
          <p
            className="
              text-white/90

              text-[14px]
              sm:text-[15px]
            "
          >
            © 2026 ПотокМнений. Все права защищены.
          </p>

          <Link
            href="/legal"
            className="
              text-white/90

              text-[14px]
              sm:text-[15px]

              underline
              underline-offset-4

              hover:text-white

              transition-colors
            "
          >
            Все юридические документы
          </Link>
        </div>
      </div>
    </footer>
  );
}
