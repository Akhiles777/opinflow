import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import SmoothHashLink from "@/components/ui/SmoothHashLink";

const navLinks = [
  { label: "Главная", href: "#top" },
  { label: "Респондентам", href: "#respondents" },
  { label: "Бизнесу", href: "#business" },
  { label: "Документы", href: "/legal" },
  { label: "Контакты", href: "#contacts" },
];

const documentLinks = [
  { label: "Политика персональных данных", href: "/legal/personal-data-policy" },
  { label: "Пользовательское соглашение", href: "/legal/user-agreement" },
  { label: "Оферта для заказчика", href: "/legal/client-offer" },
  { label: "Оферта для респондента", href: "/legal/respondent-offer" },
  { label: "Согласие на обработку ПДн", href: "/legal/personal-data-consent" },
  { label: "Политика cookie", href: "/legal/cookies" },
  { label: "Согласие на публикацию отзыва", href: "/legal/review-consent" },
];

const integrationLinks = [
  { label: "Битрикс24", href: "#" },
  { label: "amoCRM", href: "#" },
  { label: "Яндекс Метрика", href: "#" },
  { label: "Google Analytics", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-site-bg px-4 pt-16 pb-8 sm:px-6 lg:px-8 lg:pt-20" id="contacts">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:pb-16">
          {/* Logo and description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="/">
              <div className="flex items-center gap-2.5">
                <div className="relative h-8 w-8 overflow-hidden">
                  <Image
                    src="/favicon.png"
                    alt="ПотокМнений"
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <span className="font-display text-site-heading font-bold">ПотокМнений</span>
              </div>
            </a>
            <p className="text-sm font-body text-site-muted max-w-xs mt-4 leading-relaxed">
              Платформа маркетинговых исследований нового поколения. Объединяем бизнес и людей.
            </p>
            <div className="mt-4 space-y-1">
              <a
                href="mailto:support@potokmneny.ru"
                className="text-sm font-body text-site-muted hover:text-site-heading block transition-colors"
              >
                support@potokmneny.ru
              </a>
              <a
                href="mailto:gmetalnikov1993@gmail.com"
                className="text-sm font-body text-site-muted transition-colors hover:text-site-heading block"
              >
                gmetalnikov1993@gmail.com
              </a>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-sm font-semibold text-site-heading mb-4">Документы</p>
            <div className="grid gap-2">
              {documentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-body text-site-muted transition-colors hover:text-site-heading"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-sm font-semibold text-site-heading mb-4">Навигация</p>
            <div className="grid gap-2">
              {navLinks.map((link) => (
                link.href.startsWith("#") ? (
                  <SmoothHashLink
                    key={link.href}
                    href={link.href}
                    className="text-sm font-body text-site-muted hover:text-site-heading transition-colors"
                  >
                    {link.label}
                  </SmoothHashLink>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-body text-site-muted hover:text-site-heading transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div>
            <p className="text-sm font-semibold text-site-heading mb-4">Интеграции</p>
            <div className="grid gap-2">
              {integrationLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-body text-site-muted transition-colors hover:text-site-heading"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-site-border text-xs font-body text-site-muted gap-4">
          <span>© 2026 ПотокМнений. Все права защищены.</span>
          <Link href="/legal" className="transition-colors hover:text-site-heading">
            Все юридические документы
          </Link>
        </div>
      </div>
    </footer>
  );
}
