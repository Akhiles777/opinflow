import * as React from "react";
import Button from "@/components/ui/Button";

const queue = [
  { title: "Доставка продуктов: оценка сервиса", client: "ООО Ритейл", created: "Сегодня" },
  { title: "Мобильные банки: доверие и привычки", client: "ИП Петров", created: "Вчера" },
  { title: "Кофе: выбор бренда", client: "ООО Напитки", created: "2 дня назад" },
];

export default function AdminModerationPage() {
  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
        Модерация
      </h1>
      <p className="mt-2 text-sm sm:text-base font-body text-white/40">
        Очередь опросов перед публикацией. Сейчас интерфейс статический.
      </p>

      <div className="mt-8 rounded-2xl border border-white/8 bg-surface-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <p className="text-sm font-semibold text-white/85">Опросы на проверке</p>
          <p className="text-xs font-body text-white/35">{queue.length} шт.</p>
        </div>
        <div className="divide-y divide-white/5">
          {queue.map((item) => (
            <div key={item.title} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">{item.title}</p>
                <p className="text-xs font-body text-white/35 mt-1">
                  {item.client} · {item.created}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="md">Открыть</Button>
                <Button variant="primary" size="md">Одобрить</Button>
                <Button variant="ghost" size="md">Отклонить</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

