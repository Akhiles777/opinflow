"use client";

import * as React from "react";
import { useActionState } from "react";
import { updateClientProfileAction } from "@/actions/profile";

type ClientProfileData = {
  companyName: string | null;
  inn: string | null;
  contactName: string | null;
  phone: string | null;
  legalAddress: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankBik: string | null;
  userEmail: string;
};

const initialState = { success: false, error: "", message: "" };

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string | null; placeholder?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-dash-muted font-body">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body placeholder:text-dash-muted"
      />
    </label>
  );
}

export default function ClientProfileForm({ profile }: { profile: ClientProfileData }) {
  const [state, formAction, isPending] = useActionState(updateClientProfileAction, initialState);

  return (
    <form action={formAction} className="mt-8 grid grid-cols-1 gap-6">
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <p className="text-sm font-semibold text-dash-heading font-body">Информация о компании</p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Название компании" name="companyName" defaultValue={profile.companyName} placeholder="ООО ПотокМнений" />
          <Field label="ИНН" name="inn" defaultValue={profile.inn} placeholder="7700000000" />
          <Field label="Контактное лицо" name="contactName" defaultValue={profile.contactName} placeholder="Иван Иванов" />
          <Field label="Email" name="email" defaultValue={profile.userEmail} placeholder="brand@company.ru" />
          <Field label="Телефон" name="phone" defaultValue={profile.phone} placeholder="+7 900 000-00-00" />
        </div>
      </div>

      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <p className="text-sm font-semibold text-dash-heading font-body">Банковские реквизиты</p>
        <p className="mt-2 text-sm text-dash-muted font-body">
          Реквизиты нужны для выставления счётов и документооборота.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Банк" name="bankName" defaultValue={profile.bankName} placeholder="Т-Банк" />
          <Field label="Расчётный счёт" name="bankAccount" defaultValue={profile.bankAccount} placeholder="4070..." />
          <Field label="БИК" name="bankBik" defaultValue={profile.bankBik} placeholder="0445..." />
          <Field label="Юридический адрес" name="legalAddress" defaultValue={profile.legalAddress} placeholder="Москва, ..." />
        </div>
      </div>

      {state.error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{state.error}</p> : null}
      {state.success ? <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">{state.message}</p> : null}

      <div>
        <button type="submit" disabled={isPending} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
          {isPending ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </form>
  );
}
