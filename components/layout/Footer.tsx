import * as React from "react";

const navLinks = [
  "Главная",
  "Респондентам",
  "Бизнесу",
  "О нас",
  "Контакты",
];

const legalLinks = [
  "Политика конфиденциальности",
  "Пользовательское соглашение",
  "Оферта",
];

export default function Footer() {
  return (
    <footer className="bg-surface-950 border-t border-white/5 pt-20 pb-10 px-8" id="contacts">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-16 pb-16 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-brand" />
              <span className="font-display text-white font-bold">OpinionFlow</span>
            </div>
            <p className="text-sm font-body text-white/20 max-w-xs mt-4 leading-relaxed">
              Автоматизированная платформа маркетинговых исследований. Соединяем бренды и аудиторию.
            </p>
            <a
              href="mailto:support@potokmneny.ru"
              className="text-sm font-body text-white/25 hover:text-white mt-6 block"
            >
              support@potokmneny.ru
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/50 mb-4">Навигация</p>
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-sm font-body text-white/20 hover:text-white/60 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white/50 mb-4">Документы</p>
            <div className="grid gap-2">
              {legalLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-sm font-body text-white/20 hover:text-white/60 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between pt-10 text-xs font-body text-white/15">
          <span>© 2025 ПотокМнений. Все права защищены.</span>
          <span>Политика · Оферта</span>
        </div>
      </div>
    </footer>
  );
}
