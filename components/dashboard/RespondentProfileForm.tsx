"use client";

import * as React from "react";
import { useActionState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateRespondentProfileAction } from "@/actions/profile";

type RespondentProfileData = {
  gender: string | null;
  birthDate: string | null;
  city: string | null;
  income: string | null;
  education: string | null;
  hasChildren: string | null;
  employmentStatus: string | null;
  industry: string | null;
  maritalStatus: string | null;
  interests: string[];
  userName: string | null;
  userEmail: string;
  image: string | null;
};

const interestOptions = [
  "Авто",
  "Технологии",
  "Еда и рестораны",
  "Спорт",
  "Путешествия",
  "Мода",
  "Финансы",
  "Здоровье",
  "Кино",
  "Музыка",
  "Игры",
  "Недвижимость",
  "Косметика",
  "Искусство",
];

const initialState = { success: false, error: "", message: "" };

function completionRatio(profile: RespondentProfileData) {
  const filled = [
    profile.gender,
    profile.birthDate,
    profile.city,
    profile.income,
    profile.education,
    profile.hasChildren,
    profile.employmentStatus,
    profile.industry,
    profile.maritalStatus,
    profile.userEmail,
    profile.interests.length > 0 ? "interests" : null,
  ].filter(Boolean).length;

  return filled / 10;
}

