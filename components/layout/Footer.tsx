import * as React from "react";

const columns = [
  {
    title: "Платформа",
    links: ["Главная", "Респондентам", "Бизнесу", "О нас"],
  },
  {
    title: "Документы",
    links: ["Политика", "Оферта", "Контакты"],
  },
  {
    title: "Соцсети",
    links: ["Telegram", "VK", "YouTube"],
  },
];

export default function Footer() {
  return (
    <footer id="contacts" className="bg-gray-900 border-t border-white/5 pt-16 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-16 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-brand" />
              <span className="font-display">ПотокМнений</span>
            </div>
            <p className="text-sm text-white/40 mt-4 leading-relaxed">
              Платформа для маркетинговых исследований с автоматической аналитикой и быстрыми выплатами.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="text-sm">
              <p className="text-white/60 mb-4 font-semibold">{col.title}</p>
              <div className="grid gap-2">
                {col.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="text-white/20 hover:text-white/60 transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row justify-between pt-10 text-xs text-gray-600">
          <span>© 2025 ПотокМнений</span>
          <span>Политика · Оферта</span>
        </div>
      </div>
    </footer>
  );
}
