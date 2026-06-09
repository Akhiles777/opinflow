"use client";

import { useState, useTransition } from "react";
import { Settings, Percent, Banknote, AlertTriangle, Mail, CheckCircle, Lock, AtSign } from "lucide-react";
import { savePlatformSettingsAction, changeAdminEmailAction, changeAdminPasswordAction } from "@/actions/admin-settings";

type Props = {
  initialData: {
    commissionPercent: number;
    minWithdrawal: number;
    minReward: number;
    maintenanceMode: boolean;
    adminEmail: string;
  };
};

export default function AdminSettingsClient({ initialData }: Props) {
  const [commissionPercent, setCommissionPercent] = useState(String(initialData.commissionPercent));
  const [minWithdrawal, setMinWithdrawal] = useState(String(initialData.minWithdrawal));
  const [minReward, setMinReward] = useState(String(initialData.minReward));
  const [maintenanceMode, setMaintenanceMode] = useState(initialData.maintenanceMode);
  const [adminEmail, setAdminEmail] = useState(initialData.adminEmail);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSaved(false);

    const commission = parseFloat(commissionPercent);
    const withdrawal = parseFloat(minWithdrawal);
    const reward = parseFloat(minReward);

    if (isNaN(commission) || commission < 0 || commission > 100) {
      setError("Комиссия должна быть от 0 до 100%");
      return;
    }
    if (isNaN(withdrawal) || withdrawal < 0) {
      setError("Минимальная сумма вывода должна быть ≥ 0");
      return;
    }
    if (isNaN(reward) || reward < 0) {
      setError("Минимальное вознаграждение должно быть ≥ 0");
      return;
    }

    startTransition(async () => {
      const res = await savePlatformSettingsAction({
        commissionPercent: commission,
        minWithdrawal: withdrawal,
        minReward: reward,
        maintenanceMode,
        adminEmail,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <>
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6 max-w-2xl">

      {/* Commission */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-brand" />
          <p className="text-[15px] font-semibold text-dash-heading">Комиссия платформы</p>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-dash-muted">Процент комиссии с опросов (%)</span>
            <div className="mt-1 relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="h-10 w-full rounded-xl border border-dash-border bg-dash-bg px-4 pr-8 text-sm text-dash-body focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-dash-muted">%</span>
            </div>
            <p className="mt-1 text-xs text-dash-muted">
              Текущая: {initialData.commissionPercent}% — взимается сверх бюджета опроса при создании.
            </p>
          </label>
        </div>
      </div>

      {/* Limits */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-brand" />
          <p className="text-[15px] font-semibold text-dash-heading">Финансовые лимиты</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-dash-muted">Мин. сумма вывода (₽)</span>
            <div className="mt-1 relative">
              <input
                type="number"
                min="0"
                step="1"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(e.target.value)}
                className="h-10 w-full rounded-xl border border-dash-border bg-dash-bg px-4 pr-8 text-sm text-dash-body focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-dash-muted">₽</span>
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-dash-muted">Мин. вознаграждение за опрос (₽)</span>
            <div className="mt-1 relative">
              <input
                type="number"
                min="0"
                step="1"
                value={minReward}
                onChange={(e) => setMinReward(e.target.value)}
                className="h-10 w-full rounded-xl border border-dash-border bg-dash-bg px-4 pr-8 text-sm text-dash-body focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-dash-muted">₽</span>
            </div>
          </label>
        </div>
      </div>

      {/* Admin email */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-brand" />
          <p className="text-[15px] font-semibold text-dash-heading">Контакт администратора</p>
        </div>
        <label className="block">
          <span className="text-sm text-dash-muted">Email для системных уведомлений</span>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@example.ru"
            className="mt-1 h-10 w-full rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      {/* Maintenance mode */}
      <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${maintenanceMode ? "text-amber-500" : "text-dash-muted"}`} />
            <div>
              <p className="text-[15px] font-semibold text-dash-heading">Режим технических работ</p>
              <p className="text-sm text-dash-muted">Показывает баннер о недоступности на сайте</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode((v) => !v)}
            className={[
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand/20",
              maintenanceMode ? "bg-amber-500" : "bg-dash-border",
            ].join(" ")}
            role="switch"
            aria-checked={maintenanceMode}
          >
            <span
              className={[
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                maintenanceMode ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
        </div>
        {maintenanceMode && (
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Режим технических работ включён — пользователи видят баннер о недоступности.
            </p>
          </div>
        )}
      </div>

      {/* Error & submit */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {saved && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Настройки сохранены</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        <Settings className="h-4 w-4" />
        {isPending ? "Сохраняем..." : "Сохранить настройки"}
      </button>
    </form>

    <AdminCredentials />
    </>
  );
}

function AdminCredentials() {
  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isPendingEmail, startEmailTransition] = useTransition();
  const [isPendingPassword, startPasswordTransition] = useTransition();

  function handleEmailSubmit() {
    setEmailError(null);
    setEmailSuccess(false);
    startEmailTransition(async () => {
      const res = await changeAdminEmailAction(emailForm.newEmail, emailForm.currentPassword);
      if (res.error) { setEmailError(res.error); return; }
      setEmailSuccess(true);
      setEmailForm({ newEmail: "", currentPassword: "" });
      setTimeout(() => setEmailSuccess(false), 3000);
    });
  }

  function handlePasswordSubmit() {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    startPasswordTransition(async () => {
      const res = await changeAdminPasswordAction(passwordForm.currentPassword, passwordForm.newPassword);
      if (res.error) { setPasswordError(res.error); return; }
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    });
  }

  const inputCls = "h-10 w-full rounded-xl border border-dash-border bg-dash-bg px-4 text-sm text-dash-body placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mt-8 max-w-2xl space-y-6">
      <h2 className="text-[16px] font-semibold text-dash-heading">Учётные данные администратора</h2>

      {/* Email */}
      <form onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }} className="rounded-2xl border border-dash-border bg-dash-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <AtSign className="h-5 w-5 text-brand" />
          <p className="text-[15px] font-semibold text-dash-heading">Изменить email для входа</p>
        </div>
        <label className="block">
          <span className="text-sm text-dash-muted">Новый email</span>
          <input
            type="email"
            value={emailForm.newEmail}
            onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
            placeholder="admin@example.ru"
            className={`mt-1 ${inputCls}`}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-dash-muted">Текущий пароль (для подтверждения)</span>
          <input
            type="password"
            value={emailForm.currentPassword}
            onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="••••••••"
            className={`mt-1 ${inputCls}`}
            required
          />
        </label>
        {emailError && <p className="text-sm text-red-500">{emailError}</p>}
        {emailSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Email успешно изменён
          </div>
        )}
        <button
          type="submit"
          disabled={isPendingEmail}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {isPendingEmail ? "Сохраняем..." : "Сменить email"}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }} className="rounded-2xl border border-dash-border bg-dash-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-brand" />
          <p className="text-[15px] font-semibold text-dash-heading">Изменить пароль</p>
        </div>
        <label className="block">
          <span className="text-sm text-dash-muted">Текущий пароль</span>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="••••••••"
            className={`mt-1 ${inputCls}`}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-dash-muted">Новый пароль (мин. 8 символов)</span>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="••••••••"
            className={`mt-1 ${inputCls}`}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-dash-muted">Повторите новый пароль</span>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="••••••••"
            className={`mt-1 ${inputCls}`}
            required
          />
        </label>
        {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
        {passwordSuccess && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Пароль успешно изменён
          </div>
        )}
        <button
          type="submit"
          disabled={isPendingPassword}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {isPendingPassword ? "Сохраняем..." : "Сменить пароль"}
        </button>
      </form>
    </div>
  );
}