export default function RespondentProfileForm({ profile }: { profile: RespondentProfileData }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateRespondentProfileAction, initialState);
  const completion = useMemo(() => completionRatio(profile), [profile]);
  const completionPercent = Math.min(100, Math.round(completion * 100));

  const [selectedGender, setSelectedGender] = React.useState(profile.gender ?? "");
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(profile.interests);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(profile.image);
  const [showBanner, setShowBanner] = React.useState(true);
  const objectUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setSelectedGender(profile.gender ?? "");
    setSelectedInterests(profile.interests);
  }, [profile.gender, profile.interests]);

  React.useEffect(() => {
    setPreviewUrl(profile.image);
  }, [profile.image]);

  React.useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function toggleInterest(interest: string) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setPreviewUrl(profile.image);
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  const fieldCls = "h-11 w-full rounded-xl border border-dash-border bg-dash-bg px-4 text-[14px] text-dash-body outline-none transition-colors focus:border-[#7244F5]/40";

  return (
    <form action={formAction}>
      {/* Dismissible banner */}
      {showBanner && (
        <div className="mt-6 flex items-center justify-between rounded-[14px] border border-[#DDD2FF] bg-[#F3EEFF] px-5 py-3">
          <p className="text-[14px] font-medium text-[#6D3AE2]">
            Заполните профиль полностью — вам будут доступны больше опросов
          </p>
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="ml-4 shrink-0 text-[#6D3AE2] opacity-60 hover:opacity-100"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:items-start">

        {/* Left column: avatar card + completion card */}
        <div className="space-y-4">
          {/* Avatar card */}
          <div className="rounded-[18px] border border-dash-border bg-dash-card p-5">
            <label className="group relative block cursor-pointer overflow-hidden rounded-xl">
              <div className="flex h-50 items-center justify-center rounded-xl bg-dash-bg">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-dash-muted">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-slate-900">
                  Выберите фото
                </span>
              </div>
              <input
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="sr-only"
              />
            </label>
            <div className="mt-4">
              <p className="text-[17px] font-semibold text-dash-heading">{profile.userName || "Пользователь"}</p>
              <p className="mt-0.5 text-[13px] text-dash-muted">{profile.userEmail}</p>
            </div>
          </div>

          {/* Completion card */}
          <div className="rounded-[18px] border border-dash-border bg-dash-card p-5">
            <p className="text-[26px] font-bold text-dash-heading tabular-nums">{completionPercent}%</p>
            <p className="mt-0.5 text-[14px] font-semibold text-dash-muted">Заполнение профиля</p>
            <p className="mt-3 text-[13px] leading-relaxed text-dash-muted">
              Чем полнее анкета, тем больше релевантных опросов и приглашений вы будете получать.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-dash-bg">
              <div className="h-full rounded-full bg-[#7244F5] transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Right column: questionnaire form */}
        <div className="rounded-[18px] border border-dash-border bg-dash-card p-6">
          <h2 className="text-[18px] font-semibold text-dash-heading">Анкета респондента</h2>
          <div className="mt-5 space-y-5">

            {/* Gender */}
            <div>
              <p className="mb-2 text-[13px] text-dash-muted">Пол</p>
              <div className="flex flex-wrap gap-2">
                {["male", "female", "other"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectedGender(v)}
                    className={[
                      "rounded-xl border px-5 py-2 text-[14px] font-semibold transition-colors",
                      selectedGender === v
                        ? "border-[#7244F5] bg-[#7244F5] text-white"
                        : "border-dash-border bg-dash-card text-dash-muted hover:border-[#7244F5]/40 hover:text-dash-heading",
                    ].join(" ")}
                  >
                    {v === "male" ? "Мужской" : v === "female" ? "Женский" : "Другое"}
                  </button>
                ))}
              </div>
              <input type="hidden" name="gender" value={selectedGender} />
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Дата рождения</span>
                <input
                  name="birthDate"
                  type="date"
                  defaultValue={profile.birthDate ?? ""}
                  className={fieldCls}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Город</span>
                <input
                  name="city"
                  defaultValue={profile.city ?? ""}
                  placeholder="Москва"
                  className={fieldCls}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Уровень дохода</span>
                <select
                  name="income"
                  defaultValue={profile.income ?? ""}
                  className={fieldCls}
                >
                  <option value="">Не выбрано</option>
                  <option value="under30k">до 30 000 ₽</option>
                  <option value="30-60k">30 000–60 000 ₽</option>
                  <option value="60-100k">60 000–100 000 ₽</option>
                  <option value="over100k">от 100 000 ₽</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Образование</span>
                <select
                  name="education"
                  defaultValue={profile.education ?? ""}
                  className={fieldCls}
                >
                  <option value="">Не выбрано</option>
                  <option value="school">Школа</option>
                  <option value="college">Среднее профессиональное</option>
                  <option value="bachelor">Бакалавриат</option>
                  <option value="master">Магистратура</option>
                  <option value="phd">Аспирантура</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Есть дети</span>
                <select
                  name="hasChildren"
                  defaultValue={profile.hasChildren ?? ""}
                  className={fieldCls}
                >
                  <option value="">Не выбрано</option>
                  <option value="yes">Да</option>
                  <option value="no">Нет</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Статус занятости</span>
                <select
                  name="employmentStatus"
                  defaultValue={profile.employmentStatus ?? ""}
                  className={fieldCls}
                >
                  <option value="">Не выбрано</option>
                  <option value="working">Работает</option>
                  <option value="not_working">Не работает</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Сфера деятельности</span>
                <select
                  name="industry"
                  defaultValue={profile.industry ?? ""}
                  className={fieldCls}
                >
                  <option value="">Не выбрано</option>
                  <option value="it">IT и технологии</option>
                  <option value="finance">Финансы</option>
                  <option value="education">Образование</option>
                  <option value="medicine">Медицина</option>
                  <option value="retail">Ритейл и продажи</option>
                  <option value="manufacturing">Производство</option>
                  <option value="marketing">Маркетинг и реклама</option>
                  <option value="public">Госструктуры</option>
                  <option value="services">Сфера услуг</option>
                  <option value="other">Другое</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-[13px] text-dash-muted">Семейное положение</span>
                <select
                  name="maritalStatus"
                  defaultValue={profile.maritalStatus ?? ""}
                  className={fieldCls}
                >
                  <option value="">Не выбрано</option>
                  <option value="single">Холост / не замужем</option>
                  <option value="married">Женат / замужем</option>
                </select>
              </label>
            </div>

            {/* Interests */}
            <div>
              <p className="mb-2 text-[13px] text-dash-muted">Интересы</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={
                        active
                          ? "rounded-xl border border-[#7244F5] bg-[#7244F5] px-4 py-2 text-[13px] font-semibold text-white"
                          : "rounded-xl border border-dash-border bg-dash-card px-4 py-2 text-[13px] font-semibold text-dash-muted hover:border-[#7244F5]/40"
                      }
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
              {selectedInterests.map((interest) => (
                <input key={interest} type="hidden" name="interests" value={interest} />
              ))}
            </div>
          </div>

          {state.error ? (
            <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-400">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[13px] text-emerald-400">
              {state.message}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#7244F5] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(114,68,245,0.45)] transition-all hover:bg-[#6238DC] disabled:opacity-60"
            >
              {isPending ? "Сохраняем..." : "Сохранить изменения"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
