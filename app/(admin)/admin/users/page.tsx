import * as React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const users = [
  { email: "user1@mail.ru", role: "RESPONDENT", status: "ACTIVE" },
  { email: "brand@company.ru", role: "CLIENT", status: "ACTIVE" },
  { email: "suspect@mail.ru", role: "RESPONDENT", status: "BLOCKED" },
];

export default function AdminUsersPage() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
            Пользователи
          </h1>
          <p className="mt-2 text-sm sm:text-base font-body text-white/40">
            Поиск, блокировки и роли. На Этапе 5 подключим реальную админ-логику.
          </p>
        </div>
        <div className="w-full sm:w-[360px]">
          <Input placeholder="Поиск по email" />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/8 bg-surface-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <p className="text-sm font-semibold text-white/85">Список</p>
        </div>
        <div className="divide-y divide-white/5">
          {users.map((u) => (
            <div key={u.email} className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">{u.email}</p>
                <p className="text-xs font-body text-white/35 mt-1">
                  Роль: <span className="text-white/55">{u.role}</span> · Статус:{" "}
                  <span className="text-white/55">{u.status}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="md">Открыть</Button>
                <Button variant="ghost" size="md">{u.status === "BLOCKED" ? "Разблок" : "Блок"}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

