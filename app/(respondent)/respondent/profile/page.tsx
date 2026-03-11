import * as React from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RespondentProfilePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
        Профиль
      </h1>
      <p className="mt-2 text-sm sm:text-base font-body text-white/40">
        Анкета респондента. На Этапе 2 эти поля будут сохраняться в базу.
      </p>

      <div className="mt-8 rounded-2xl border border-white/8 bg-surface-900 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-body text-white/35 mb-2">Город</p>
            <Input placeholder="Москва" />
          </div>
          <div>
            <p className="text-xs font-body text-white/35 mb-2">Возраст</p>
            <Input placeholder="27" />
          </div>
          <div>
            <p className="text-xs font-body text-white/35 mb-2">Доход</p>
            <Input placeholder="60 000 – 90 000 ₽" />
          </div>
          <div>
            <p className="text-xs font-body text-white/35 mb-2">Образование</p>
            <Input placeholder="Высшее" />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-body text-white/35 mb-2">Интересы</p>
          <Input placeholder="Технологии, еда, путешествия" />
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="primary" size="md">
            Сохранить
          </Button>
          <Button variant="secondary" size="md">
            Заполнить позже
          </Button>
        </div>
      </div>
    </div>
  );
}

