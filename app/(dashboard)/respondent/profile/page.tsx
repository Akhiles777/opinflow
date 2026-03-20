import * as React from "react";
import PageHeader from "@/components/dashboard/PageHeader";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-dash-muted font-body">{label}</span>
      {children}
    </label>
  );
}

export default function RespondentProfilePage() {
  return (
    <div>
      <PageHeader title="Профиль" subtitle="Данные аккаунта и анкета респондента." />

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <div className="w-24 h-24 rounded-3xl bg-brand/10 text-brand flex items-center justify-center text-2xl font-bold font-body">
            PM
          </div>
          <p className="mt-5 font-display text-xl text-dash-heading">Пользователь</p>
          <p className="mt-1 text-sm text-dash-muted font-body">user@mail.ru</p>

          <div className="mt-6 grid gap-2">
            <button type="button" className="w-full rounded-xl border border-dash-border bg-dash-bg px-4 py-2.5 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors">
              Изменить фото
            </button>
            <button type="button" className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Изменить пароль
            </button>
          </div>
        </div>

        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Анкета</p>
          <p className="mt-2 text-sm text-dash-muted font-body">
            На Этапе 2 подключим сохранение в базу и валидацию.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Пол">
              <select className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body">
                <option>Женский</option>
                <option>Мужской</option>
              </select>
            </Field>
            <Field label="Дата рождения">
              <input type="date" className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" />
            </Field>
            <Field label="Город">
              <input placeholder="Москва" className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body placeholder:text-dash-muted" />
            </Field>
            <Field label="Уровень дохода">
              <select className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body">
                <option>30–60к</option>
                <option>60–100к</option>
                <option>100к+</option>
              </select>
            </Field>
            <Field label="Образование">
              <select className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body">
                <option>Высшее</option>
                <option>Среднее</option>
              </select>
            </Field>
            <Field label="Интересы">
              <input placeholder="Технологии, еда, спорт" className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body placeholder:text-dash-muted" />
            </Field>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button type="button" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Сохранить изменения
            </button>
            <button type="button" className="rounded-xl border border-dash-border bg-dash-bg px-6 py-3 text-sm font-semibold text-dash-heading hover:bg-dash-card transition-colors">
              Отменить
            </button>
          </div>

          <p className="mt-4 text-sm text-green-600 dark:text-green-400 font-body">
            Данные сохранены ✓
          </p>
        </div>
      </div>
    </div>
  );
}
