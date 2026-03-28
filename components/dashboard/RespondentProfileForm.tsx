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
  interests: string[];
  userName: string | null;
  userEmail: string;
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
];

const initialState = { success: false, error: "", message: "" };

function completionRatio(profile: RespondentProfileData) {
  const filled = [
    profile.gender,
    profile.birthDate,
    profile.city,
    profile.income,
    profile.education,
    profile.userEmail,
    profile.interests.length > 0 ? "interests" : null,
  ].filter(Boolean).length;

  return filled / 6;
}

export default function RespondentProfileForm({ profile }: { profile: RespondentProfileData }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateRespondentProfileAction, initialState);
  const completion = useMemo(() => completionRatio(profile), [profile]);
  const [selectedGender, setSelectedGender] = React.useState(profile.gender ?? "");
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(profile.interests);

  React.useEffect(() => {
    setSelectedGender(profile.gender ?? "");
    setSelectedInterests(profile.interests);
  }, [profile.gender, profile.interests]);

  React.useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  function toggleInterest(interest: string) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  return (
    <div>
      {completion < 0.5 ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300 font-body">
          Заполните профиль полностью — вам будут доступны больше опросов.
        </div>
      ) : null}

      <form action={formAction} className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-brand/10 text-2xl font-bold text-brand font-body">
            {profile.userName?.slice(0, 2).toUpperCase() ?? "П"}
          </div>
          <p className="mt-5 font-display text-xl text-dash-heading">{profile.userName ?? "Пользователь"}</p>
          <p className="mt-1 text-sm text-dash-muted font-body">{profile.userEmail}</p>
          <div className="mt-6 rounded-xl border border-dash-border bg-dash-bg p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-dash-muted font-body">Заполнение профиля</p>
            <p className="mt-2 text-2xl font-display text-dash-heading">{Math.round(completion * 100)}%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dash-border bg-dash-card p-6">
          <p className="text-sm font-semibold text-dash-heading font-body">Анкета респондента</p>
          <div className="mt-6 grid gap-6">
            <div>
              <p className="mb-3 text-sm text-dash-muted font-body">Пол</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Мужской", value: "male" },
                  { label: "Женский", value: "female" },
                  { label: "Другое", value: "other" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedGender(option.value)}
                    className={[
                      "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                      selectedGender === option.value
                        ? "border-brand/30 bg-brand/10 text-brand"
                        : "border-dash-border bg-dash-bg text-dash-body hover:text-dash-heading",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="gender" value={selectedGender} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-dash-muted font-body">Дата рождения</span>
                <input name="birthDate" type="date" defaultValue={profile.birthDate ?? ""} className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-dash-muted font-body">Город</span>
                <input name="city" defaultValue={profile.city ?? ""} placeholder="Москва" className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body placeholder:text-dash-muted" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-dash-muted font-body">Уровень дохода</span>
                <select name="income" defaultValue={profile.income ?? ""} className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body">
                  <option value="">Не выбрано</option>
                  <option value="under30k">до 30 000 ₽</option>
                  <option value="30-60k">30 000–60 000 ₽</option>
                  <option value="60-100k">60 000–100 000 ₽</option>
                  <option value="over100k">от 100 000 ₽</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-dash-muted font-body">Образование</span>
                <select name="education" defaultValue={profile.education ?? ""} className="h-11 rounded-xl border border-dash-border bg-dash-bg px-3 text-sm text-dash-body">
                  <option value="">Не выбрано</option>
                  <option value="school">Школа</option>
                  <option value="college">Среднее профессиональное</option>
                  <option value="bachelor">Бакалавриат</option>
                  <option value="master">Магистратура</option>
                  <option value="phd">Аспирантура</option>
                </select>
              </label>
            </div>

            <div>
              <p className="mb-3 text-sm text-dash-muted font-body">Интересы</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={[
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        active
                          ? "border-brand/30 bg-brand/10 text-brand"
                          : "border-dash-border bg-dash-bg text-dash-body hover:text-dash-heading",
                      ].join(" ")}
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

          {state.error ? <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{state.error}</p> : null}
          {state.success ? <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">{state.message}</p> : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={isPending} className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
              {isPending ? "Сохраняем..." : "Сохранить изменения"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
