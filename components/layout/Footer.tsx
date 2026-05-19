"use client";

import Link from "next/link";
import SmoothHashLink from "@/components/ui/SmoothHashLink";

const navLinks = [
  { label: "Главная", href: "#top" },
  { label: "Респондентам", href: "#respondents" },
  { label: "Бизнесу", href: "#business" },
  { label: "Контакты", href: "#contacts" },
];

const documentLinks = [
  {
    label: "Политика персональных данных",
    href: "/legal/personal-data-policy",
  },
  {
    label: "Пользовательское соглашение",
    href: "/legal/user-agreement",
  },
  {
    label: "Политика cookie",
    href: "/legal/cookies",
  },
];

const integrationLinks = [
  { label: "Битрикс24", href: "#" },
  { label: "amoCRM", href: "#" },
  { label: "Google Analytics", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#FCFBFF] px-4 pb-6 pt-0 lg:px-6 lg:pb-8">

      <div
        className="
          relative
          overflow-hidden

          max-w-[1800px]
          mx-auto

          rounded-[40px]

          border
          border-[#D8D0F4]

          bg-[linear-gradient(135deg,#1C0C4C_0%,#2A136B_45%,#3A1B91_100%)]

          px-6
          sm:px-8
          lg:px-14

          py-10
          lg:py-14
        "
      >
        {/* glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[200px] left-[10%] w-[500px] h-[500px] rounded-full bg-[#6438D9] opacity-25 blur-3xl" />

          <div className="absolute bottom-[-250px] right-[5%] w-[600px] h-[600px] rounded-full bg-[#8F67F5] opacity-20 blur-3xl" />
        </div>

        {/* top */}
        <div
          className="
            relative
            z-10

            flex
            flex-col
            xl:flex-row

            justify-between

            gap-12

            pb-10

            border-b
            border-white/10
          "
        >
          {/* brand */}
          <div className="max-w-[420px]">
            <div className="flex items-center gap-3">
              {/* logo */}
              <div
                className="
                  w-14
                  h-14

                  rounded-[18px]

                  bg-[linear-gradient(135deg,#7B4FF0_0%,#9A7CFF_100%)]

                  flex
                  items-center
                  justify-center

                  shadow-[0_10px_30px_rgba(123,79,240,0.35)]
                "
              >
                <div className="w-5 h-5 rounded-sm bg-white" />
              </div>

              <div>
                <h2
                  className="
                    text-white

                    text-[26px]

                    leading-none

                    tracking-[-0.04em]

                    font-semibold
                  "
                >
                  ПотокМнений
                </h2>

                <p className="mt-1 text-white/50 text-sm">
                  AI Research Platform
                </p>
              </div>
            </div>

            <p
              className="
                mt-6

                text-[16px]

                leading-[1.6]

                text-white/65
              "
            >
              Платформа маркетинговых исследований нового поколения.
              Объединяем бизнес и людей, готовых делиться своим
              мнением.
            </p>

            {/* contacts */}
            <div className="mt-8 flex flex-col gap-3">
              <a
                href="mailto:support@potokmneny.ru"
                className="
                  text-[#E5F667]

                  text-[15px]

                  hover:text-white

                  transition-colors
                "
              >
                support@potokmneny.ru
              </a>

              <a
                href="mailto:legal@potokmneny.ru"
                className="
                  text-white/55

                  text-[15px]

                  hover:text-white

                  transition-colors
                "
              >
                legal@potokmneny.ru
              </a>
            </div>
          </div>

          {/* links */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-3

              gap-10
              lg:gap-16
            "
          >
            {/* nav */}
            <div>
              <h3
                className="
                  text-white

                  text-[17px]

                  font-medium

                  mb-5
                "
              >
                Навигация
              </h3>

              <ul className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <SmoothHashLink
                      href={link.href}
                      className="
                        text-white/60

                        text-[15px]

                        hover:text-white

                        transition-colors
                      "
                    >
                      {link.label}
                    </SmoothHashLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* docs */}
            <div>
              <h3
                className="
                  text-white

                  text-[17px]

                  font-medium

                  mb-5
                "
              >
                Документы
              </h3>

              <ul className="flex flex-col gap-3">
                {documentLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-white/60

                        text-[15px]

                        leading-[1.4]

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

            {/* integrations */}
            <div>
              <h3
                className="
                  text-white

                  text-[17px]

                  font-medium

                  mb-5
                "
              >
                Интеграции
              </h3>

              <ul className="flex flex-col gap-3">
                {integrationLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-white/60

                        text-[15px]

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
          </div>
        </div>

        {/* bottom */}
        <div
          className="
            relative
            z-10

            flex
            flex-col
            md:flex-row

            items-start
            md:items-center

            justify-between

            gap-4

            pt-6
          "
        >
          <p className="text-white/40 text-[14px]">
            © 2026 ПотокМнений. Все права защищены.
          </p>

          <Link
            href="/legal"
            className="
              text-white/50

              text-[14px]

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