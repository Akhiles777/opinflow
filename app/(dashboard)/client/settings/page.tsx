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

export default function ClientSettingsPage() {
  return (
    <div>
      <PageHeader title="Настройки" subtitle="Профиль компании и реквизиты." />

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Профиль компании</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Название компании">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="ООО Поток" />
            </Field>
            <Field label="ИНН">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="7700000000" />
            </Field>
            <Field label="Контактное лицо">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="Иван Иванов" />
            </Field>
            <Field label="Email">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="brand@company.ru" />
            </Field>
            <Field label="Телефон">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="+7 900 000-00-00" />
            </Field>
          </div>
          <div className="mt-6">
            <button type="button" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Сохранить
            </button>
          </div>
        </div>

        <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Реквизиты для счёта</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Юридический адрес">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="Москва, ..." />
            </Field>
            <Field label="Банк">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="Тинькофф" />
            </Field>
            <Field label="Расчётный счёт">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="4070..." />
            </Field>
            <Field label="БИК">
              <input className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" placeholder="0445..." />
            </Field>
          </div>
          <div className="mt-6">
            <button type="button" className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-mid transition-colors">
              Сохранить реквизиты
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

