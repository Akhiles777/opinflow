import * as React from "react";
import Image from "next/image";
import SmoothHashLink from "@/components/ui/SmoothHashLink";

const navLinks = [
  { label: "Главная", href: "#top" },
  { label: "Респондентам", href: "#respondents" },
  { label: "Бизнесу", href: "#business" },
  { label: "О нас", href: "#about" },
  { label: "Контакты", href: "#contacts" },
];

const legalLinks = [
  "Политика конфиденциальности",
  "Пользовательское соглашение",
  "Оферта",
];

export default function Footer() {
  return (
    <footer className="bg-site-bg px-4 pt-16 pb-10 sm:px-6 lg:px-8 lg:pt-20" id="contacts">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-10 pb-12 lg:grid-cols-[2fr_1fr_1fr] lg:gap-16 lg:pb-16">
          <div>
           <a href="/">
             <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 overflow-hidden">
                <Image
                  src="/favicon.png"
                  alt="ПотокМнений"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="font-display text-site-heading font-bold">ПотокМнений</span>
            </div>
           </a>
            <p className="text-sm font-body text-site-muted max-w-xs mt-4 leading-relaxed">
              Платформа маркетинговых исследований нового поколения. Объединяем бизнес и людей, готовых делиться своим мнением.
            </p>
            <a
              href="mailto:support@potokmneny.ru"
              className="text-sm font-body text-site-muted hover:text-site-heading mt-6 block transition-colors"
            >
              support@potokmneny.ru
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold text-site-heading mb-4">Навигация</p>
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <SmoothHashLink
                  key={link.href}
                  href={link.href}
                  className="text-sm font-body text-site-muted hover:text-site-heading transition-colors"
                >
                  {link.label}
                </SmoothHashLink>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-site-heading mb-4">Документы</p>
            <div className="grid gap-2">
              {legalLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-sm font-body text-site-muted hover:text-site-heading transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between pt-10 text-xs font-body text-site-muted">
          <span>© 2026 ПотокМнений. Все права защищены.</span>
          <span>Политика · Оферта</span>
        </div>
      </div>
    </footer>
  );
}
